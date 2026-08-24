import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { api, ApiError } from "../lib/api";
import { MUMBAI_DEMO, formatEtaClock, formatWhen, type LatLng } from "../lib/geo";
import { DEMO_PRESETS, priorityLabel, roadLabel, trafficLabel } from "../lib/labels";
import {
  Button,
  Field,
  inputClass,
  Panel,
  StatusChip,
  priorityTone,
  roadTone,
  trafficTone,
  vehicleTone,
} from "../components/ui";
import { DispatchMap } from "../components/map/DispatchMap";
import type {
  Candidate,
  Emergency,
  Explanation,
  JourneyDetail,
  Priority,
  RoadCondition,
  RoadStatus,
  RouteRequest,
  RerouteResult,
  Vehicle,
} from "../types";
import { cn } from "../lib/cn";

type EmergencyDetail = {
  emergency: Emergency;
  recommendedVehicles: Array<Vehicle & { distanceMeters: number }>;
  latestRouteRequest: RouteRequest | null;
  journeyId: string | null;
};

const emptyForm = {
  priority: "CRITICAL" as Priority,
  originLabel: "",
  originLat: "",
  originLng: "",
  destinationLabel: "",
  destinationLat: "",
  destinationLng: "",
  notes: "",
};

export function DispatchPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [pinMode, setPinMode] = useState<"origin" | "destination" | null>("origin");
  const [error, setError] = useState<string | null>(null);
  const [rerouteNotice, setRerouteNotice] = useState<RerouteResult | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  const emergencies = useQuery({
    queryKey: ["emergencies"],
    queryFn: () => api<{ emergencies: Emergency[] }>("/emergencies"),
    refetchInterval: 8000,
  });

  const vehicles = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => api<{ vehicles: Vehicle[] }>("/vehicles"),
    refetchInterval: 8000,
  });

  const roads = useQuery({
    queryKey: ["roads"],
    queryFn: () => api<{ roadConditions: RoadCondition[] }>("/road-conditions?active=true"),
    refetchInterval: 8000,
  });

  const detail = useQuery({
    queryKey: ["emergency", selectedId],
    enabled: Boolean(selectedId),
    queryFn: () => api<EmergencyDetail>(`/emergencies/${selectedId}`),
  });

  const journeyId = detail.data?.journeyId ?? null;
  const journey = useQuery({
    queryKey: ["journey", journeyId],
    enabled: Boolean(journeyId),
    queryFn: () => api<JourneyDetail>(`/journeys/${journeyId}`),
    refetchInterval: 2500,
  });

  useEffect(() => {
    if (!journeyId || journey.data?.journey.status !== "ACTIVE") return;
    const timer = setInterval(async () => {
      try {
        const next = await api<JourneyDetail>(`/journeys/${journeyId}/tick`, {
          method: "POST",
          body: JSON.stringify({ steps: 1 }),
        });
        qc.setQueryData(["journey", journeyId], next);
      } catch {
        /* journey may have completed */
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [journeyId, journey.data?.journey.status, qc]);

  const createEmergency = useMutation({
    mutationFn: () =>
      api<{ emergency: Emergency }>("/emergencies", {
        method: "POST",
        body: JSON.stringify({
          priority: form.priority,
          originLabel: form.originLabel,
          originLat: Number(form.originLat),
          originLng: Number(form.originLng),
          destinationLabel: form.destinationLabel,
          destinationLat: Number(form.destinationLat),
          destinationLng: Number(form.destinationLng),
          notes: form.notes,
        }),
      }),
    onSuccess: (data) => {
      setSelectedId(data.emergency.id);
      setCreating(false);
      setError(null);
      qc.invalidateQueries({ queryKey: ["emergencies"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Create failed"),
  });

  const assignVehicle = useMutation({
    mutationFn: (vehicleId?: string) =>
      api(`/emergencies/${selectedId}/assign-vehicle`, {
        method: "POST",
        body: JSON.stringify(vehicleId ? { vehicleId } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emergency", selectedId] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Assign failed"),
  });

  const calculateRoutes = useMutation({
    mutationFn: () =>
      api<RouteRequest & { explanation: Explanation; noEligibleRoute: boolean }>(
        `/emergencies/${selectedId}/routes`,
        { method: "POST", body: JSON.stringify({}) },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["emergency", selectedId] }),
    onError: (err) => setError(err instanceof ApiError ? err.message : "Routing failed"),
  });

  const dispatch = useMutation({
    mutationFn: (candidateId?: string) =>
      api(`/emergencies/${selectedId}/dispatch`, {
        method: "POST",
        body: JSON.stringify(candidateId ? { candidateId } : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emergency", selectedId] });
      qc.invalidateQueries({ queryKey: ["emergencies"] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Dispatch failed"),
  });

  const selectRoute = useMutation({
    mutationFn: (candidateId: string) =>
      api(`/emergencies/${selectedId}/select-route`, {
        method: "POST",
        body: JSON.stringify({ candidateId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["emergency", selectedId] }),
  });

  const demoScenario = useMutation({
    mutationFn: (status: RoadStatus) =>
      api<{ reroute: RerouteResult }>(`/demo/road-scenario`, {
        method: "POST",
        body: JSON.stringify({
          status,
          corridorId: "MARINE_DRIVE",
          journeyId,
        }),
      }),
    onSuccess: (data) => {
      setRerouteNotice(data.reroute);
      qc.invalidateQueries({ queryKey: ["journey", journeyId] });
      qc.invalidateQueries({ queryKey: ["roads"] });
      qc.invalidateQueries({ queryKey: ["emergency", selectedId] });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Simulation failed"),
  });

  const emergency = detail.data?.emergency;
  const routeRequest = journey.data?.routeRequest ?? detail.data?.latestRouteRequest ?? null;
  const selectedCandidateId = routeRequest?.selection?.candidateId ?? null;
  const explanation =
    (routeRequest?.selection?.reason as Explanation | undefined) ??
    calculateRoutes.data?.explanation;

  const mapOrigin = emergency
    ? { lat: emergency.originLat, lng: emergency.originLng, label: emergency.originLabel }
    : form.originLat
      ? { lat: Number(form.originLat), lng: Number(form.originLng), label: form.originLabel }
      : undefined;
  const mapDestination = emergency
    ? {
        lat: emergency.destinationLat,
        lng: emergency.destinationLng,
        label: emergency.destinationLabel,
      }
    : form.destinationLat
      ? {
          lat: Number(form.destinationLat),
          lng: Number(form.destinationLng),
          label: form.destinationLabel,
        }
      : undefined;

  const vehiclePosition = journey.data
    ? { lat: journey.data.journey.lastLat, lng: journey.data.journey.lastLng }
    : emergency?.vehicle
      ? { lat: emergency.vehicle.latitude, lng: emergency.vehicle.longitude }
      : null;

  const queue = emergencies.data?.emergencies ?? [];

  function applyDemoPreset() {
    setForm({
      priority: "CRITICAL",
      originLabel: MUMBAI_DEMO.originLabel,
      originLat: String(MUMBAI_DEMO.originLat),
      originLng: String(MUMBAI_DEMO.originLng),
      destinationLabel: MUMBAI_DEMO.destinationLabel,
      destinationLat: String(MUMBAI_DEMO.destinationLat),
      destinationLng: String(MUMBAI_DEMO.destinationLng),
      notes: MUMBAI_DEMO.notes,
    });
    setCreating(true);
    setSelectedId(null);
    setPinMode(null);
  }

  function onMapClick(point: LatLng) {
    if (!creating || !pinMode) return;
    if (pinMode === "origin") {
      setForm((f) => ({
        ...f,
        originLat: point.lat.toFixed(5),
        originLng: point.lng.toFixed(5),
        originLabel: f.originLabel || "Map pin origin",
      }));
      setPinMode("destination");
    } else {
      setForm((f) => ({
        ...f,
        destinationLat: point.lat.toFixed(5),
        destinationLng: point.lng.toFixed(5),
        destinationLabel: f.destinationLabel || "Map pin destination",
      }));
      setPinMode(null);
    }
  }

  const mapVehicles = useMemo(() => vehicles.data?.vehicles ?? [], [vehicles.data]);

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-ink-700 bg-ink-900 lg:flex">
        <div className="flex items-center justify-between px-3 py-3">
          <span className="text-[10px] uppercase tracking-[0.16em] text-ash-400">Incidents</span>
          <button
            className="text-[11px] text-brass hover:text-paper"
            onClick={() => {
              setCreating(true);
              setSelectedId(null);
              setError(null);
            }}
          >
            New
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {queue.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedId(item.id);
                setCreating(false);
                setRerouteNotice(null);
              }}
              className={cn(
                "block w-full border-b border-ink-800 px-3 py-2.5 text-left",
                selectedId === item.id ? "bg-ink-800" : "hover:bg-ink-800/50",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[12px]">{item.code}</span>
                <StatusChip tone={priorityTone(item.priority)}>
                  {priorityLabel(item.priority)}
                </StatusChip>
              </div>
              <div className="mt-1 truncate text-[12px] text-ash-300">{item.originLabel}</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-ash-400">
                {item.status.toLowerCase()}
              </div>
            </button>
          ))}
          {queue.length === 0 && (
            <p className="px-3 py-6 text-[12px] text-ash-400">No incidents yet.</p>
          )}
        </div>
      </aside>

      <main className="relative min-h-[46vh] flex-1 lg:min-h-0">
        <DispatchMap
          vehicles={mapVehicles}
          origin={mapOrigin}
          destination={mapDestination}
          candidates={routeRequest?.candidates}
          selectedId={selectedCandidateId}
          vehiclePosition={vehiclePosition}
          roadConditions={roads.data?.roadConditions}
          onMapClick={onMapClick}
        />
        <Legend />
        <AnimatePresence>
          {rerouteNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute left-3 right-3 top-3 z-10 rounded-sm border border-warning/50 bg-ink-900/95 p-3 shadow-lg md:left-4 md:right-auto md:max-w-md"
            >
              <div className="text-[10px] uppercase tracking-[0.16em] text-warning">
                Route change
              </div>
              <p className="mt-1 text-[13px] leading-snug">{rerouteNotice.reason}</p>
              {rerouteNotice.adopted && (
                <p className="mt-1 font-mono text-[12px] text-ash-300">
                  ETA {Math.round((rerouteNotice.previousEtaSeconds ?? 0) / 60)} min →{" "}
                  {Math.round((rerouteNotice.newEtaSeconds ?? 0) / 60)} min
                </p>
              )}
              <button
                className="mt-2 text-[11px] uppercase tracking-[0.14em] text-brass"
                onClick={() => setRerouteNotice(null)}
              >
                Acknowledge
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          className="absolute bottom-3 right-3 z-10 rounded-sm border border-ink-600 bg-ink-900 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-ash-300 lg:hidden"
          onClick={() => setPanelOpen((v) => !v)}
        >
          {panelOpen ? "Hide panel" : "Show panel"}
        </button>
      </main>

      <aside
        className={cn(
          "flex w-full shrink-0 flex-col border-t border-ink-700 bg-ink-900 lg:h-full lg:w-[380px] lg:border-l lg:border-t-0",
          !panelOpen && "hidden lg:flex",
        )}
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-ink-700 px-4 py-2 lg:hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.16em] text-ash-400">Incident</span>
              <button
                className="text-[11px] text-brass"
                onClick={() => {
                  setCreating(true);
                  setSelectedId(null);
                }}
              >
                New
              </button>
            </div>
            <select
              className={cn(inputClass(), "mt-2")}
              value={selectedId ?? ""}
              onChange={(e) => {
                if (!e.target.value) return;
                setSelectedId(e.target.value);
                setCreating(false);
              }}
            >
              <option value="">Select an incident</option>
              {queue.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} · {item.status}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <div className="border-b border-critical/40 bg-critical-soft px-4 py-2 text-[12px] text-red-200">
              {error}
            </div>
          )}

          {creating && (
            <CreateForm
              form={form}
              setForm={setForm}
              pinMode={pinMode}
              setPinMode={setPinMode}
              onDemo={applyDemoPreset}
              pending={createEmergency.isPending}
              onSubmit={() => createEmergency.mutate()}
            />
          )}

          {!creating && emergency && (
            <>
              <Panel title="Incident">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-[15px]">{emergency.code}</div>
                    <div className="mt-1 text-[12px] leading-snug text-ash-300">
                      {emergency.originLabel} → {emergency.destinationLabel}
                    </div>
                  </div>
                  <StatusChip tone={priorityTone(emergency.priority)}>
                    {priorityLabel(emergency.priority)}
                  </StatusChip>
                </div>
              </Panel>

              <Panel title="Vehicle">
                {emergency.vehicle ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[14px]">{emergency.vehicle.callSign}</div>
                      <div className="text-[12px] text-ash-400">
                        {emergency.vehicle.locationLabel}
                      </div>
                    </div>
                    <StatusChip tone={vehicleTone(emergency.vehicle.status)}>
                      {emergency.vehicle.status.toLowerCase()}
                    </StatusChip>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => assignVehicle.mutate(undefined)}
                      disabled={assignVehicle.isPending}
                    >
                      Assign nearest available
                    </Button>
                    {(detail.data?.recommendedVehicles ?? []).slice(0, 4).map((vehicle) => (
                      <button
                        key={vehicle.id}
                        onClick={() => assignVehicle.mutate(vehicle.id)}
                        className="flex w-full items-center justify-between rounded-sm border border-ink-700 px-2.5 py-2 text-left hover:border-ash-400"
                      >
                        <span>
                          <span className="block text-[13px]">{vehicle.callSign}</span>
                          <span className="text-[11px] text-ash-400">{vehicle.locationLabel}</span>
                        </span>
                        <span className="font-mono text-[12px] text-ash-300">
                          {(vehicle.distanceMeters / 1000).toFixed(1)} km
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </Panel>

              {emergency.vehicle && !routeRequest && emergency.status !== "DISPATCHED" && (
                <Panel title="Routing">
                  <Button
                    className="w-full"
                    onClick={() => calculateRoutes.mutate()}
                    disabled={calculateRoutes.isPending}
                  >
                    {calculateRoutes.isPending ? "Calculating…" : "Calculate route"}
                  </Button>
                  <p className="mt-2 text-[11px] leading-relaxed text-ash-400">
                    Google Routes candidates are requested from the server. If the
                    provider is unavailable, RapidRoute uses labelled demo fixtures.
                  </p>
                </Panel>
              )}

              {routeRequest && (
                <RouteCompare
                  request={routeRequest}
                  explanation={explanation}
                  selectedId={selectedCandidateId}
                  calculating={calculateRoutes.isPending}
                  onSelect={(id) => selectRoute.mutate(id)}
                  onRecalculate={() => calculateRoutes.mutate()}
                />
              )}

              {routeRequest && emergency.status !== "DISPATCHED" && emergency.status !== "COMPLETED" && (
                <Panel>
                  <Button
                    className="w-full"
                    disabled={!routeRequest.selection || dispatch.isPending}
                    onClick={() => dispatch.mutate(undefined)}
                  >
                    Dispatch recommended route
                  </Button>
                </Panel>
              )}

              {journey.data && (
                <JourneyBlock
                  detail={journey.data}
                  onScenario={(status) => demoScenario.mutate(status)}
                  pending={demoScenario.isPending}
                />
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function CreateForm({
  form,
  setForm,
  pinMode,
  setPinMode,
  onDemo,
  pending,
  onSubmit,
}: {
  form: typeof emptyForm;
  setForm: (next: typeof emptyForm | ((f: typeof emptyForm) => typeof emptyForm)) => void;
  pinMode: "origin" | "destination" | null;
  setPinMode: (mode: "origin" | "destination" | null) => void;
  onDemo: () => void;
  pending: boolean;
  onSubmit: () => void;
}) {
  return (
    <Panel
      title="New incident"
      action={
        <button className="text-[11px] text-brass" onClick={onDemo}>
          Load Mumbai demo
        </button>
      }
    >
      <div className="space-y-3">
        <Field label="Priority">
          <select
            className={inputClass()}
            value={form.priority}
            onChange={(e) =>
              setForm((f) => ({ ...f, priority: e.target.value as Priority }))
            }
          >
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="STANDARD">Standard</option>
          </select>
        </Field>
        <Field label="Origin">
          <input
            className={inputClass()}
            value={form.originLabel}
            onChange={(e) => setForm((f) => ({ ...f, originLabel: e.target.value }))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <input
            className={inputClass()}
            placeholder="Lat"
            value={form.originLat}
            onChange={(e) => setForm((f) => ({ ...f, originLat: e.target.value }))}
          />
          <input
            className={inputClass()}
            placeholder="Lng"
            value={form.originLng}
            onChange={(e) => setForm((f) => ({ ...f, originLng: e.target.value }))}
          />
        </div>
        <Field label="Hospital / destination">
          <input
            className={inputClass()}
            value={form.destinationLabel}
            onChange={(e) => setForm((f) => ({ ...f, destinationLabel: e.target.value }))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <input
            className={inputClass()}
            placeholder="Lat"
            value={form.destinationLat}
            onChange={(e) => setForm((f) => ({ ...f, destinationLat: e.target.value }))}
          />
          <input
            className={inputClass()}
            placeholder="Lng"
            value={form.destinationLng}
            onChange={(e) => setForm((f) => ({ ...f, destinationLng: e.target.value }))}
          />
        </div>
        <Field label="Notes">
          <textarea
            className={cn(inputClass(), "min-h-16")}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </Field>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={pinMode === "origin" ? "primary" : "ghost"}
            className="flex-1"
            onClick={() => setPinMode("origin")}
          >
            Pin origin
          </Button>
          <Button
            type="button"
            variant={pinMode === "destination" ? "primary" : "ghost"}
            className="flex-1"
            onClick={() => setPinMode("destination")}
          >
            Pin hospital
          </Button>
        </div>
        <Button className="w-full" disabled={pending} onClick={onSubmit}>
          {pending ? "Creating…" : "Create emergency"}
        </Button>
      </div>
    </Panel>
  );
}

function RouteCompare({
  request,
  explanation,
  selectedId,
  calculating,
  onSelect,
  onRecalculate,
}: {
  request: RouteRequest;
  explanation?: Explanation;
  selectedId: string | null;
  calculating: boolean;
  onSelect: (id: string) => void;
  onRecalculate: () => void;
}) {
  return (
    <Panel
      title="Candidates"
      action={
        <button className="text-[11px] text-ash-400" onClick={onRecalculate}>
          Recalculate
        </button>
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <StatusChip tone={request.provider === "DEMO" ? "brass" : "clear"}>
          {request.dataSourceLabel}
        </StatusChip>
      </div>
      {request.providerMessage && (
        <p className="mb-3 text-[11px] leading-relaxed text-ash-400">{request.providerMessage}</p>
      )}
      <div className="space-y-2">
        <AnimatePresence>
          {[...request.candidates]
            .sort((a, b) => {
              if (a.id === selectedId) return -1;
              if (b.id === selectedId) return 1;
              if (a.blocked !== b.blocked) return a.blocked ? 1 : -1;
              return (a.score ?? 999) - (b.score ?? 999);
            })
            .map((candidate, index) => (
            <motion.div
              key={candidate.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: index * 0.05 }}
            >
              <CandidateCard
                candidate={candidate}
                recommended={candidate.id === selectedId}
                onSelect={() => !candidate.blocked && onSelect(candidate.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {calculating && (
        <p className="mt-2 text-[12px] text-ash-400">Scoring candidates…</p>
      )}
      {explanation && (
        <div className="mt-4 border-t border-ink-700 pt-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-brass">Why this route?</div>
          <p className="mt-1 text-[13px] leading-relaxed text-paper/90">{explanation.summary}</p>
          <ul className="mt-2 space-y-1 text-[12px] text-ash-300">
            {explanation.factors.map((factor) => (
              <li key={factor}>— {factor}</li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

function CandidateCard({
  candidate,
  recommended,
  onSelect,
}: {
  candidate: Candidate;
  recommended: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={candidate.blocked}
      className={cn(
        "w-full rounded-sm border px-3 py-2.5 text-left",
        candidate.blocked && "border-critical/40 bg-critical-soft/40 opacity-80",
        recommended && !candidate.blocked && "border-brass bg-ink-800",
        !recommended && !candidate.blocked && "border-ink-700 hover:border-ash-400",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium">{candidate.label}</span>
        {candidate.blocked ? (
          <StatusChip tone="critical">Not eligible — blocked road</StatusChip>
        ) : recommended ? (
          <StatusChip tone="brass">Recommended</StatusChip>
        ) : null}
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2 font-mono text-[11px] text-ash-300">
        <div>
          <div className="text-[9px] uppercase tracking-[0.12em] text-ash-400">ETA</div>
          {candidate.etaLabel}
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-[0.12em] text-ash-400">Dist</div>
          {candidate.distanceLabel}
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-[0.12em] text-ash-400">Traffic</div>
          <span className={cn(trafficTone(candidate.trafficLevel) === "critical" && "text-red-300")}>
            {trafficLabel(candidate.trafficLevel)}
          </span>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-[0.12em] text-ash-400">Score</div>
          {candidate.score ?? "—"}
        </div>
      </div>
      <div className="mt-2">
        <StatusChip tone={roadTone(candidate.roadImpact)}>
          Road {roadLabel(candidate.roadImpact)}
        </StatusChip>
      </div>
    </button>
  );
}

function JourneyBlock({
  detail,
  onScenario,
  pending,
}: {
  detail: JourneyDetail;
  onScenario: (status: RoadStatus) => void;
  pending: boolean;
}) {
  const remainingMin = Math.max(
    0,
    Math.round(
      ((new Date(detail.journey.estimatedArrivalAt).getTime() - Date.now()) / 60000),
    ),
  );
  return (
    <>
      <Panel title="Journey">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-ash-400">
              {detail.vehicle.callSign}
            </div>
            <div className="mt-1 font-mono text-2xl tabular">{remainingMin} min</div>
            <div className="text-[12px] text-ash-400">
              ETA {formatEtaClock(detail.journey.estimatedArrivalAt)}
            </div>
          </div>
          <div className="text-right">
            <StatusChip tone={detail.journey.status === "ACTIVE" ? "clear" : "neutral"}>
              {detail.journey.status.toLowerCase()}
            </StatusChip>
            <div className="mt-2 font-mono text-[12px] text-ash-300">
              {Math.round(detail.journey.progress * 100)}%
            </div>
          </div>
        </div>
        <div className="mt-3 h-1 bg-ink-700">
          <motion.div
            className="h-full bg-brass"
            animate={{ width: `${Math.round(detail.journey.progress * 100)}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>
      </Panel>

      <Panel
        title="Demo simulation"
        action={<span className="text-[10px] uppercase tracking-[0.14em] text-brass">Simulated</span>}
      >
        <p className="mb-2 text-[11px] leading-relaxed text-ash-400">
          Local operational reports for Marine Drive. Not live municipal traffic.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {DEMO_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant={preset.id === "BLOCKED" ? "danger" : preset.id === "CONGESTED" ? "warn" : "ghost"}
              disabled={pending || detail.journey.status !== "ACTIVE"}
              onClick={() => onScenario(preset.id)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </Panel>

      <Panel title="Timeline">
        <ol className="space-y-2">
          {detail.events.map((event) => (
            <li key={event.id} className="flex gap-3 text-[12px]">
              <span className="w-16 shrink-0 font-mono text-ash-400">
                {formatWhen(event.occurredAt).slice(0, 8)}
              </span>
              <span>
                <span className="text-paper">{event.type.replaceAll("_", " ")}</span>
                {typeof event.payload?.reason === "string" && (
                  <span className="block text-ash-400">{event.payload.reason}</span>
                )}
              </span>
            </li>
          ))}
        </ol>
      </Panel>
    </>
  );
}

function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 hidden rounded-sm border border-ink-700 bg-ink-900/90 px-2.5 py-2 text-[10px] uppercase tracking-[0.12em] text-ash-300 md:block">
      <div className="mb-1 text-ash-400">Legend</div>
      <div className="flex gap-3">
        <span><i className="mr-1 inline-block h-1.5 w-4 bg-[#E8D2A6] align-middle" /> Recommended</span>
        <span><i className="mr-1 inline-block h-1.5 w-4 bg-[#B42318] align-middle" /> Blocked</span>
        <span><i className="mr-1 inline-block h-1.5 w-4 bg-[#B54708] align-middle" /> Congestion</span>
      </div>
    </div>
  );
}
