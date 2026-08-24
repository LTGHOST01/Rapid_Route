import { useMemo } from "react";
import { boundsOf, decodePolyline, type LatLng } from "../../lib/geo";
import { midpoint, routeColor } from "../../lib/mapStyles";
import type { Candidate, RoadCondition, Vehicle } from "../../types";

type Props = {
  vehicles: Vehicle[];
  origin?: LatLng & { label?: string };
  destination?: LatLng & { label?: string };
  candidates?: Candidate[];
  selectedId?: string | null;
  vehiclePosition?: LatLng | null;
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
    return pts;
  }, [vehicles, origin, destination, candidates, vehiclePosition]);

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

        {vehicles.map((vehicle) => {
          const p = project({ lat: vehicle.latitude, lng: vehicle.longitude }, bounds, width, height);
          return (
            <g key={vehicle.id}>
              <circle cx={p.x} cy={p.y} r={6} fill="#188038" stroke="#fff" strokeWidth={2} />
              <text x={p.x + 9} y={p.y + 4} fill="#202124" fontSize={11} fontFamily="Inter">
                {vehicle.callSign}
              </text>
            </g>
          );
        })}

        {origin && (
          <g>
            <circle
              cx={project(origin, bounds, width, height).x}
              cy={project(origin, bounds, width, height).y}
              r={8}
              fill="#188038"
              stroke="#fff"
              strokeWidth={2}
            />
          </g>
        )}
        {destination && (
          <g>
            <circle
              cx={project(destination, bounds, width, height).x}
              cy={project(destination, bounds, width, height).y}
              r={9}
              fill="#D93025"
              stroke="#fff"
              strokeWidth={2}
            />
          </g>
        )}
        {vehiclePosition && (
          <circle
            cx={project(vehiclePosition, bounds, width, height).x}
            cy={project(vehiclePosition, bounds, width, height).y}
            r={7}
            fill="#1A73E8"
            stroke="#fff"
            strokeWidth={2}
          />
        )}
      </svg>
      <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-line bg-white/90 px-2 py-1 text-[11px] text-muted">
        Demo simulation — schematic geometry
      </div>
    </div>
  );
}
