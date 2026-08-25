import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, MapPin, Menu, Play, X } from "lucide-react";
import { api, apiBase, ApiError, getToken } from "../lib/api";
import { isSirenMuted, previewSiren, setSirenMuted, sirenLabel, startSiren, stopSiren, type SirenKind } from "../lib/sirens";
import {
  MUMBAI_DEMO,
  MUMBAI_FIRE_DEMO,
  MUMBAI_FIRE_SCENES,
  MUMBAI_HOSPITALS,
  MUMBAI_ORIGINS,
  type HospitalPlace,
  formatEtaClock,
  formatWhen,
  type LatLng,
} from "../lib/geo";
import { roadLabel, trafficLabel } from "../lib/labels";
import {
  displayScore,
  factorScore,
  formatDuration,
  goesToHospital,
  incidentTitle,
  pathEnds,
  timeAgo,
} from "../lib/format";
import { Button, Field, inputClass, StatusChip, roadTone, trafficTone } from "../components/ui";
import { DispatchMap, MapsApiGate } from "../components/map/DispatchMap";
import { PlaceSearch } from "../components/map/PlaceSearch";
import { reverseGeocode } from "../lib/places";
import type {
  Candidate,
  Emergency,
  Explanation,
  IncidentType,
  JourneyDetail,
  Priority,
  RoadCondition,
  RouteRequest,
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
  const [ackRerouteId, setAckRerouteId] = useState<string | null>(null);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [whyOpen, setWhyOpen] = useState(true);
  const [sirenMuted, setSirenMutedState] = useState(isSirenMuted);

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
  const catalog = useQuery({
    queryKey: ["catalog"],
    queryFn: () =>
      api<{
        hospitals: HospitalPlace[];
        fireScenes?: HospitalPlace[];
        origins: Array<{ id: string; label: string; lat: number; lng: number }>;
      }>("/catalog/locations"),
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
    refetchInterval: (query) =>
      query.state.data?.journey.status === "ACTIVE" ? 4000 : false,
  });

  useEffect(() => {
    if (!journeyId || journey.data?.journey.status !== "ACTIVE") return;
    const base = apiBase();
    const token = getToken() ?? "";
    const source = new EventSource(
      `${base}/journeys/${journeyId}/live?token=${encodeURIComponent(token)}`,
    );
    source.addEventListener("tick", (event) => {
      try {
        qc.setQueryData(["journey", journeyId], JSON.parse((event as MessageEvent).data));
      } catch {
        /* ignore malformed frames */
      }
    });
    source.onerror = () => {
      source.close();
    };
    return () => source.close();
  }, [journeyId, journey.data?.journey.status, qc]);

  useEffect(() => {
    const active = journey.data?.journey.status === "ACTIVE";
    const kind = journey.data?.vehicle.type as SirenKind | undefined;
    if (active && kind) startSiren(kind);
    else stopSiren();
  }, [journey.data?.journey.status, journey.data?.vehicle.type]);

  useEffect(() => () => stopSiren(), []);

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
          destinationLabel: goesToHospital(form.incidentType)
            ? form.destinationLabel
            : form.destinationLabel && form.destinationLabel !== form.originLabel
              ? form.destinationLabel
              : "Fire scene",
          destinationLat: Number(form.destinationLat || form.originLat),
          destinationLng: Number(form.destinationLng || form.originLng),
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

  const queue = (emergencies.data?.emergencies ?? []).filter((item) =>
    item.status === "OPEN" || item.status === "ASSIGNED" || item.status === "DISPATCHED",
  );

  function startNew() {
    setCreating(true);
    setSelectedId(null);
    setError(null);
    setRightOpen(true);
    setForm(emptyForm);
  }

  function applyDemoPreset(preset: typeof MUMBAI_DEMO | typeof MUMBAI_FIRE_DEMO) {
    setForm({
      incidentType: preset.incidentType,
      priority: preset.priority,
      originLabel: preset.originLabel,
      originLat: String(preset.originLat),
      originLng: String(preset.originLng),
      destinationLabel: preset.destinationLabel,
      destinationLat: String(preset.destinationLat),
      destinationLng: String(preset.destinationLng),
      notes: preset.notes,
    });
    setCreating(true);
    setSelectedId(null);
    setPinMode(null);
    setRightOpen(true);
  }

  function onMapClick(point: LatLng) {
    if (!creating || !pinMode) return;
    const mode = pinMode;
    if (mode === "origin") {
      setForm((f) => {
        const next = {
          ...f,
          originLat: point.lat.toFixed(5),
          originLng: point.lng.toFixed(5),
          originLabel: f.originLabel || "Dropped pin",
        };
        if (!goesToHospital(f.incidentType)) {
          next.destinationLat = next.originLat;
          next.destinationLng = next.originLng;
          next.destinationLabel = "Fire scene";
        }
        return next;
      });
      setPinMode(goesToHospital(form.incidentType) ? "destination" : null);
    } else {
      setForm((f) => ({
        ...f,
        destinationLat: point.lat.toFixed(5),
        destinationLng: point.lng.toFixed(5),
        destinationLabel: f.destinationLabel || "Dropped pin",
      }));
      setPinMode(null);
    }
    void reverseGeocode(point).then((label) => {
      setForm((f) =>
        mode === "origin"
          ? {
              ...f,
              originLabel: label,
              originLat: point.lat.toFixed(5),
              originLng: point.lng.toFixed(5),
              ...(!goesToHospital(f.incidentType)
                ? { destinationLabel: "Fire scene", destinationLat: point.lat.toFixed(5), destinationLng: point.lng.toFixed(5) }
                : {}),
            }
          : { ...f, destinationLabel: label, destinationLat: point.lat.toFixed(5), destinationLng: point.lng.toFixed(5) },
      );
    });
  }

  const originOptions = catalog.data?.origins ?? MUMBAI_ORIGINS;
  const hospitalOptions = catalog.data?.hospitals ?? MUMBAI_HOSPITALS;
  const fireSceneOptions = catalog.data?.fireScenes ?? MUMBAI_FIRE_SCENES;
  const activeType = creating ? form.incidentType : emergency?.incidentType;
  const hospitalBound = goesToHospital(activeType);
  const mapHospitals = hospitalBound ? hospitalOptions : [];
  const destinationKind = hospitalBound ? "hospital" : "scene";

  const mapVehicles = useMemo(() => {
    const all = vehicles.data?.vehicles ?? [];
    const assignedId = emergency?.vehicle?.id ?? journey.data?.vehicle.id;
    const wanted =
      !goesToHospital(activeType) && activeType === "POLICE"
        ? "POLICE"
        : !goesToHospital(activeType)
          ? "FIRE"
          : "AMBULANCE";
    return all.filter((vehicle) => {
      if (vehicle.status === "INACTIVE") return false;
      if (assignedId && vehicle.id === assignedId) return true;
      if (vehicle.type !== wanted) return false;
      if (vehicle.status === "ASSIGNED") return false;
      if (!mapOrigin) return vehicle.status === "AVAILABLE";
      return Math.hypot(vehicle.latitude - mapOrigin.lat, vehicle.longitude - mapOrigin.lng) < 0.055;
    });
  }, [vehicles.data, emergency?.vehicle?.id, journey.data?.vehicle.id, mapOrigin, activeType]);

  return (
    <MapsApiGate>
    <div className="flex h-full min-h-0 overflow-hidden bg-white">
      {leftOpen && (
        <aside className="hidden h-full w-72 min-w-72 shrink-0 flex-col overflow-x-hidden overflow-y-hidden border-r border-line bg-white lg:flex">
          <IncidentList
            queue={queue}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              setCreating(false);
              setAckRerouteId(null);
              setRightOpen(true);
            }}
            onNew={startNew}
            onHide={() => setLeftOpen(false)}
          />
        </aside>
      )}

      <main className="relative min-h-0 min-w-0 flex-1">
        <DispatchMap
          vehicles={mapVehicles}
          origin={mapOrigin}
          destination={mapDestination}
          candidates={routeRequest?.candidates}
          selectedId={selectedCandidateId}
          selectedVehicleId={emergency?.vehicle?.id ?? journey.data?.vehicle.id ?? null}
          vehiclePosition={vehiclePosition}
          movingVehicle={
            journey.data
              ? {
                  id: journey.data.vehicle.id,
                  callSign: journey.data.vehicle.callSign,
                  status: journey.data.journey.status === "ACTIVE" ? "EN ROUTE" : journey.data.journey.status,
                  type: journey.data.vehicle.type,
                }
              : emergency?.vehicle
                ? {
                    id: emergency.vehicle.id,
                    callSign: emergency.vehicle.callSign,
                    status: emergency.vehicle.status,
                    type: emergency.vehicle.type,
                  }
                : null
          }
          hospitals={mapHospitals}
          destinationKind={destinationKind}
          roadConditions={roads.data?.roadConditions}
          onMapClick={onMapClick}
          pinMode={creating ? pinMode : null}
          onVehicleClick={(vehicle) => previewSiren(vehicle.type as SirenKind)}
          sirenMuted={sirenMuted}
          onToggleSiren={() => {
            const next = !sirenMuted;
            setSirenMuted(next);
            setSirenMutedState(next);
          }}
          sirenHint={
            journey.data?.journey.status === "ACTIVE" && journey.data.vehicle.type
              ? sirenLabel(journey.data.vehicle.type as SirenKind)
              : undefined
          }
        />

        {!leftOpen && (
        <button
          className="absolute left-3 top-3 z-20 flex h-9 items-center gap-2 rounded-lg border border-line bg-white px-3 text-[13px] shadow-sm"
          onClick={() => setLeftOpen(true)}
        >
          <Menu size={15} />
          Incidents
          <span className="rounded-full bg-critical px-1.5 text-[11px] font-medium text-white">
            {queue.length}
          </span>
        </button>
        )}

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

        {journey.data?.events.find((event) => event.type === "REROUTED") &&
          ackRerouteId !== journey.data.events.find((event) => event.type === "REROUTED")?.id && (
          <div className="absolute left-1/2 top-3 z-30 w-[min(380px,calc(100%-24px))] -translate-x-1/2 border border-amber-200 bg-white p-3 shadow-sm">
              <div className="text-[12px] font-semibold text-amber-700">Route updated</div>
              <p className="mt-1 text-[13px] text-ink">
                Road blockage detected. RapidRoute selected an alternate route.
              </p>
              <button
                className="mt-2 text-[12px] font-medium text-nav"
                onClick={() =>
                  setAckRerouteId(journey.data?.events.find((event) => event.type === "REROUTED")?.id ?? null)
                }
              >
                Acknowledge
              </button>
            </div>
          )}

      </main>

      {rightOpen && (
          <aside className="absolute inset-x-0 bottom-0 z-20 flex max-h-[52%] flex-col overflow-hidden border-t border-line bg-white lg:static lg:z-0 lg:h-full lg:max-h-none lg:w-[320px] lg:shrink-0 lg:border-l lg:border-t-0">
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

            {error && <div className="bg-red-50 px-4 py-2 text-[13px] text-critical">{error}</div>}

            <div className="min-h-0 flex-1 overflow-y-auto">
            {creating && (
              <NewEmergencyForm
                form={form}
                setForm={setForm}
                pinMode={pinMode}
                setPinMode={setPinMode}
                origins={originOptions}
                hospitals={hospitalOptions}
                fireScenes={fireSceneOptions}
                pending={createEmergency.isPending}
                onAmbulanceDemo={() => applyDemoPreset(MUMBAI_DEMO)}
                onFireDemo={() => applyDemoPreset(MUMBAI_FIRE_DEMO)}
                onSubmit={() => {
                  if (!form.originLat) {
                    setError("Scene location is required");
                    return;
                  }
                  if (goesToHospital(form.incidentType) && !form.destinationLat) {
                    setError("Hospital is required for ambulance jobs");
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
                whyOpen={whyOpen}
                onToggleWhy={() => setWhyOpen((v) => !v)}
                onAssign={(id) => assignVehicle.mutate(id)}
                onCalculate={() => calculateRoutes.mutate()}
                onSelect={(id) => selectRoute.mutate(id)}
                onStart={() => dispatch.mutate(undefined)}
              />
            )}
            </div>
          </aside>
      )}
    </div>
    </MapsApiGate>
  );
}

function IncidentList({
  queue,
  selectedId,
  onSelect,
  onNew,
  onHide,
}: {
  queue: Emergency[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onHide?: () => void;
}) {
  return (
    <div className="flex h-full min-w-0 w-full flex-col">
      <div className="flex min-w-0 shrink-0 items-center justify-between gap-2 px-3 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <h2 className="truncate text-[16px] font-semibold">Incidents</h2>
          <span className="grid h-5 min-w-5 shrink-0 place-items-center bg-critical px-1.5 text-[11px] font-medium text-white">
            {queue.length}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" className="shrink-0 whitespace-nowrap text-[13px] font-medium text-nav" onClick={onNew}>
            New
          </button>
          {onHide && (
            <button
              type="button"
              className="shrink-0 whitespace-nowrap text-[13px] text-muted"
              onClick={onHide}
              aria-label="Hide incidents"
            >
              Hide
            </button>
          )}
        </div>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 pb-4">
        {queue.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              "mb-1.5 w-full border bg-white px-3 py-2 text-left",
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
              {item.priority === "STANDARD" ? "Normal" : "Critical"}
            </div>
            <div className="mt-0.5 truncate text-[13px] font-medium">{incidentTitle(item.incidentType, item.notes)}</div>
            <div className="mt-0.5 truncate text-[12px] text-muted">{item.originLabel}</div>
            <div className="mt-1 flex min-w-0 items-center justify-between gap-2 text-[11px] text-muted">
              <span className="min-w-0 truncate">{timeAgo(item.createdAt)}</span>
              <span className="shrink-0 font-mono">{item.code}</span>
            </div>
          </button>
        ))}
        {queue.length === 0 && <p className="px-1 py-8 text-[13px] text-muted">No incidents yet.</p>}
      </div>
      <Link to="/demo" className="border-t border-line px-4 py-2 text-[12px] text-nav">
        Official scenarios →
      </Link>
    </div>
  );
}

