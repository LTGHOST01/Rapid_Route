import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Button, Field, Panel, StatusChip, inputClass, roadTone, vehicleTone } from "../components/ui";
import { roadLabel, vehicleStatusLabel } from "../lib/labels";
import type { Emergency, RoadCondition, RoadStatus, Vehicle, VehicleStatus, VehicleType } from "../types";
import { cn } from "../lib/cn";

type Stats = {
  stats: {
    emergencies: Record<string, number>;
    activeJourneys: number;
    vehicles: Record<string, number>;
    routeRequests: number;
    googleRequests: number;
    demoRequests: number;
    reroutes: number;
  };
};

type Tab = "overview" | "vehicles" | "roads" | "logs";

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  return (
    <div className="flex h-full flex-col bg-ink-950 md:flex-row">
      <aside className="flex gap-1 overflow-x-auto border-b border-ink-700 px-3 py-2 md:w-48 md:flex-col md:border-b-0 md:border-r">
        {(
          [
            ["overview", "Overview"],
            ["vehicles", "Vehicles"],
            ["roads", "Road reports"],
            ["logs", "Logs"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "rounded-sm px-3 py-2 text-left text-[13px]",
              tab === id ? "bg-ink-800 text-paper" : "text-ash-400 hover:text-paper",
            )}
          >
            {label}
          </button>
        ))}
      </aside>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
        {tab === "overview" && <Overview />}
        {tab === "vehicles" && <VehiclesAdmin />}
        {tab === "roads" && <RoadsAdmin />}
        {tab === "logs" && <LogsAdmin />}
      </div>
    </div>
  );
}

function Overview() {
  const stats = useQuery({
    queryKey: ["stats"],
    queryFn: () => api<Stats>("/admin/stats"),
  });
  const s = stats.data?.stats;
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl font-semibold">Operations</h1>
      <p className="mt-1 text-[13px] text-ash-400">
        Live counts from the dispatch database. Demo requests are labelled separately
        from Google Routes.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Active journeys" value={s?.activeJourneys ?? "—"} />
        <Stat label="Route requests" value={s?.routeRequests ?? "—"} />
        <Stat label="Google requests" value={s?.googleRequests ?? "—"} />
        <Stat label="Demo fallback" value={s?.demoRequests ?? "—"} />
        <Stat label="Reroutes" value={s?.reroutes ?? "—"} />
        <Stat label="Vehicles available" value={s?.vehicles?.AVAILABLE ?? "—"} />
        <Stat label="Vehicles assigned" value={s?.vehicles?.ASSIGNED ?? "—"} />
        <Stat label="Open emergencies" value={s?.emergencies?.OPEN ?? 0} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-ink-700 bg-ink-900 px-3 py-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-ash-400">{label}</div>
      <div className="mt-1 font-mono text-2xl tabular">{value}</div>
    </div>
  );
}

