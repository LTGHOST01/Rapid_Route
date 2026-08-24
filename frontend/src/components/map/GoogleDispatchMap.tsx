import { useEffect, useMemo, useRef, useState } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { Minus, Plus, LocateFixed, Layers } from "lucide-react";
import { decodePolyline, type LatLng } from "../../lib/geo";
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

function Overlay({
  vehicles,
  origin,
  destination,
  candidates = [],
  selectedId,
  vehiclePosition,
  roadConditions = [],
  onMapClick,
}: Props) {
  const map = useMap();
  const overlays = useRef<google.maps.OverlayView[]>([]);

  const decoded = useMemo(
    () =>
      candidates.map((candidate, index) => ({
        candidate,
        index,
        path: decodePolyline(candidate.polyline),
      })),
    [candidates],
  );

  useEffect(() => {
    if (!map) return;
    const listeners: google.maps.MapsEventListener[] = [];
    if (onMapClick) {
      listeners.push(
        map.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) return;
          onMapClick({ lat: event.latLng.lat(), lng: event.latLng.lng() });
        }),
      );
    }

    const polylines: google.maps.Polyline[] = [];
    decoded.forEach(({ candidate, index, path }) => {
      const recommended = candidate.id === selectedId && !candidate.blocked;
      polylines.push(
        new google.maps.Polyline({
          map,
          path,
          strokeColor: routeColor(index, recommended, candidate.blocked),
          strokeOpacity: candidate.blocked ? 0.45 : recommended ? 1 : 0.85,
          strokeWeight: recommended ? 6 : 4,
          zIndex: recommended ? 5 : 2,
        }),
      );
    });

    roadConditions
      .filter((c) => c.status !== "CLEAR" && c.geometry?.polyline)
      .forEach((condition) => {
        polylines.push(
          new google.maps.Polyline({
            map,
            path: decodePolyline(condition.geometry.polyline!),
            strokeColor: condition.status === "BLOCKED" ? "#D93025" : "#F9AB00",
            strokeOpacity: 0.4,
            strokeWeight: 10,
            zIndex: 1,
          }),
        );
      });

    const markers: google.maps.Marker[] = [];
    vehicles.forEach((vehicle) => {
      markers.push(
        new google.maps.Marker({
          map,
          position: { lat: vehicle.latitude, lng: vehicle.longitude },
          title: vehicle.callSign,
          label: {
            text: vehicle.callSign,
            color: "#202124",
            fontSize: "11px",
            fontWeight: "600",
            fontFamily: "Inter",
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: vehicle.status === "AVAILABLE" ? "#188038" : "#1A73E8",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
        }),
      );
    });

    if (origin) {
      markers.push(
        new google.maps.Marker({
          map,
          position: origin,
          title: origin.label ?? "Origin",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 9,
            fillColor: "#188038",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
        }),
      );
    }
    if (destination) {
      markers.push(
        new google.maps.Marker({
          map,
          position: destination,
          title: destination.label ?? "Hospital",
          label: { text: "H", color: "#fff", fontSize: "10px", fontWeight: "700" },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#D93025",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          },
        }),
      );
    }
    if (vehiclePosition) {
      markers.push(
        new google.maps.Marker({
          map,
          position: vehiclePosition,
          title: "Simulated vehicle position",
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 5,
            fillColor: "#1A73E8",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 1,
          },
          zIndex: 12,
        }),
      );
    }

    overlays.current.forEach((o) => o.setMap(null));
    overlays.current = [];
    decoded.forEach(({ candidate, path }) => {
      const at = midpoint(path);
      if (!at) return;
      const recommended = candidate.id === selectedId && !candidate.blocked;
      overlays.current.push(
        makeEtaOverlay(at, candidate.etaLabel, candidate.distanceLabel, recommended, candidate.blocked),
      );
    });
    overlays.current.forEach((o) => o.setMap(map));

    const fit: LatLng[] = [];
    decoded.forEach((d) => fit.push(...d.path));
    if (origin) fit.push(origin);
    if (destination) fit.push(destination);
    if (fit.length === 0) {
      vehicles.forEach((v) => fit.push({ lat: v.latitude, lng: v.longitude }));
    }
    if (fit.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      fit.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 80);
    }

    return () => {
      polylines.forEach((line) => line.setMap(null));
      markers.forEach((marker) => marker.setMap(null));
      overlays.current.forEach((o) => o.setMap(null));
      overlays.current = [];
      listeners.forEach((listener) => listener.remove());
    };
  }, [map, decoded, vehicles, origin, destination, selectedId, vehiclePosition, roadConditions, onMapClick]);

  return null;
}

