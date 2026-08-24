import { describe, expect, it } from "vitest";
import {
  pickWinner,
  scoreCandidates,
  shouldAdoptReroute,
} from "../src/services/routeScoringService";

describe("RapidRoute scoring", () => {
  it("matches the documented critical-incident example", () => {
    const scored = scoreCandidates(
      [
        {
          label: "A",
          etaSeconds: 600,
          distanceMeters: 8000,
          trafficLevel: "HIGH",
          roadImpact: "CLEAR",
          blocked: false,
        },
        {
          label: "B",
          etaSeconds: 660,
          distanceMeters: 7000,
          trafficLevel: "MEDIUM",
          roadImpact: "CLEAR",
          blocked: false,
        },
      ],
      "CRITICAL",
    );

    const a = scored.find((c) => c.label === "A")!;
    const b = scored.find((c) => c.label === "B")!;

    expect(a.etaPenalty).toBe(0);
    expect(a.distancePenalty).toBe(100);
    expect(a.trafficPenalty).toBe(85);
    expect(a.roadPenalty).toBe(0);
    expect(a.score).toBe(27);

    expect(b.etaPenalty).toBe(100);
    expect(b.distancePenalty).toBe(0);
    expect(b.trafficPenalty).toBe(55);
    expect(b.score).toBe(66);

    expect(pickWinner(scored)?.label).toBe("A");
  });

  it("excludes blocked candidates before scoring", () => {
    const scored = scoreCandidates(
      [
        {
          label: "A",
          etaSeconds: 600,
          distanceMeters: 8000,
          trafficLevel: "HIGH",
          roadImpact: "BLOCKED",
          blocked: true,
        },
        {
          label: "B",
          etaSeconds: 660,
          distanceMeters: 7000,
          trafficLevel: "MEDIUM",
          roadImpact: "CLEAR",
          blocked: false,
        },
      ],
      "CRITICAL",
    );

    expect(scored[0].eligible).toBe(false);
    expect(scored[0].score).toBeNull();
    expect(scored[0].ineligibilityReason).toMatch(/blocked/i);
    expect(pickWinner(scored)?.label).toBe("B");
  });

  it("returns no winner when every candidate is blocked", () => {
    const scored = scoreCandidates(
      [
        {
          label: "A",
          etaSeconds: 600,
          distanceMeters: 8000,
          trafficLevel: "LOW",
          roadImpact: "BLOCKED",
          blocked: true,
        },
        {
          label: "B",
          etaSeconds: 700,
          distanceMeters: 9000,
          trafficLevel: "LOW",
          roadImpact: "BLOCKED",
          blocked: true,
        },
      ],
      "HIGH",
    );
    expect(pickWinner(scored)).toBeNull();
  });

  it("uses a neutral traffic penalty when traffic is unavailable", () => {
    const scored = scoreCandidates(
      [
        {
          label: "A",
          etaSeconds: 500,
          distanceMeters: 5000,
          trafficLevel: "UNKNOWN",
          roadImpact: "CLEAR",
          blocked: false,
        },
      ],
      "HIGH",
    );
    expect(scored[0].trafficPenalty).toBe(50);
  });
});

describe("reroute threshold", () => {
  it("adopts when the current route is blocked", () => {
    const decision = shouldAdoptReroute(
      { score: 20, etaSeconds: 400, blocked: true },
      { score: 40, etaSeconds: 500, blocked: false },
    );
    expect(decision.adopt).toBe(true);
  });

  it("adopts when score improves by at least 10 points", () => {
    const decision = shouldAdoptReroute(
      { score: 40, etaSeconds: 500, blocked: false },
      { score: 28, etaSeconds: 480, blocked: false },
    );
    expect(decision.adopt).toBe(true);
  });

  it("adopts when ETA improves by at least 60 seconds", () => {
    const decision = shouldAdoptReroute(
      { score: 30, etaSeconds: 600, blocked: false },
      { score: 28, etaSeconds: 530, blocked: false },
    );
    expect(decision.adopt).toBe(true);
  });

  it("declines noisy improvements", () => {
    const decision = shouldAdoptReroute(
      { score: 30, etaSeconds: 500, blocked: false },
      { score: 27, etaSeconds: 480, blocked: false },
    );
    expect(decision.adopt).toBe(false);
  });
});
