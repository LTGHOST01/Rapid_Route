import type { EmergencyPriority, RoadStatus, TrafficLevel } from "@prisma/client";

export type ScoringWeights = {
  eta: number;
  distance: number;
  traffic: number;
  road: number;
};

export const PRIORITY_WEIGHTS: Record<EmergencyPriority, ScoringWeights> = {
  CRITICAL: { eta: 0.55, distance: 0.1, traffic: 0.2, road: 0.15 },
  HIGH: { eta: 0.45, distance: 0.15, traffic: 0.25, road: 0.15 },
  STANDARD: { eta: 0.35, distance: 0.2, traffic: 0.25, road: 0.2 },
};

export const TRAFFIC_PENALTY: Record<TrafficLevel, number> = {
  LOW: 20,
  MEDIUM: 55,
  HIGH: 85,
  UNKNOWN: 50,
};

export const ROAD_PENALTY: Record<RoadStatus, number> = {
  CLEAR: 0,
  ADVISORY: 25,
  CONGESTED: 60,
  BLOCKED: 100,
};

export type ScoreInput = {
  id?: string;
  label: string;
  etaSeconds: number;
  distanceMeters: number;
  trafficLevel: TrafficLevel;
  roadImpact: RoadStatus;
  blocked: boolean;
  roadConditionIds?: string[];
  providerRouteIndex?: number;
  polyline?: string;
  corridorIds?: string[];
};

export function qualityFromPenalty(penalty: number | null | undefined): number | null {
  if (penalty == null || Number.isNaN(penalty)) return null;
  return Number(Math.max(0, Math.min(100, 100 - penalty)).toFixed(2));
}

export type ScoredCandidate<T extends ScoreInput = ScoreInput> = T & {
  eligible: boolean;
  score: number | null;
  qualityScore: number | null;
  etaPenalty: number;
  distancePenalty: number;
  trafficPenalty: number;
  roadPenalty: number;
  ineligibilityReason: string | null;
};

export type SelectionExplanation = {
  weights: ScoringWeights;
  winnerLabel: string | null;
  summary: string;
  reason: string;
  factors: string[];
  excluded: Array<{ label: string; reason: string }>;
  emergencyPriority: EmergencyPriority;
  blocked: boolean;
  components: {
    etaPenalty: number;
    distancePenalty: number;
    trafficPenalty: number;
    roadPenalty: number;
    travelTimeScore: number;
    distanceScore: number;
    trafficScore: number;
    roadStatusScore: number;
    score: number;
  } | null;
  roadConditionIds: string[];
};

function minMaxPenalty(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
}

export function scoreCandidates<T extends ScoreInput>(
  candidates: T[],
  priority: EmergencyPriority,
): ScoredCandidate<T>[] {
  const weights = PRIORITY_WEIGHTS[priority];
  const etas = candidates.map((c) => c.etaSeconds);
  const distances = candidates.map((c) => c.distanceMeters);
  const minEta = Math.min(...etas);
  const maxEta = Math.max(...etas);
  const minDistance = Math.min(...distances);
  const maxDistance = Math.max(...distances);

  return candidates.map((candidate) => {
    const etaPenalty = minMaxPenalty(candidate.etaSeconds, minEta, maxEta);
    const distancePenalty = minMaxPenalty(candidate.distanceMeters, minDistance, maxDistance);
    const trafficPenalty = TRAFFIC_PENALTY[candidate.trafficLevel];
    const roadPenalty = ROAD_PENALTY[candidate.roadImpact];

    if (candidate.blocked || candidate.roadImpact === "BLOCKED") {
      return {
        ...candidate,
        blocked: true,
        eligible: false,
        score: null,
        qualityScore: null,
        etaPenalty,
        distancePenalty,
        trafficPenalty,
        roadPenalty,
        ineligibilityReason: "Not eligible — blocked road",
      };
    }

    const score =
      weights.eta * etaPenalty +
      weights.distance * distancePenalty +
      weights.traffic * trafficPenalty +
      weights.road * roadPenalty;

    return {
      ...candidate,
      eligible: true,
      score: Number(score.toFixed(2)),
      qualityScore: qualityFromPenalty(Number(score.toFixed(2))),
      etaPenalty: Number(etaPenalty.toFixed(2)),
      distancePenalty: Number(distancePenalty.toFixed(2)),
      trafficPenalty,
      roadPenalty,
      ineligibilityReason: null,
    };
  });
}

export function pickWinner(scored: ScoredCandidate[]): ScoredCandidate | null {
  const eligible = scored.filter((c) => c.eligible && c.score != null);
  if (eligible.length === 0) return null;
  return [...eligible].sort((a, b) => {
    if ((a.score ?? 999) !== (b.score ?? 999)) return (a.score ?? 999) - (b.score ?? 999);
    return a.etaSeconds - b.etaSeconds;
  })[0];
}