function makeEtaOverlay(
  position: LatLng,
  eta: string,
  distance: string,
  recommended: boolean,
  blocked: boolean,
) {
  const div = document.createElement("div");
  div.className = `rr-eta ${recommended ? "primary" : "alt"}`;
  div.innerHTML = blocked
    ? `<strong>Blocked</strong>`
    : `<strong>${eta}</strong><span>${distance}</span>`;

  class Label extends google.maps.OverlayView {
    onAdd() {
      this.getPanes()?.overlayMouseTarget.appendChild(div);
    }
    draw() {
      const projection = this.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToDivPixel(
        new google.maps.LatLng(position.lat, position.lng),
      );
      if (!point) return;
      div.style.left = `${point.x}px`;
      div.style.top = `${point.y}px`;
      div.style.position = "absolute";
    }
    onRemove() {
      div.remove();
    }
  }
  return new Label();
}

function MapHud({ showTraffic, onToggleTraffic }: { showTraffic: boolean; onToggleTraffic: () => void }) {
  const map = useMap();
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="pointer-events-auto absolute left-3 top-24 flex flex-col overflow-hidden rounded-lg border border-line bg-white shadow-sm">
        <button
          className="grid h-9 w-9 place-items-center text-ink hover:bg-soft"
          onClick={() => map?.setZoom((map.getZoom() ?? 12) + 1)}
          aria-label="Zoom in"
        >
          <Plus size={16} />
        </button>
        <button
          className="grid h-9 w-9 place-items-center border-t border-line text-ink hover:bg-soft"
          onClick={() => map?.setZoom((map.getZoom() ?? 12) - 1)}
          aria-label="Zoom out"
        >
          <Minus size={16} />
        </button>
        <button
          className="grid h-9 w-9 place-items-center border-t border-line text-ink hover:bg-soft"
          onClick={() => {
            const c = map?.getCenter();
            if (c) map?.panTo(c);
          }}
          aria-label="Recenter"
        >
          <LocateFixed size={15} />
        </button>
      </div>
      <div className="pointer-events-auto absolute bottom-6 right-4 flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-[13px] shadow-sm">
        <Layers size={14} className="text-muted" />
        Traffic
        <button
          type="button"
          onClick={onToggleTraffic}
          className={`relative h-5 w-9 rounded-full transition-colors ${showTraffic ? "bg-nav" : "bg-slate-300"}`}
          aria-label="Toggle traffic"
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${showTraffic ? "left-4" : "left-0.5"}`}
          />
        </button>
      </div>
    </div>
  );
}

function TrafficLayerOn({ enabled }: { enabled: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const layer = new google.maps.TrafficLayer();
    if (enabled) layer.setMap(map);
    return () => layer.setMap(null);
  }, [map, enabled]);
  return null;
}

export function GoogleDispatchMap(props: Props) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY as string;
  const center = props.origin ?? { lat: 19.076, lng: 72.8777 };
  const [traffic, setTraffic] = useState(false);

  return (
    <APIProvider apiKey={key}>
      <div className="relative h-full w-full">
        <Map
          defaultCenter={center}
          defaultZoom={12}
          disableDefaultUI
          clickableIcons={false}
          gestureHandling="greedy"
          mapTypeControl={false}
          fullscreenControl={false}
          streetViewControl={false}
          className="h-full w-full"
        >
          <Overlay {...props} />
          <TrafficLayerOn enabled={traffic} />
          <MapHud showTraffic={traffic} onToggleTraffic={() => setTraffic((v) => !v)} />
        </Map>
      </div>
    </APIProvider>
  );
}
