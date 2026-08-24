import { useMemo } from "react";
import { boundsOf, decodePolyline, type LatLng } from "../../lib/geo";
import { midpoint, routeColor } from "../../lib/mapStyles";
import type { Candidate, RoadCondition, Vehicle } from "../../types";
import type { HospitalPlace } from "../../lib/geo";

type Props = {
  vehicles: Vehicle[];
  origin?: LatLng & { label?: string };
  destination?: LatLng & { label?: string };
  candidates?: Candidate[];
  selectedId?: string | null;
  vehiclePosition?: LatLng | null;
  movingVehicle?: { id: string; callSign: string; status: string; type?: string } | null;
  hospitals?: HospitalPlace[];
  roadConditions?: RoadCondition[];
  onMapClick?: (point: LatLng) => void;
};

function project(
  point: LatLng,
  bounds: ReturnType<typeof boundsOf>,
  width: number,
  height: number,
  pad = 48,
) {
  const latSpan = Math.max(0.01, bounds.maxLat - bounds.minLat);
  const lngSpan = Math.max(0.01, bounds.maxLng - bounds.minLng);
  const x = pad + ((point.lng - bounds.minLng) / lngSpan) * (width - pad * 2);
  const y = pad + ((bounds.maxLat - point.lat) / latSpan) * (height - pad * 2);
  return { x, y };
}

export function FallbackMap({
  vehicles,
  origin,
  destination,
  candidates = [],
  selectedId,
  vehiclePosition,
  hospitals = [],
  roadConditions = [],
  onMapClick,
}: Props) {
  const allPoints = useMemo(() => {
    const pts: LatLng[] = [];
    vehicles.forEach((v) => pts.push({ lat: v.latitude, lng: v.longitude }));
    if (origin) pts.push(origin);
    if (destination) pts.push(destination);
    if (vehiclePosition) pts.push(vehiclePosition);
    candidates.forEach((c) => pts.push(...decodePolyline(c.polyline)));
    hospitals.forEach((h) => pts.push({ lat: h.lat, lng: h.lng }));
    return pts;
  }, [vehicles, origin, destination, candidates, vehiclePosition, hospitals]);

  const bounds = useMemo(() => boundsOf(allPoints), [allPoints]);
  const width = 1000;
  const height = 760;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#e8f0e3]">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        onClick={(event) => {
          if (!onMapClick) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * width;
          const y = ((event.clientY - rect.top) / rect.height) * height;
          const pad = 48;
          const latSpan = Math.max(0.01, bounds.maxLat - bounds.minLat);
          const lngSpan = Math.max(0.01, bounds.maxLng - bounds.minLng);
          const lng = bounds.minLng + ((x - pad) / (width - pad * 2)) * lngSpan;
          const lat = bounds.maxLat - ((y - pad) / (height - pad * 2)) * latSpan;
          onMapClick({ lat, lng });
        }}
      >
        <rect width={width} height={height} fill="#e8f0e3" />
        <rect x="0" y="80" width={width} height="220" fill="#d4e6f7" opacity="0.55" />
        {Array.from({ length: 10 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            x2={width}
            y1={(i * height) / 10}
            y2={(i * height) / 10}
            stroke="#d0d7de"
            strokeWidth={1}
          />
        ))}

        {candidates.map((candidate, index) => {
          const pts = decodePolyline(candidate.polyline).map((p) =>
            project(p, bounds, width, height),
          );
          const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
          const recommended = candidate.id === selectedId && !candidate.blocked;
          const mid = midpoint(pts);
          return (
            <g key={candidate.id}>
              <path
                d={d}
                fill="none"
                stroke={routeColor(index, recommended, candidate.blocked)}
                strokeWidth={recommended ? 6 : 4}
                opacity={candidate.blocked ? 0.45 : 1}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {mid && (
                <foreignObject x={mid.x - 32} y={mid.y - 18} width="64" height="36">
                  <div className={`rr-eta ${recommended ? "primary" : "alt"}`} style={{ transform: "none" }}>
                    <strong>{candidate.blocked ? "Blocked" : candidate.etaLabel}</strong>
                    {!candidate.blocked && <span>{candidate.distanceLabel}</span>}
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}

        {roadConditions
          .filter((c) => c.status !== "CLEAR" && c.geometry?.polyline)
          .map((condition) => {
            const pts = decodePolyline(condition.geometry.polyline!).map((p) =>
              project(p, bounds, width, height),
            );
            const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
            return (
              <path
                key={condition.id}
                d={d}
                fill="none"
                stroke={condition.status === "BLOCKED" ? "#D93025" : "#F9AB00"}
                strokeWidth={8}
                opacity={0.3}
                strokeLinecap="round"
              />
            );
          })}

        {hospitals.map((hospital) => {
          const p = project({ lat: hospital.lat, lng: hospital.lng }, bounds, width, height);
          return (
            <g key={hospital.id}>
              <image href="/markers/hospital.svg" x={p.x - 10} y={p.y - 24} width="20" height="26" />
            </g>
          );
        })}

        {vehicles.map((vehicle) => {
          const p = project({ lat: vehicle.latitude, lng: vehicle.longitude }, bounds, width, height);
          return (
            <g key={vehicle.id}>
              <image href="/markers/ambulance.svg" x={p.x - 16} y={p.y - 22} width="32" height="26" />
              <text x={p.x} y={p.y + 16} textAnchor="middle" fill="#202124" fontSize={11} fontFamily="Inter">
                {vehicle.callSign}
              </text>
            </g>
          );
        })}

        {origin && (
          <image
            href="/markers/incident.svg"
            x={project(origin, bounds, width, height).x - 11}
            y={project(origin, bounds, width, height).y - 26}
            width="22"
            height="28"
          />
        )}
        {destination && (
          <image
            href="/markers/hospital.svg"
            x={project(destination, bounds, width, height).x - 12}
            y={project(destination, bounds, width, height).y - 30}
            width="24"
            height="32"
          />
        )}
        {vehiclePosition && (
          <image
            href="/markers/ambulance.svg"
            x={project(vehiclePosition, bounds, width, height).x - 18}
            y={project(vehiclePosition, bounds, width, height).y - 26}
            width="36"
            height="30"
          />
        )}
      </svg>
      <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-line bg-white/90 px-2 py-1 text-[11px] text-muted">
        Demo simulation — schematic geometry
      </div>
    </div>
  );
}