function NewEmergencyForm({
  form,
  setForm,
  pinMode,
  setPinMode,
  origins,
  hospitals,
  fireScenes,
  pending,
  onAmbulanceDemo,
  onFireDemo,
  onSubmit,
}: {
  form: typeof emptyForm;
  setForm: (next: typeof emptyForm | ((f: typeof emptyForm) => typeof emptyForm)) => void;
  pinMode: "origin" | "destination" | null;
  setPinMode: (mode: "origin" | "destination" | null) => void;
  origins: Array<{ id: string; label: string; lat: number; lng: number }>;
  hospitals: HospitalPlace[];
  fireScenes: HospitalPlace[];
  pending: boolean;
  onAmbulanceDemo: () => void;
  onFireDemo: () => void;
  onSubmit: () => void;
}) {
  const toHospital = goesToHospital(form.incidentType);
  const destSuggestions = toHospital ? hospitals : fireScenes;

  function changeType(nextType: IncidentType) {
    setForm((f) => {
      const next = { ...f, incidentType: nextType };
      if (!goesToHospital(nextType)) {
        next.destinationLabel = "Fire scene";
        next.destinationLat = f.originLat;
        next.destinationLng = f.originLng;
      } else if (f.destinationLabel === f.originLabel) {
        next.destinationLabel = "";
        next.destinationLat = "";
        next.destinationLng = "";
      }
      return next;
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h2 className="text-[14px] font-semibold">New incident</h2>
        <div className="flex gap-2 text-[12px]">
          <button className="font-medium text-nav" onClick={onAmbulanceDemo}>Ambulance</button>
          <button className="font-medium text-nav" onClick={onFireDemo}>Fire</button>
          <Link to="/demo" className="font-medium text-nav">Scenarios</Link>
        </div>
      </div>
      <div className="space-y-3 px-4 py-3">
        <Field label="Emergency Type">
          <select
            className={inputClass()}
            value={form.incidentType}
            onChange={(e) => changeType(e.target.value as IncidentType)}
          >
            <option value="MEDICAL">Medical — illness</option>
            <option value="TRAUMA">Trauma — crash / injury</option>
            <option value="FIRE">Fire — building / vehicle</option>
            <option value="POLICE">Police</option>
          </select>
          <p className="mt-1 text-[11px] text-muted">
            {form.incidentType === "FIRE"
              ? "Engine goes to the fire, not a hospital."
              : form.incidentType === "TRAUMA"
                ? "Crash / bleeding → trauma hospital."
                : form.incidentType === "POLICE"
                  ? "Unit goes to the scene."
                  : "Illness → hospital."}
          </p>
        </Field>
        <div>
          <div className="mb-1 text-[12px] font-medium text-muted">Priority</div>
          <div className="flex border border-line">
            <button
              type="button"
              className={cn(
                "flex-1 py-1.5 text-[13px]",
                form.priority !== "STANDARD" ? "bg-critical text-white" : "bg-white text-muted",
              )}
              onClick={() => setForm((f) => ({ ...f, priority: "CRITICAL" }))}
            >
              Critical
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 border-l border-line py-1.5 text-[13px]",
                form.priority === "STANDARD" ? "bg-ink text-white" : "bg-white text-muted",
              )}
              onClick={() => setForm((f) => ({ ...f, priority: "STANDARD" }))}
            >
              Normal
            </button>
          </div>
          <p className="mt-1 text-[11px] text-muted">
            {form.priority === "STANDARD" ? "Balanced score." : "Time matters most."}
          </p>
        </div>
        <Field label={toHospital ? "Scene" : "Fire / scene"}>
          <PlaceSearch
            value={form.originLabel}
            placeholder="Search the incident location"
            suggestions={toHospital ? origins : [...fireScenes, ...origins]}
            onSelect={(place) =>
              setForm((f) => ({
                ...f,
                originLabel: place.label,
                originLat: String(place.lat),
                originLng: String(place.lng),
                ...(!goesToHospital(f.incidentType)
                  ? {
                      destinationLabel: "Fire scene",
                      destinationLat: String(place.lat),
                      destinationLng: String(place.lng),
                    }
                  : {}),
              }))
            }
          />
        </Field>
        {toHospital && (
        <Field label="Hospital">
          <PlaceSearch
            value={form.destinationLabel}
            placeholder="Search a hospital"
            suggestions={destSuggestions}
            onSelect={(place) =>
              setForm((f) => ({
                ...f,
                destinationLabel: place.label,
                destinationLat: String(place.lat),
                destinationLng: String(place.lng),
              }))
            }
          />
        </Field>
        )}
        <div className="flex gap-2">
          <Button type="button" variant={pinMode === "origin" ? "primary" : "ghost"} className="flex-1" onClick={() => setPinMode("origin")}>
            <MapPin size={14} /> Pin scene
          </Button>
          {toHospital && (
          <Button type="button" variant={pinMode === "destination" ? "primary" : "ghost"} className="flex-1" onClick={() => setPinMode("destination")}>
            <MapPin size={14} /> Pin hospital
          </Button>
          )}
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
  explanation,
  journey,
  calculating,
  dispatching,
  whyOpen,
  onToggleWhy,
  onAssign,
  onCalculate,
  onSelect,
  onStart,
}: {
  emergency: Emergency;
  recommendedVehicles: Array<Vehicle & { distanceMeters: number; reason?: string; recommended?: boolean }>;
  routeRequest: RouteRequest | null;
  recommended: Candidate | null;
  alternatives: Candidate[];
  explanation?: Explanation;
  journey?: JourneyDetail;
  calculating: boolean;
  dispatching: boolean;
  whyOpen: boolean;
  onToggleWhy: () => void;
  onAssign: (id?: string) => void;
  onCalculate: () => void;
  onSelect: (id: string) => void;
  onStart: () => void;
}) {
  const recScore = displayScore(recommended?.score);
  const path = pathEnds(emergency);
  const typeLabel =
    emergency.incidentType === "FIRE"
      ? "Fire"
      : emergency.incidentType === "TRAUMA"
        ? "Trauma"
        : emergency.incidentType === "POLICE"
          ? "Police"
          : "Medical";
  return (
    <div className="pb-4">
      <section className="border-b border-line px-4 py-3">
        <div className="text-[11px] font-semibold tracking-wide text-muted">INCIDENT</div>
        <div className="mt-1 text-[13px] font-semibold">{typeLabel}</div>
        <div className="mt-2 grid grid-cols-[72px_1fr] gap-y-1 text-[12px]">
          <span className="text-muted">Priority</span>
          <span className={emergency.priority === "STANDARD" ? "" : "font-medium text-critical"}>
            {emergency.priority === "STANDARD" ? "Normal" : "Critical"}
          </span>
          <span className="text-muted">Origin</span>
          <span>{path.from}</span>
          <span className="text-muted">Destination</span>
          <span>{path.to}</span>
        </div>
        <div className="mt-2 font-mono text-[11px] text-muted">{emergency.code}</div>
      </section>

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
                    "w-full border px-3 py-2 text-left",
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
        <section className="border-b border-line px-4 py-3">
          <div className="text-[11px] font-semibold tracking-wide text-muted">RECOMMENDED ROUTE</div>
          <div className="mt-2 flex items-start justify-between">
            <div>
              <div className="text-[20px] font-semibold tabular leading-none">{recommended.etaLabel}</div>
              <div className="mt-1 text-[12px] text-muted">{recommended.distanceLabel}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-muted">Score</div>
              <div className="text-[20px] font-semibold tabular">{recScore ?? "—"}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
            <Metric label="Traffic" value={trafficLabel(recommended.trafficLevel)} tone={trafficTone(recommended.trafficLevel)} />
            <Metric label="Road status" value={roadLabel(recommended.roadImpact)} tone={roadTone(recommended.roadImpact)} />
            <Metric
              label="Priority match"
              value={emergency.priority === "STANDARD" ? "Normal" : "Critical · time first"}
              tone={emergency.priority === "STANDARD" ? "neutral" : "critical"}
            />
            {routeRequest?.dataSourceLabel === "GOOGLE ROUTES" ? (
              <Metric label="Source" value="Google Routes" tone="nav" />
            ) : routeRequest?.dataSourceLabel ? (
              <Metric label="Source" value="Demo simulation" tone="warning" />
            ) : null}
          </div>
          {emergency.status !== "DISPATCHED" && emergency.status !== "COMPLETED" && (
            <Button className="mt-3 w-full" disabled={dispatching || recommended.blocked} onClick={onStart}>
              <Play size={14} fill="currentColor" /> Start Journey
            </Button>
          )}
        </section>
      )}

      {alternatives.length > 0 && (
        <section className="border-b border-line px-4 py-3">
          <div className="text-[11px] font-semibold tracking-wide text-muted">ALTERNATIVE ROUTES</div>
          <div className="mt-2 space-y-1.5">
            {alternatives.map((candidate, index) => (
              <button
                key={candidate.id}
                disabled={candidate.blocked}
                onClick={() => onSelect(candidate.id)}
                className="flex w-full items-center justify-between border border-line px-2.5 py-2 text-left disabled:opacity-50"
              >
                <div>
                  <div className="text-[13px] font-medium">
                    Route {index + 2} · {candidate.etaLabel}
                  </div>
                  <div className="text-[11px] text-muted">
                    {candidate.distanceLabel}
                    {candidate.blocked ? " · Blocked" : ""}
                  </div>
                </div>
                <div className="text-right text-[13px] tabular">{displayScore(candidate.score) ?? "—"}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {explanation && (
        <WhyBlock
          explanation={explanation}
          recommended={recommended}
          open={whyOpen}
          onToggle={onToggleWhy}
        />
      )}

      {journey && (
        <section className="border-t border-line px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-muted">
              {journey.vehicle.callSign}
              {journey.journey.currentRouteLabel ? ` · ${journey.journey.currentRouteLabel}` : ""}
            </div>
            <StatusChip tone={journey.journey.status === "ACTIVE" ? "clear" : "neutral"}>
              {journey.journey.status === "ACTIVE" ? "En route" : journey.journey.status.toLowerCase()}
            </StatusChip>
          </div>
          <div className="mt-1 text-[16px] font-semibold tabular">
            {formatDuration(journey.journey.routeEtaSeconds ?? journey.journey.remainingSeconds ?? 0)}
            {journey.journey.estimatedArrivalAt ? ` · ${formatEtaClock(journey.journey.estimatedArrivalAt)}` : ""}
          </div>
          <div className="mt-2 h-1 overflow-hidden bg-slate-100">
            <div className="h-full bg-nav" style={{ width: `${Math.round(journey.journey.progress * 100)}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-muted">Simulated movement. Route duration stays at dispatch.</p>
          <ol className="mt-2 space-y-1">
            {journey.events.slice(0, 4).map((event) => (
              <li key={event.id} className="flex gap-2 text-[11px] text-muted">
                <span className="w-10 shrink-0 font-mono">{formatWhen(event.occurredAt).slice(0, 5)}</span>
                <span>{event.type.replaceAll("_", " ").toLowerCase()}</span>
              </li>
            ))}
          </ol>
        </section>
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

function WhyBlock({
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
  const traffic = factorScore(recommended?.breakdown?.trafficScore ?? explanation.components?.trafficScore);
  const road = factorScore(recommended?.breakdown?.roadStatusScore ?? explanation.components?.roadStatusScore);
  const distance = factorScore(recommended?.breakdown?.distanceScore ?? explanation.components?.distanceScore);
  const eta = factorScore(recommended?.breakdown?.travelTimeScore ?? explanation.components?.travelTimeScore);
  return (
    <section className="px-4 py-3">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between text-left">
        <span className="text-[11px] font-semibold tracking-wide text-muted">WHY THIS ROUTE?</span>
        <ChevronDown size={14} className={cn("text-muted", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-2">
          <p className="text-[12px] leading-relaxed text-ink">{explanation.summary}</p>
          <div className="mt-2 space-y-1">
            <Bar label="Travel time" value={eta} emphasize />
            <Bar label="Traffic" value={traffic} />
            <Bar label="Road status" value={road} />
            <Bar label="Distance" value={distance} />
          </div>
          {emergencyPriorityLine(explanation)}
        </div>
      )}
    </section>
  );
}

function emergencyPriorityLine(explanation: Explanation) {
  const critical = explanation.emergencyPriority !== "STANDARD";
  return (
    <p className="mt-2 text-[11px] text-muted">
      {critical
        ? "Critical job — travel time has the highest weight (55%)."
        : "Normal job — weights are more balanced."}
    </p>
  );
}

function Bar({ label, value, emphasize }: { label: string; value: number; emphasize?: boolean }) {
  return (
    <div className="grid grid-cols-[92px_1fr_48px] items-center gap-2 text-[12px]">
      <span className={emphasize ? "font-semibold text-critical" : "text-muted"}>{label}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${emphasize ? "bg-critical" : "bg-clear"}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-right tabular text-muted">
        {value}
        <span className="text-slate-400"> /100</span>
      </span>
    </div>
  );
}
