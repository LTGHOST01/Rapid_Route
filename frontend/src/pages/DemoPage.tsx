import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { api } from "../lib/api";
import { DispatchMap, MapsApiGate } from "../components/map/DispatchMap";
import { StatusChip, roadTone, trafficTone } from "../components/ui";
import { displayScore } from "../lib/format";
import { roadLabel, trafficLabel } from "../lib/labels";
import type { Candidate, Explanation, RoadCondition, Vehicle } from "../types";

type ScenarioId = "low_traffic" | "heavy_traffic" | "road_blockage" | "destination_unreachable";

type Catalog = {
  label: string;
  scenarios: Array<{
    id: ScenarioId;
    title: string;
    description: string;
    expectation: { expect: string; passWhen: string };
  }>;
};

type ScenarioRun = {
  id: ScenarioId;
  title: string;
  description: string;
  passed: boolean;
  expectation: { expect: string; passWhen: string };
  result: {
    noSuitableRoute: boolean;
    message: string;
    recommended: {
      label: string;
      trafficLevel: string;
      roadStatus: string;
      etaSeconds: number;
      score: number | null;
    } | null;
    candidates: Array<{
      label: string;
      trafficLevel: string;
      roadStatus: string;
      blocked: boolean;
      score: number | null;
    }>;
    explanation: Explanation;
  };
  mapDemo: {
    label: string;
    origin: { lat: number; lng: number; label: string };
    destination: { lat: number; lng: number; label: string };
    vehicle: { callSign: string; type: string; lat: number; lng: number };
    candidates: Candidate[];
    selectedId: string | null;
  };
};

const COPY: Record<
  ScenarioId,
  { whatHappens: string[]; badge: string }
> = {
  low_traffic: {
    badge: "Fastest suitable route",
    whatHappens: [
      "Three clear corridors to KEM.",
      "RapidRoute scores them. Time has the highest weight.",
      "The fastest low-traffic road is selected.",
    ],
  },
  heavy_traffic: {
    badge: "Skip the jam",
    whatHappens: [
      "The short primary corridor is congested.",
      "It stays eligible but is heavily penalised.",
      "A clearer alternative wins.",
    ],
  },
  road_blockage: {
    badge: "Blocked = never scored",
    whatHappens: [
      "The first corridor is blocked.",
      "It is removed before scoring.",
      "The next clear road is selected.",
    ],
  },
  destination_unreachable: {
    badge: "No safe path",
    whatHappens: [
      "Every corridor is blocked.",
      "Nothing is scored as safe.",
      "The system reports no suitable route.",
    ],
  },
};

const SCENARIO_IDS: ScenarioId[] = [
  "low_traffic",
  "heavy_traffic",
  "road_blockage",
  "destination_unreachable",
];

export function DemoPage() {
  const { scenarioId } = useParams();
  if (scenarioId && !SCENARIO_IDS.includes(scenarioId as ScenarioId)) {
    return <Navigate to="/demo" replace />;
  }
  if (scenarioId) return <ScenarioDemo id={scenarioId as ScenarioId} />;
  return <ScenarioIndex />;
}