function VehiclesAdmin() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => api<{ vehicles: Vehicle[] }>("/vehicles"),
  });
  const [draft, setDraft] = useState({
    callSign: "",
    type: "AMBULANCE" as VehicleType,
    latitude: "19.0178",
    longitude: "72.8478",
    locationLabel: "",
  });

  const create = useMutation({
    mutationFn: () =>
      api("/vehicles", {
        method: "POST",
        body: JSON.stringify({
          ...draft,
          latitude: Number(draft.latitude),
          longitude: Number(draft.longitude),
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      setDraft((d) => ({ ...d, callSign: "", locationLabel: "" }));
    },
  });

  const patch = useMutation({
    mutationFn: ({ id, status }: { id: string; status: VehicleStatus }) =>
      api(`/vehicles/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Fleet</h1>
        <p className="mt-1 text-[13px] text-ash-400">
          Availability is operational state, not live GPS. Assigned units cannot be
          marked available until the journey completes.
        </p>
      </div>
      <div className="overflow-x-auto border border-ink-700">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-ink-900 text-[10px] uppercase tracking-[0.14em] text-ash-400">
            <tr>
              <th className="px-3 py-2">Call sign</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Post</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {list.data?.vehicles.map((vehicle) => (
              <tr key={vehicle.id} className="border-t border-ink-800">
                <td className="px-3 py-2 font-mono">{vehicle.callSign}</td>
                <td className="px-3 py-2">{vehicle.type}</td>
                <td className="px-3 py-2 text-ash-300">{vehicle.locationLabel}</td>
                <td className="px-3 py-2">
                  <StatusChip tone={vehicleTone(vehicle.status)}>
                    {vehicleStatusLabel(vehicle.status)}
                  </StatusChip>
                </td>
                <td className="px-3 py-2 text-right">
                  {vehicle.status !== "ASSIGNED" && (
                    <button
                      className="text-[12px] text-brass"
                      onClick={() =>
                        patch.mutate({
                          id: vehicle.id,
                          status: vehicle.status === "INACTIVE" ? "AVAILABLE" : "INACTIVE",
                        })
                      }
                    >
                      {vehicle.status === "INACTIVE" ? "Activate" : "Deactivate"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Panel title="Add vehicle">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Call sign">
            <input
              className={inputClass()}
              value={draft.callSign}
              onChange={(e) => setDraft({ ...draft, callSign: e.target.value })}
            />
          </Field>
          <Field label="Type">
            <select
              className={inputClass()}
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value as VehicleType })}
            >
              <option>AMBULANCE</option>
              <option>FIRE</option>
              <option>POLICE</option>
            </select>
          </Field>
          <Field label="Post">
            <input
              className={inputClass()}
              value={draft.locationLabel}
              onChange={(e) => setDraft({ ...draft, locationLabel: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Lat">
              <input
                className={inputClass()}
                value={draft.latitude}
                onChange={(e) => setDraft({ ...draft, latitude: e.target.value })}
              />
            </Field>
            <Field label="Lng">
              <input
                className={inputClass()}
                value={draft.longitude}
                onChange={(e) => setDraft({ ...draft, longitude: e.target.value })}
              />
            </Field>
          </div>
        </div>
        <Button className="mt-3" onClick={() => create.mutate()} disabled={create.isPending}>
          Save vehicle
        </Button>
        {create.error && (
          <p className="mt-2 text-[12px] text-red-300">{(create.error as Error).message}</p>
        )}
      </Panel>
    </div>
  );
}

function RoadsAdmin() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["roads-all"],
    queryFn: () => api<{ roadConditions: RoadCondition[] }>("/road-conditions"),
  });
  const [draft, setDraft] = useState({
    title: "",
    corridorId: "MARINE_DRIVE",
    status: "CONGESTED" as RoadStatus,
  });

  const create = useMutation({
    mutationFn: () =>
      api("/road-conditions", {
        method: "POST",
        body: JSON.stringify({ ...draft, simulated: true }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roads-all"] });
      qc.invalidateQueries({ queryKey: ["roads"] });
    },
  });

  const patch = useMutation({
    mutationFn: ({ id, status }: { id: string; status: RoadStatus }) =>
      api(`/road-conditions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roads-all"] });
      qc.invalidateQueries({ queryKey: ["roads"] });
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Road reports</h1>
        <p className="mt-1 text-[13px] text-ash-400">
          Local operational input. Seeded corridors are labelled DEMO SIMULATION and
          are not municipal live feeds.
        </p>
      </div>
      <div className="space-y-2">
        {list.data?.roadConditions.map((condition) => (
          <div
            key={condition.id}
            className="flex flex-wrap items-center justify-between gap-3 border border-ink-700 bg-ink-900 px-3 py-3"
          >
            <div>
              <div className="text-[13px]">{condition.title}</div>
              <div className="font-mono text-[11px] text-ash-400">{condition.corridorId}</div>
            </div>
            <div className="flex items-center gap-2">
              <StatusChip tone={roadTone(condition.status)}>{roadLabel(condition.status)}</StatusChip>
              {(["CLEAR", "CONGESTED", "BLOCKED"] as const).map((status) => (
                <button
                  key={status}
                  className="text-[11px] uppercase tracking-[0.12em] text-ash-400 hover:text-paper"
                  onClick={() => patch.mutate({ id: condition.id, status })}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Panel title="Add report">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Title">
            <input
              className={inputClass()}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </Field>
          <Field label="Corridor">
            <input
              className={inputClass()}
              value={draft.corridorId}
              onChange={(e) => setDraft({ ...draft, corridorId: e.target.value })}
            />
          </Field>
          <Field label="Status">
            <select
              className={inputClass()}
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as RoadStatus })}
            >
              <option>CLEAR</option>
              <option>ADVISORY</option>
              <option>CONGESTED</option>
              <option>BLOCKED</option>
            </select>
          </Field>
        </div>
        <Button className="mt-3" onClick={() => create.mutate()}>
          Save report
        </Button>
      </Panel>
    </div>
  );
}

function LogsAdmin() {
  const routes = useQuery({
    queryKey: ["route-logs"],
    queryFn: () =>
      api<{
        routeRequests: Array<{
          id: string;
          emergencyCode: string;
          provider: string;
          dataSourceLabel: string;
          requestedAt: string;
          candidates: unknown[];
          selection: { candidate: { label: string; score: number | null } | null } | null;
        }>;
      }>("/logs/route-requests"),
  });
  const emergencies = useQuery({
    queryKey: ["emergency-logs"],
    queryFn: () =>
      api<{ emergencies: Array<Emergency & { journeyStatus: string | null }> }>(
        "/logs/emergencies",
      ),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Logs</h1>
        <p className="mt-1 text-[13px] text-ash-400">
          Every provider request and selection is stored with its score breakdown.
        </p>
      </div>
      <section>
        <h2 className="text-[10px] uppercase tracking-[0.16em] text-ash-400">Route requests</h2>
        <div className="mt-2 overflow-x-auto border border-ink-700">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-ink-900 text-[10px] uppercase tracking-[0.14em] text-ash-400">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Incident</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Selected</th>
                <th className="px-3 py-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {routes.data?.routeRequests.map((row) => (
                <tr key={row.id} className="border-t border-ink-800">
                  <td className="px-3 py-2 font-mono text-[12px] text-ash-300">
                    {new Date(row.requestedAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{row.emergencyCode}</td>
                  <td className="px-3 py-2">{row.dataSourceLabel}</td>
                  <td className="px-3 py-2">{row.selection?.candidate?.label ?? "—"}</td>
                  <td className="px-3 py-2 font-mono">
                    {row.selection?.candidate?.score ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="text-[10px] uppercase tracking-[0.16em] text-ash-400">Emergencies</h2>
        <div className="mt-2 overflow-x-auto border border-ink-700">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-ink-900 text-[10px] uppercase tracking-[0.14em] text-ash-400">
              <tr>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Priority</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Origin</th>
                <th className="px-3 py-2">Journey</th>
              </tr>
            </thead>
            <tbody>
              {emergencies.data?.emergencies.map((row) => (
                <tr key={row.id} className="border-t border-ink-800">
                  <td className="px-3 py-2 font-mono">{row.code}</td>
                  <td className="px-3 py-2">{row.priority}</td>
                  <td className="px-3 py-2">{row.status}</td>
                  <td className="px-3 py-2 text-ash-300">{row.originLabel}</td>
                  <td className="px-3 py-2">{row.journeyStatus ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