export function explainSelection(
  scored: ScoredCandidate[],
  winner: ScoredCandidate | null,
  priority: EmergencyPriority,
): SelectionExplanation {
  const weights = PRIORITY_WEIGHTS[priority];
  const excluded = scored
    .filter((c) => !c.eligible)
    .map((c) => ({ label: c.label, reason: c.ineligibilityReason ?? "Ineligible" }));

  if (!winner || winner.score == null) {
    const summary =
      "No suitable route available. The destination cannot currently be reached through the available routes.";
    return {
      weights,
      winnerLabel: null,
      summary,
      reason: summary,
      emergencyPriority: priority,
      blocked: true,
      factors: ["Hard safety rule: blocked roads are excluded before scoring"],
      excluded,
      components: null,
      roadConditionIds: [],
    };
  }

  const others = scored.filter((c) => c.eligible && c.label !== winner.label);
  const nextBest = [...others].sort((a, b) => (a.score ?? 999) - (b.score ?? 999))[0];
  const factors: string[] = [];

  if (nextBest) {
    const etaDelta = nextBest.etaSeconds - winner.etaSeconds;
    if (etaDelta >= 30) {
      factors.push(
        `Fastest eligible option — ${Math.round(etaDelta / 60)} min quicker than ${nextBest.label}`,
      );
    } else if (etaDelta > 0) {
      factors.push("Slightly faster than the next eligible candidate");
    } else if (etaDelta < 0) {
      factors.push("Not the shortest ETA; selected for a better combined operational score");
    }
  } else {
    factors.push("Only eligible candidate after blocked-road exclusion");
  }

  if (winner.trafficLevel === "HIGH") {
    factors.push(
      `${priority} priority accepts higher traffic because travel time still dominates the weights`,
    );
  } else if (winner.trafficLevel === "LOW") {
    factors.push("Lower traffic penalty than other candidates");
  } else if (winner.trafficLevel === "UNKNOWN") {
    factors.push("Provider traffic signal unavailable — used a neutral traffic penalty of 50");
  }

  if (winner.roadImpact === "CONGESTED") {
    factors.push("Local corridor is congested but not blocked, so it remains eligible");
  } else if (winner.roadImpact === "CLEAR") {
    factors.push("No active local blockage or congestion on this corridor");
  } else if (winner.roadImpact === "ADVISORY") {
    factors.push("Local advisory noted; not a hard exclusion");
  }

  if (winner.distancePenalty === 0 && scored.some((c) => c.distanceMeters > winner.distanceMeters)) {
    factors.push("Shortest distance among the returned candidates");
  }

  const summary = buildSummary(winner, nextBest, priority);

  const reason =
    "Lowest weighted emergency travel score while avoiding blocked roads.";

  return {
    weights,
    winnerLabel: winner.label,
    summary,
    reason,
    emergencyPriority: priority,
    blocked: false,
    factors,
    excluded,
    components: {
      etaPenalty: winner.etaPenalty,
      distancePenalty: winner.distancePenalty,
      trafficPenalty: winner.trafficPenalty,
      roadPenalty: winner.roadPenalty,
      travelTimeScore: qualityFromPenalty(winner.etaPenalty) ?? 0,
      distanceScore: qualityFromPenalty(winner.distancePenalty) ?? 0,
      trafficScore: qualityFromPenalty(winner.trafficPenalty) ?? 0,
      roadStatusScore: qualityFromPenalty(winner.roadPenalty) ?? 0,
      score: qualityFromPenalty(winner.score) ?? 0,
    },
    roadConditionIds: winner.roadConditionIds ?? [],
  };
}

function buildSummary(
  winner: ScoredCandidate,
  nextBest: ScoredCandidate | undefined,
  priority: EmergencyPriority,
): string {
  const quality = qualityFromPenalty(winner.score);
  const nextQuality = nextBest?.score != null ? qualityFromPenalty(nextBest.score) : null;
  const parts = [
    `${winner.label} is recommended for this ${priority.toLowerCase()} incident (RapidRoute score ${quality}).`,
  ];
  if (nextQuality != null) {
    parts.push(
      `It outranks ${nextBest!.label} (score ${nextQuality}) after weighting ETA, distance, traffic, and local road status.`,
    );
  }
  return parts.join(" ");
}

export function shouldAdoptReroute(
  current: { score: number | null; etaSeconds: number; blocked: boolean },
  next: { score: number | null; etaSeconds: number; blocked: boolean },
): { adopt: boolean; reason: string } {
  if (next.blocked || next.score == null) {
    return { adopt: false, reason: "Replacement candidate is blocked or ineligible" };
  }
  if (current.blocked || current.score == null) {
    return { adopt: true, reason: "Current route is blocked or no longer eligible" };
  }
  const scoreImprove = current.score - next.score;
  const etaImprove = current.etaSeconds - next.etaSeconds;
  if (scoreImprove >= 10) {
    return {
      adopt: true,
      reason: `Score improved by ${scoreImprove.toFixed(1)} points (threshold 10)`,
    };
  }
  if (etaImprove >= 60) {
    return {
      adopt: true,
      reason: `ETA improved by ${etaImprove} seconds (threshold 60s)`,
    };
  }
  return {
    adopt: false,
    reason: "No material improvement — need 10 score points or 60 seconds of ETA",
  };
}

export function candidateBreakdown(candidate: ScoredCandidate) {
  return {
    etaPenalty: candidate.etaPenalty,
    distancePenalty: candidate.distancePenalty,
    trafficPenalty: candidate.trafficPenalty,
    roadPenalty: candidate.roadPenalty,
    travelTimeScore: qualityFromPenalty(candidate.etaPenalty),
    distanceScore: qualityFromPenalty(candidate.distancePenalty),
    trafficScore: qualityFromPenalty(candidate.trafficPenalty),
    roadStatusScore: qualityFromPenalty(candidate.roadPenalty),
    qualityScore: qualityFromPenalty(candidate.score),
    score: qualityFromPenalty(candidate.score),
    penalty: candidate.score,
    eligible: candidate.eligible,
    blocked: candidate.blocked,
    ineligibilityReason: candidate.ineligibilityReason,
  };
}
