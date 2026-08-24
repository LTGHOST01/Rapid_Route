import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, MapPin, Menu, Play, X } from "lucide-react";
import { api, ApiError } from "../lib/api";
import {
  DEMO_CORRIDORS,
  MUMBAI_DEMO,
  MUMBAI_HOSPITALS,
  MUMBAI_ORIGINS,
  formatEtaClock,
  formatWhen,
  type LatLng,
} from "../lib/geo";
import { DEMO_PRESETS, roadLabel, trafficLabel } from "../lib/labels";
import { displayScore, factorScore, incidentTitle, priorityShort, timeAgo } from "../lib/format";
import { Button, Field, inputClass, StatusChip, roadTone, trafficTone } from "../components/ui";
import { DispatchMap } from "../components/map/DispatchMap";
import type {
  Candidate,
  Emergency,
  Explanation,
  IncidentType,
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
  incidentType: "MEDICAL" as IncidentType,
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
  const [pinMode, setPinMode] = useState<"origin" | "destination" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rerouteNotice, setRerouteNotice] = useState<RerouteResult | null>(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [whyOpen, setWhyOpen] = useState(true);
  const [blockCorridor, setBlockCorridor] = useState(MUMBAI_DEMO.blockCorridorId);

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
        /* completed */
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [journeyId, journey.data?.journey.status, qc]);

  const createEmergency = useMutation({
    mutationFn: () =>
      api<{ emergency: Emergency }>("/emergencies", {
        method: "POST",
        body: JSON.stringify({
          incidentType: form.incidentType,
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
      setRightOpen(true);
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
    mutationFn: async () => {
      if (selectedId && !detail.data?.emergency.vehicle) {
        await api(`/emergencies/${selectedId}/assign-vehicle`, {
          method: "POST",
          body: JSON.stringify({}),
        });
        await qc.invalidateQueries({ queryKey: ["emergency", selectedId] });
      }
      return api<RouteRequest & { explanation: Explanation; noEligibleRoute: boolean }>(
        `/emergencies/${selectedId}/routes`,
        { method: "POST", body: JSON.stringify({}) },
      );
    },
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
      api<{ reroute: RerouteResult }>("/demo/road-scenario", {
        method: "POST",
        body: JSON.stringify({ status, corridorId: blockCorridor, journeyId }),
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
    (routeRequest?.selection?.reason as Explanation | undefined) ?? calculateRoutes.data?.explanation;
  const recommended = routeRequest?.candidates.find((c) => c.id === selectedCandidateId) ?? null;
  const alternatives = (routeRequest?.candidates ?? []).filter((c) => c.id !== selectedCandidateId);

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

  function startNew() {
    setCreating(true);
    setSelectedId(null);
    setError(null);
    setRightOpen(true);
    setForm(emptyForm);
  }

  function applyDemoPreset() {
    setForm({
      incidentType: MUMBAI_DEMO.incidentType,
      priority: MUMBAI_DEMO.priority,
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
    setRightOpen(true);
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
    <div className="flex h-full bg-soft">
      <AnimatePresence initial={false}>
        {leftOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="hidden h-full shrink-0 overflow-hidden border-r border-line bg-white lg:block"
          >
            <IncidentList
              queue={queue}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                setCreating(false);
                setRerouteNotice(null);
                setRightOpen(true);
              }}
              onNew={startNew}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="relative min-h-0 min-w-0 flex-1">
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

        <button
          className="absolute left-3 top-3 z-20 hidden h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-[13px] shadow-sm lg:flex"
          onClick={() => setLeftOpen((v) => !v)}
        >
          <Menu size={15} />
          Incidents
          <span className="rounded-full bg-critical px-1.5 text-[11px] font-medium text-white">
            {queue.length}
          </span>
        </button>

        <button
          className="absolute right-3 top-3 z-20 lg:hidden rounded-lg border border-line bg-white px-3 py-1.5 text-[13px] shadow-sm"
          onClick={() => setRightOpen((v) => !v)}
        >
          {rightOpen ? "Hide details" : "Details"}
        </button>

        {journey.data?.journey.status === "ACTIVE" && (
          <div className="absolute left-3 top-14 z-20 rounded-md border border-line bg-white px-2 py-1 text-[11px] text-muted shadow-sm">
            Simulated vehicle position
          </div>
        )}

        <AnimatePresence>
          {rerouteNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute left-1/2 top-3 z-30 w-[min(420px,calc(100%-24px))] -translate-x-1/2 rounded-xl border border-amber-200 bg-white p-3 shadow-md"
            >
              <div className="text-[12px] font-semibold text-amber-700">Route updated</div>
              <p className="mt-1 text-[13px] text-ink">
                {rerouteNotice.adopted
                  ? "Road blockage detected. RapidRoute selected an alternate route."
                  : rerouteNotice.reason}
              </p>
              {rerouteNotice.adopted && (
                <p className="mt-1 text-[12px] text-muted">
                  ETA {Math.round((rerouteNotice.previousEtaSeconds ?? 0) / 60)} min →{" "}
                  {Math.round((rerouteNotice.newEtaSeconds ?? 0) / 60)} min
                </p>
              )}
              <button
                className="mt-2 text-[12px] font-medium text-nav"
                onClick={() => setRerouteNotice(null)}
              >
                Acknowledge
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {routeRequest && explanation && !creating && (
          <WhyCard
            explanation={explanation}
            recommended={recommended}
            open={whyOpen}
            onToggle={() => setWhyOpen((v) => !v)}
          />
        )}
      </main>

      <AnimatePresence initial={false}>
        {rightOpen && (
          <motion.aside
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-x-0 bottom-0 z-20 max-h-[58%] overflow-y-auto rounded-t-2xl border-t border-line bg-white shadow-[0_-8px_24px_rgba(60,64,67,0.12)] lg:static lg:z-0 lg:h-full lg:w-[360px] lg:max-h-none lg:shrink-0 lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-none"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3 lg:hidden">
              <span className="text-[13px] font-medium">Dispatch</span>
              <button onClick={() => setRightOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="border-b border-line px-4 py-3 lg:hidden">
              <select
                className={inputClass()}
                value={selectedId ?? ""}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setSelectedId(e.target.value);
                  setCreating(false);
                }}
              >
                <option value="">Incidents</option>
                {queue.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} · {item.status}
                  </option>
                ))}
              </select>
            </div>

            {error && <div className="bg-red-50 px-5 py-2 text-[13px] text-critical">{error}</div>}

            {creating && (
              <NewEmergencyForm
                form={form}
                setForm={setForm}
                pinMode={pinMode}
                setPinMode={setPinMode}
                pending={createEmergency.isPending}
                onDemo={applyDemoPreset}
                onSubmit={() => {
                  if (!form.originLat || !form.destinationLat) {
                    setError("Origin and destination are required");
                    return;
                  }
                  createEmergency.mutate();
                }}
              />
            )}

            {!creating && emergency && (
              <ContextPanel
                emergency={emergency}
                recommendedVehicles={detail.data?.recommendedVehicles ?? []}
                routeRequest={routeRequest}
                recommended={recommended}
                alternatives={alternatives}
                explanation={explanation}
                journey={journey.data}
                calculating={calculateRoutes.isPending}
                dispatching={dispatch.isPending}
                corridorId={blockCorridor}
                onCorridorChange={setBlockCorridor}
                onAssign={(id) => assignVehicle.mutate(id)}
                onCalculate={() => calculateRoutes.mutate()}
                onSelect={(id) => selectRoute.mutate(id)}
                onStart={() => dispatch.mutate(undefined)}
                onScenario={(status) => demoScenario.mutate(status)}
                scenarioPending={demoScenario.isPending}
              />
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

function IncidentList({
  queue,
  selectedId,
  onSelect,
  onNew,
}: {
  queue: Emergency[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="flex h-full w-72 flex-col">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-[16px] font-semibold">Incidents</h2>
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-critical px-1.5 text-[11px] font-medium text-white">
            {queue.length}
          </span>
        </div>
        <button className="text-[13px] font-medium text-nav" onClick={onNew}>
          New
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {queue.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              "mb-2 w-full rounded-xl border bg-white px-3 py-2.5 text-left",
              selectedId === item.id ? "border-slate-300 shadow-sm" : "border-line hover:border-slate-300",
              item.priority === "CRITICAL" && "border-l-[3px] border-l-critical",
              item.priority === "HIGH" && "border-l-[3px] border-l-amber-500",
              item.priority === "STANDARD" && "border-l-[3px] border-l-slate-300",
            )}
          >
            <div
              className={cn(
                "text-[10px] font-semibold tracking-wide",
                item.priority === "CRITICAL" && "text-critical",
                item.priority === "HIGH" && "text-amber-600",
                item.priority === "STANDARD" && "text-slate-500",
              )}
            >
              {priorityShort(item.priority).toUpperCase()}
            </div>
            <div className="mt-0.5 text-[13px] font-medium">{incidentTitle(item.incidentType, item.notes)}</div>
            <div className="mt-0.5 text-[12px] text-muted">{item.originLabel}</div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
              <span>{timeAgo(item.createdAt)}</span>
              <span className="font-mono">{item.code}</span>
            </div>
          </button>
        ))}
        {queue.length === 0 && <p className="px-1 py-8 text-[13px] text-muted">No incidents yet.</p>}
      </div>
    </div>
  );
}

function NewEmergencyForm({
  form,
  setForm,
  pinMode,
  setPinMode,
  pending,
  onDemo,
  onSubmit,
}: {
  form: typeof emptyForm;
  setForm: (next: typeof emptyForm | ((f: typeof emptyForm) => typeof emptyForm)) => void;
  pinMode: "origin" | "destination" | null;
  setPinMode: (mode: "origin" | "destination" | null) => void;
  pending: boolean;
  onDemo: () => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between px-5 pt-5">
        <h2 className="text-[18px] font-semibold">New Emergency</h2>
        <button className="text-[12px] font-medium text-nav" onClick={onDemo}>
          Mumbai demo
        </button>
      </div>
      <div className="space-y-3 px-5 py-4">
        <Field label="Emergency Type">
          <select
            className={inputClass()}
            value={form.incidentType}
            onChange={(e) => setForm((f) => ({ ...f, incidentType: e.target.value as IncidentType }))}
          >
            <option value="MEDICAL">Medical</option>
            <option value="TRAUMA">Trauma</option>
            <option value="FIRE">Fire</option>
            <option value="POLICE">Police</option>
          </select>
        </Field>
        <Field label="Priority">
          <select
            className={inputClass()}
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))}
          >
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="STANDARD">Medium</option>
          </select>
        </Field>
        <Field label="Origin">
          <select
            className={inputClass()}
            value=""
            onChange={(e) => {
              const place = MUMBAI_ORIGINS.find((p) => p.id === e.target.value);
              if (!place) return;
              setForm((f) => ({
                ...f,
                originLabel: place.label,
                originLat: String(place.lat),
                originLng: String(place.lng),
              }));
            }}
          >
            <option value="">{form.originLabel || "Select origin"}</option>
            {MUMBAI_ORIGINS.map((place) => (
              <option key={place.id} value={place.id}>
                {place.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Destination">
          <select
            className={inputClass()}
            value=""
            onChange={(e) => {
              const place = MUMBAI_HOSPITALS.find((p) => p.id === e.target.value);
              if (!place) return;
              setForm((f) => ({
                ...f,
                destinationLabel: place.label,
                destinationLat: String(place.lat),
                destinationLng: String(place.lng),
              }));
            }}
          >
            <option value="">{form.destinationLabel || "Select hospital"}</option>
            {MUMBAI_HOSPITALS.map((place) => (
              <option key={place.id} value={place.id}>
                {place.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex gap-2">
          <Button type="button" variant={pinMode === "origin" ? "primary" : "ghost"} className="flex-1" onClick={() => setPinMode("origin")}>
            <MapPin size={14} /> Pin origin
          </Button>
          <Button type="button" variant={pinMode === "destination" ? "primary" : "ghost"} className="flex-1" onClick={() => setPinMode("destination")}>
            <MapPin size={14} /> Pin hospital
          </Button>
        </div>
        <Button className="w-full" disabled={pending} onClick={onSubmit}>
          {pending ? "Creating…" : "Create emergency"}
        </Button>
      </div>
    </div>
  );
}

function ContextPanel({
  emergency,
  recommendedVehicles,
  routeRequest,
  recommended,
  alternatives,
  explanation: _explanation,
  journey,
  calculating,
  dispatching,
  corridorId,
  onCorridorChange,
  onAssign,
  onCalculate,
  onSelect,
  onStart,
  onScenario,
  scenarioPending,
}: {
  emergency: Emergency;
  recommendedVehicles: Array<Vehicle & { distanceMeters: number; reason?: string; recommended?: boolean }>;
  routeRequest: RouteRequest | null;
  recommended: Candidate | null;
  alternatives: Candidate[];
  explanation?: Explanation; // used by parent WhyCard; kept for API completeness
  journey?: JourneyDetail;
  calculating: boolean;
  dispatching: boolean;
  corridorId: string;
  onCorridorChange: (id: string) => void;
  onAssign: (id?: string) => void;
  onCalculate: () => void;
  onSelect: (id: string) => void;
  onStart: () => void;
  onScenario: (status: RoadStatus) => void;
  scenarioPending: boolean;
}) {
  const recScore = displayScore(recommended?.score);
  return (
    <div className="pb-6">
      <div className="px-5 pt-5">
        <div className="text-[12px] text-muted">{emergency.code}</div>
        <h2 className="mt-0.5 text-[18px] font-semibold">
          {incidentTitle(emergency.incidentType, emergency.notes)}
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          {emergency.originLabel} → {emergency.destinationLabel}
        </p>
      </div>

      {routeRequest?.selection == null && routeRequest?.candidates?.every((c) => c.blocked) && (
        <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-critical">
          No suitable route available. The destination cannot currently be reached through
          the available routes.
        </div>
      )}

      {!routeRequest && emergency.status !== "DISPATCHED" && (
        <div className="space-y-3 px-5 pt-4">
          {!emergency.vehicle && (
            <div className="space-y-2">
              <div className="text-[13px] font-medium">Recommended unit</div>
              {recommendedVehicles.slice(0, 3).map((vehicle) => (
                <button
                  key={vehicle.id}
                  onClick={() => onAssign(vehicle.id)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2 text-left",
                    vehicle.recommended ? "border-nav/40 bg-blue-50/50" : "border-line",
                  )}
                >
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium">{vehicle.callSign}</span>
                    <span className="text-muted">{(vehicle.distanceMeters / 1000).toFixed(1)} km</span>
                  </div>
                  {vehicle.reason && <p className="mt-1 text-[11px] text-muted">{vehicle.reason}</p>}
                </button>
              ))}
            </div>
          )}
          <Button className="w-full" disabled={calculating} onClick={onCalculate}>
            {calculating ? "Calculating…" : "Calculate routes"}
          </Button>
        </div>
      )}

      {recommended && (
        <div className="px-5 pt-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold">Recommended Route</h3>
            <StatusChip tone="clear">Best</StatusChip>
          </div>
          <div className="rounded-2xl border border-line p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[32px] font-semibold leading-none tabular">{recommended.etaLabel}</div>
                <div className="mt-1 text-[13px] text-muted">
                  {recommended.distanceLabel}
                  {journey?.journey.estimatedArrivalAt
                    ? ` · ETA ${formatEtaClock(journey.journey.estimatedArrivalAt)}`
                    : ""}
                </div>
              </div>
              {recScore != null && <ScoreRing value={recScore} />}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-[12px]">
              <Metric label="Traffic" value={trafficLabel(recommended.trafficLevel)} tone={trafficTone(recommended.trafficLevel)} />
              <Metric label="Road Status" value={roadLabel(recommended.roadImpact)} tone={roadTone(recommended.roadImpact)} />
              <Metric label="Priority" value={priorityShort(emergency.priority)} tone="nav" />
            </div>
            {emergency.status !== "DISPATCHED" && emergency.status !== "COMPLETED" && (
              <Button className="mt-4 w-full" disabled={dispatching || recommended.blocked} onClick={onStart}>
                <Play size={14} fill="currentColor" /> Start Journey
              </Button>
            )}
          </div>
        </div>
      )}

      {alternatives.length > 0 && (
        <div className="px-5 pt-5">
          <h3 className="mb-2 text-[13px] font-medium text-muted">Alternative Routes</h3>
          <div className="space-y-2">
            {alternatives.map((candidate) => (
              <button
                key={candidate.id}
                disabled={candidate.blocked}
                onClick={() => onSelect(candidate.id)}
                className="flex w-full items-center justify-between rounded-xl border border-line px-3 py-2.5 text-left disabled:opacity-50"
              >
                <div>
                  <div className="text-[15px] font-semibold">{candidate.etaLabel}</div>
                  <div className="text-[12px] text-muted">
                    {candidate.distanceLabel}
                    {candidate.blocked ? " · Blocked" : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-muted">Score</div>
                  <div className="text-[16px] font-semibold tabular">{displayScore(candidate.score) ?? "—"}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {routeRequest && (
        <p className="px-5 pt-3 text-[11px] text-muted">
          {routeRequest.dataSourceLabel === "GOOGLE ROUTES" ? "Live Google Routes" : "DEMO SIMULATION"}
        </p>
      )}

      {journey && (
        <div className="mt-4 border-t border-line px-5 pt-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[12px] text-muted">
                {journey.vehicle.callSign}
                {journey.journey.currentRouteLabel ? ` · ${journey.journey.currentRouteLabel}` : ""}
              </div>
              <div className="mt-1 text-[28px] font-semibold tabular">
                {Math.max(0, Math.round((journey.journey.remainingSeconds ?? 0) / 60))} min
              </div>
              <div className="text-[12px] text-muted">
                {((journey.journey.remainingMeters ?? 0) / 1000).toFixed(1)} km remaining
              </div>
            </div>
            <StatusChip tone={journey.journey.status === "ACTIVE" ? "clear" : "neutral"}>
              {journey.journey.status === "ACTIVE" ? "En route" : journey.journey.status.toLowerCase()}
            </StatusChip>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full bg-nav"
              animate={{ width: `${Math.round(journey.journey.progress * 100)}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
          {journey.journey.status === "ACTIVE" && (
            <div className="mt-4 space-y-2">
              <div className="text-[12px] font-medium text-muted">Demo simulation</div>
              <select className={inputClass()} value={corridorId} onChange={(e) => onCorridorChange(e.target.value)}>
                {DEMO_CORRIDORS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    variant={preset.id === "BLOCKED" ? "danger" : "ghost"}
                    disabled={scenarioPending}
                    onClick={() => onScenario(preset.id)}
                  >
                    {preset.id === "BLOCKED" ? "Block road" : preset.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <ol className="mt-4 space-y-1.5">
            {journey.events.slice(0, 6).map((event) => (
              <li key={event.id} className="flex gap-2 text-[12px] text-muted">
                <span className="w-14 shrink-0 font-mono">{formatWhen(event.occurredAt).slice(0, 5)}</span>
                <span>{event.type.replaceAll("_", " ").toLowerCase()}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "critical" | "warning" | "clear" | "neutral" | "nav";
}) {
  return (
    <div>
      <div className="text-[11px] text-muted">{label}</div>
      <StatusChip tone={tone}>{value}</StatusChip>
    </div>
  );
}

function ScoreRing({ value }: { value: number }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative h-14 w-14">
      <svg viewBox="0 0 40 40" className="h-14 w-14 -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="#e8eaed" strokeWidth="3.5" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="#188038"
          strokeWidth="3.5"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[13px] font-semibold">{value}</div>
    </div>
  );
}

function WhyCard({
  explanation,
  recommended,
  open,
  onToggle,
}: {
  explanation: Explanation;
  recommended: Candidate | null;
  open: boolean;
  onToggle: () => void;
}) {
  const traffic = factorScore(recommended?.breakdown?.trafficPenalty ?? explanation.components?.trafficPenalty);
  const road = factorScore(recommended?.breakdown?.roadPenalty ?? explanation.components?.roadPenalty);
  const distance = factorScore(recommended?.breakdown?.distancePenalty ?? explanation.components?.distancePenalty);
  const priority = 100;
  return (
    <motion.div
      layout
      className="absolute bottom-5 left-3 z-20 hidden w-[min(520px,calc(100%-280px))] rounded-2xl border border-line bg-white/95 p-4 shadow-md backdrop-blur-sm md:block"
    >
      <button onClick={onToggle} className="flex w-full items-center justify-between text-left">
        <span className="text-[15px] font-semibold">Why this route?</span>
        <ChevronDown size={16} className={cn("text-muted transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_1.1fr]">
              <p className="text-[13px] leading-relaxed text-muted">
                {explanation.summary ||
                  explanation.reason ||
                  "This route is optimal because it has lighter traffic, clear roads, and the fastest travel time for this emergency priority."}
              </p>
              <div className="space-y-1.5">
                <Bar label="Traffic" value={traffic} />
                <Bar label="Road Status" value={road} />
                <Bar label="Distance" value={distance} />
                <Bar label="Priority Match" value={priority} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-[92px_1fr_48px] items-center gap-2 text-[12px]">
      <span className="text-muted">{label}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-clear" style={{ width: `${value}%` }} />
      </div>
      <span className="text-right tabular text-muted">
        {value}
        <span className="text-slate-400"> /100</span>
      </span>
    </div>
  );
}
