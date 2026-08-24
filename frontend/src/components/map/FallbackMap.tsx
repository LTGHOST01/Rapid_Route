import { useMemo } from "react";
import { boundsOf, decodePolyline, type LatLng } from "../../lib/geo";
import { routeColor } from "../../lib/mapStyles";
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
  pad = 36,
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
    <div className="relative h-full w-full overflow-hidden bg-ink-950">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        onClick={(event) => {
          if (!onMapClick) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * width;
          const y = ((event.clientY - rect.top) / rect.height) * height;
          const pad = 36;
          const latSpan = Math.max(0.01, bounds.maxLat - bounds.minLat);
          const lngSpan = Math.max(0.01, bounds.maxLng - bounds.minLng);
          const lng = bounds.minLng + ((x - pad) / (width - pad * 2)) * lngSpan;
          const lat = bounds.maxLat - ((y - pad) / (height - pad * 2)) * latSpan;
          onMapClick({ lat, lng });
        }}
      >
        <rect width={width} height={height} fill="#0c0e11" />
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            x2={width}
            y1={(i * height) / 12}
            y2={(i * height) / 12}
            stroke="#1c2128"
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <line
            key={`v${i}`}
            y1={0}
            y2={height}
            x1={(i * width) / 12}
            x2={(i * width) / 12}
            stroke="#1c2128"
            strokeWidth={1}
          />
        ))}

        {candidates.map((candidate, index) => {
          const pts = decodePolyline(candidate.polyline).map((p) =>
            project(p, bounds, width, height),
          );
          const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
          const recommended = candidate.id === selectedId && !candidate.blocked;
          return (
            <path
              key={candidate.id}
              d={d}
              fill="none"
              stroke={routeColor(index, recommended, candidate.blocked)}
              strokeWidth={recommended ? 6 : candidate.blocked ? 3 : 3.5}
              strokeDasharray={candidate.blocked ? "8 7" : undefined}
              opacity={candidate.blocked ? 0.55 : recommended ? 1 : 0.72}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
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
                stroke={condition.status === "BLOCKED" ? "#B42318" : "#B54708"}
                strokeWidth={8}
                opacity={0.28}
                strokeLinecap="round"
              />
            );
          })}

        {vehicles.map((vehicle) => {
          const p = project(
            { lat: vehicle.latitude, lng: vehicle.longitude },
            bounds,
            width,
            height,
          );
          return (
            <g key={vehicle.id}>
              <circle cx={p.x} cy={p.y} r={5} fill="#6E8B74" />
              <text x={p.x + 8} y={p.y + 4} fill="#b4b1a8" fontSize={11} fontFamily="IBM Plex Sans">
                {vehicle.callSign}
              </text>
            </g>
          );
        })}

        {origin && (
          <Marker
            point={project(origin, bounds, width, height)}
            label="Origin"
            color="#C4A574"
          />
        )}
        {destination && (
          <Marker
            point={project(destination, bounds, width, height)}
            label="Hospital"
            color="#E8D2A6"
          />
        )}
        {vehiclePosition && (
          <g>
            <circle
              cx={project(vehiclePosition, bounds, width, height).x}
              cy={project(vehiclePosition, bounds, width, height).y}
              r={9}
              fill="#14171c"
              stroke="#E8D2A6"
              strokeWidth={2}
            />
            <text
              x={project(vehiclePosition, bounds, width, height).x}
              y={project(vehiclePosition, bounds, width, height).y + 4}
              textAnchor="middle"
              fill="#E8D2A6"
              fontSize={9}
              fontFamily="IBM Plex Sans"
              fontWeight={600}
            >
              +
            </text>
          </g>
        )}
      </svg>
      <div className="pointer-events-none absolute left-3 top-3 rounded-sm border border-brass/40 bg-ink-900/90 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-brass">
        Demo simulation — schematic geometry
      </div>
    </div>
  );
}

function Marker({
  point,
  label,
  color,
}: {
  point: { x: number; y: number };
  label: string;
  color: string;
}) {
  return (
    <g>
      <circle cx={point.x} cy={point.y} r={6} fill={color} />
      <text
        x={point.x + 9}
        y={point.y - 8}
        fill={color}
        fontSize={11}
        fontFamily="IBM Plex Sans"
      >
        {label}
      </text>
    </g>
  );
}