function ScenarioIndex() {
  const catalog = useQuery({
    queryKey: ["eval-catalog"],
    queryFn: () => api<Catalog>("/eval/scenarios"),
  });

  return (
    <div className="h-full overflow-y-auto bg-soft">
      <div className="mx-auto max-w-5xl px-5 py-6">
        <div className="mb-1 inline-flex bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
          EVALUATION SIMULATION
        </div>
        <h1 className="text-[22px] font-bold">Official scoring scenarios</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-muted">
          Isolated tests on the mandatory CSV/JSON schema. Same scoring engine as live
          dispatch. Not municipal road feeds. Not live GPS.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {(catalog.data?.scenarios ?? []).map((scenario, index) => (
            <Link
              key={scenario.id}
              to={`/demo/${scenario.id}`}
              className="border border-line bg-white p-4 hover:border-nav"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold text-nav">SCENARIO {index + 1}</div>
                  <h2 className="mt-1 text-[17px] font-semibold">{scenario.title}</h2>
                </div>
                <span className="shrink-0 text-[11px] text-nav">Open →</span>
              </div>
              <p className="mt-2 text-[13px] text-muted">{scenario.description}</p>
              <p className="mt-3 text-[12px] text-ink">{COPY[scenario.id]?.badge}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScenarioDemo({ id }: { id: ScenarioId }) {
  const navigate = useNavigate();
  const [step, setStep] = useState<0 | 1>(0);
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [seq, setSeq] = useState(0);
  const run = useQuery({
    queryKey: ["eval-scenario", id],
    queryFn: () => api<ScenarioRun>(`/eval/scenarios/${id}`),
  });

  useEffect(() => {
    setStep(0);
    setInspectId(null);
  }, [id, seq]);

  const demo = run.data?.mapDemo;
  const result = run.data?.result;
  const decided = step === 1;
  const selectedId = inspectId ?? (decided ? (demo?.selectedId ?? null) : naivePick(id, demo));
  const candidates = useMemo(() => {
    if (!demo) return [];
    if (decided) return demo.candidates;
    return demo.candidates.map((c) => ({ ...c, blocked: false }));
  }, [demo, decided]);

  const roads = useMemo<RoadCondition[]>(() => {
    if (!demo || !decided) return [];
    return demo.candidates
      .filter((c) => c.blocked || c.roadImpact === "CONGESTED" || c.roadImpact === "BLOCKED")
      .map((c, index) => ({
        id: `sim-${c.id}`,
        title: c.blocked ? "Blocked corridor" : "Congested corridor",
        status: c.blocked || c.roadImpact === "BLOCKED" ? "BLOCKED" : "CONGESTED",
        corridorId: c.corridorIds[0] ?? `SIM_${index}`,
        geometry: { polyline: c.polyline, label: c.label },
        simulated: true,
        activeFrom: new Date().toISOString(),
        activeUntil: null,
      }));
  }, [demo, decided]);

  const vehicle: Vehicle | null = demo
    ? {
        id: "eval-amb",
        callSign: demo.vehicle.callSign,
        type: demo.vehicle.type === "FIRE" ? "FIRE" : "AMBULANCE",
        latitude: demo.vehicle.lat,
        longitude: demo.vehicle.lng,
        locationLabel: "AMB-101 post",
        status: "ASSIGNED",
        capabilities: {},
        assignedEmergencyId: null,
      }
    : null;

  const recommended = demo?.candidates.find((c) => c.id === demo.selectedId) ?? null;
  const copy = COPY[id];
  const phaseLabel =
    id === "low_traffic"
      ? decided
        ? "RapidRoute selected the fastest suitable route"
        : "Comparing clear corridors"
      : id === "heavy_traffic"
        ? decided
          ? "Primary corridor congested — alternative selected"
          : "Shortest road looks tempting"
        : id === "road_blockage"
          ? decided
            ? "Blocked road removed — alternative selected"
            : "Before the blockage"
          : decided
            ? "All corridors blocked"
            : "Options on the table";

  return (
    <MapsApiGate>
      <div className="flex h-full flex-col bg-soft md:flex-row">
        <main className="relative min-h-0 min-w-0 flex-1">
          {demo ? (
            <DispatchMap
              vehicles={vehicle ? [vehicle] : []}
              origin={demo.origin}
              destination={demo.destination}
              candidates={candidates}
              selectedId={selectedId}
              vehiclePosition={{ lat: demo.vehicle.lat, lng: demo.vehicle.lng }}
              movingVehicle={
                vehicle
                  ? { id: vehicle.id, callSign: vehicle.callSign, status: "ASSIGNED", type: vehicle.type }
                  : null
              }
              hospitals={[
                {
                  id: "kem",
                  label: demo.destination.label,
                  lat: demo.destination.lat,
                  lng: demo.destination.lng,
                  area: "Parel",
                  facilityType: "Trauma hospital",
                },
              ]}
              destinationKind="hospital"
              roadConditions={roads}
            />
          ) : (
            <div className="grid h-full place-items-center text-[13px] text-muted">
              {run.isError ? "Could not load scenario." : "Loading evaluation…"}
            </div>
          )}
          <button
            type="button"
            onClick={() => navigate("/demo")}
            className="absolute left-3 top-3 z-20 flex items-center gap-1.5 border border-line bg-white px-3 py-1.5 text-[13px] shadow-sm"
          >
            <ArrowLeft size={14} />
            Back to scenarios
          </button>
          <div className="pointer-events-none absolute left-3 top-14 z-20 space-y-1">
            <div className="bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
              EVALUATION SIMULATION
            </div>
            <div className="max-w-xs border border-line bg-white px-2 py-1 text-[11px] text-muted">
              Schema times, not live Google ETAs. Same scoring engine as Dispatch.
            </div>
          </div>
        </main>

        <aside className="h-[42%] shrink-0 overflow-y-auto border-t border-line bg-white md:h-full md:w-[320px] md:border-l md:border-t-0">
          <div className="border-b border-line px-4 py-3">
            <div className="text-[11px] font-bold text-nav">SCENARIO</div>
            <h1 className="mt-0.5 text-[17px] font-semibold">{run.data?.title ?? "…"}</h1>
            <p className="mt-1 text-[12px] font-medium text-ink">{phaseLabel}</p>
          </div>

          <div className="space-y-3 px-4 py-3">
            <p className="text-[12px] text-muted">Priority: Critical — time first.</p>

            <ol className="space-y-1 text-[12px] text-muted">
              {copy?.whatHappens.map((line) => (
                <li key={line}>— {line}</li>
              ))}
            </ol>

            <div className="flex flex-wrap gap-2">
              {step === 0 ? (
                <button
                  type="button"
                  className="border border-nav bg-nav px-3 py-1.5 text-[12px] font-medium text-white"
                  onClick={() => setStep(1)}
                >
                  Apply RapidRoute
                </button>
              ) : (
                <button
                  type="button"
                  className="border border-line px-3 py-1.5 text-[12px] font-medium text-nav"
                  onClick={() => setSeq((n) => n + 1)}
                >
                  Replay
                </button>
              )}
            </div>

            {decided && result?.noSuitableRoute && (
              <div className="border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-medium text-critical">
                No suitable route available
              </div>
            )}

            {decided && recommended && !result?.noSuitableRoute && (
              <div className="border border-line p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11px] text-muted">Recommended · {recommended.label}</div>
                    <div className="text-[20px] font-bold tabular">{recommended.etaLabel}</div>
                    <div className="text-[12px] text-muted">{recommended.distanceLabel}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-muted">Score</div>
                    <div className="text-[22px] font-bold tabular">{displayScore(recommended.score) ?? "—"}</div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusChip tone={trafficTone(recommended.trafficLevel)}>
                    {trafficLabel(recommended.trafficLevel)} traffic
                  </StatusChip>
                  <StatusChip tone={roadTone(recommended.roadImpact)}>
                    {roadLabel(recommended.roadImpact)}
                  </StatusChip>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="text-[11px] font-medium text-muted">Routes — click to inspect</div>
              {candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => setInspectId(candidate.id)}
                  className={`flex w-full items-center justify-between border px-2 py-1.5 text-left text-[12px] ${
                    candidate.id === selectedId ? "border-nav bg-blue-50/50" : "border-line"
                  } ${candidate.blocked ? "opacity-60" : ""}`}
                >
                  <div>
                    <div className="font-medium">
                      {candidate.label} · {candidate.etaLabel}
                    </div>
                    <div className="text-[11px] text-muted">
                      {candidate.blocked ? "Blocked — not scored" : candidate.distanceLabel}
                    </div>
                  </div>
                  <div className="tabular">{candidate.blocked ? "—" : displayScore(candidate.score) ?? "—"}</div>
                </button>
              ))}
            </div>

            {decided && result?.explanation && (
              <div>
                <div className="text-[13px] font-semibold">Why this route?</div>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{result.explanation.summary}</p>
                {result.explanation.factors?.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-[12px] text-muted">
                    {result.explanation.factors.slice(0, 3).map((factor) => (
                      <li key={factor}>— {factor}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {decided && run.data && (
              <div className="flex items-center justify-between border-t border-line pt-3">
                <span className="text-[12px] text-muted">Evaluator result</span>
                <StatusChip tone={run.data.passed ? "clear" : "critical"}>
                  {run.data.passed ? "Pass" : "Fail"}
                </StatusChip>
              </div>
            )}
          </div>
        </aside>
      </div>
    </MapsApiGate>
  );
}

function naivePick(id: ScenarioId, demo: ScenarioRun["mapDemo"] | undefined) {
  if (!demo?.candidates[0]) return null;
  if (id === "low_traffic") return null;
  return demo.candidates[0].id;
}
