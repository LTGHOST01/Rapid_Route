import { useEffect, useMemo, useRef, useState } from "react";
import { Map, useMap } from "@vis.gl/react-google-maps";
import { Minus, Plus, LocateFixed, Layers } from "lucide-react";
import { decodePolyline, type LatLng } from "../../lib/geo";
import { midpoint, routeColor } from "../../lib/mapStyles";
import { hospitalIconUrl, incidentIconUrl, vehicleIconUrl } from "../../lib/mapIcons";
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
  pinMode?: "origin" | "destination" | null;
  hospitals?: HospitalPlace[];
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
  movingVehicle,
  hospitals = [],
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
    const info = new google.maps.InfoWindow();
    const movingId = movingVehicle?.id;

    vehicles
      .filter((vehicle) => vehicle.id !== movingId)
      .forEach((vehicle) => {
        const marker = new google.maps.Marker({
          map,
          position: { lat: vehicle.latitude, lng: vehicle.longitude },
          title: `${vehicle.callSign} · ${vehicle.status}`,
          label: {
            text: vehicle.callSign,
            className: "rr-unit-label",
            color: "#202124",
            fontSize: "10px",
            fontWeight: "600",
          },
          icon: {
            url: vehicleIconUrl(vehicle.type),
            scaledSize: new google.maps.Size(40, 32),
            anchor: new google.maps.Point(20, 28),
            labelOrigin: new google.maps.Point(20, -4),
          },
          zIndex: 8,
        });
        marker.addListener("click", () => {
          info.setContent(
            `<div style="font:12px Inter,sans-serif;color:#202124;min-width:130px">
              <div style="font-weight:600">${vehicle.callSign}</div>
              <div style="color:#5f6368;margin-top:2px">${vehicle.type} · ${vehicle.status}</div>
              <div style="color:#5f6368">${vehicle.locationLabel ?? ""}</div>
            </div>`,
          );
          info.open({ map, anchor: marker });
        });
        markers.push(marker);
      });

    hospitals.forEach((hospital) => {
      const isDestination =
        destination &&
        Math.abs(hospital.lat - destination.lat) < 0.0008 &&
        Math.abs(hospital.lng - destination.lng) < 0.0008;
      if (isDestination) return;
      const marker = new google.maps.Marker({
        map,
        position: { lat: hospital.lat, lng: hospital.lng },
        title: hospital.label,
        icon: {
          url: hospitalIconUrl("#d93025"),
          scaledSize: new google.maps.Size(22, 28),
          anchor: new google.maps.Point(11, 26),
        },
        opacity: 0.85,
        zIndex: 6,
      });
      marker.addListener("click", () => {
        info.setContent(
          `<div style="font:12px Inter,sans-serif;color:#202124;min-width:140px">
            <div style="font-weight:600">${hospital.label}</div>
            <div style="color:#5f6368;margin-top:2px">${hospital.area}</div>
            <div style="color:#5f6368">${hospital.facilityType}</div>
          </div>`,
        );
        info.open({ map, anchor: marker });
      });
      markers.push(marker);
    });

    if (origin) {
      const marker = new google.maps.Marker({
        map,
        position: origin,
        title: origin.label ?? "Incident",
        icon: {
          url: incidentIconUrl(),
          scaledSize: new google.maps.Size(28, 36),
          anchor: new google.maps.Point(14, 34),
        },
        zIndex: 9,
      });
      marker.addListener("click", () => {
        info.setContent(
          `<div style="font:12px Inter,sans-serif;color:#202124">
            <div style="font-weight:600">Incident</div>
            <div style="color:#5f6368;margin-top:2px">${origin.label ?? "Scene"}</div>
          </div>`,
        );
        info.open({ map, anchor: marker });
      });
      markers.push(marker);
    }
    if (destination) {
      const marker = new google.maps.Marker({
        map,
        position: destination,
        title: destination.label ?? "Hospital",
        icon: {
          url: hospitalIconUrl("#188038"),
          scaledSize: new google.maps.Size(30, 38),
          anchor: new google.maps.Point(15, 36),
        },
        zIndex: 10,
      });
      marker.addListener("click", () => {
        info.setContent(
          `<div style="font:12px Inter,sans-serif;color:#202124">
            <div style="font-weight:600">Destination</div>
            <div style="color:#5f6368;margin-top:2px">${destination.label ?? "Hospital"}</div>
          </div>`,
        );
        info.open({ map, anchor: marker });
      });
      markers.push(marker);
    }
    if (vehiclePosition) {
      markers.push(
        new google.maps.Marker({
          map,
          position: vehiclePosition,
          title: `${movingVehicle?.callSign ?? "Unit"} · ${movingVehicle?.status ?? "en route"}`,
          label: {
            text: movingVehicle?.callSign ?? "UNIT",
            className: "rr-unit-label",
            color: "#202124",
            fontSize: "10px",
            fontWeight: "600",
          },
          icon: {
            url: vehicleIconUrl(movingVehicle?.type ?? "AMBULANCE"),
            scaledSize: new google.maps.Size(46, 38),
            anchor: new google.maps.Point(23, 34),
            labelOrigin: new google.maps.Point(23, -4),
          },
          zIndex: 14,
        }),
      );
    }

    overlays.current.forEach((o) => o.setMap(null));
    overlays.current = [];
    if (vehiclePosition) {
      overlays.current.push(
        makeUnitLabel(vehiclePosition, movingVehicle?.callSign ?? "AMB", movingVehicle?.status ?? "EN ROUTE"),
      );
    }
    decoded.forEach(({ candidate, path }) => {
      const at = midpoint(path);
      if (!at) return;
      const recommended = candidate.id === selectedId && !candidate.blocked;
      overlays.current.push(
        makeEtaOverlay(at, candidate.etaLabel, candidate.distanceLabel, recommended, candidate.blocked),
      );
    });
    overlays.current.forEach((o) => o.setMap(map));

    return () => {
      polylines.forEach((line) => line.setMap(null));
      markers.forEach((marker) => marker.setMap(null));
      overlays.current.forEach((o) => o.setMap(null));
      overlays.current = [];
      listeners.forEach((listener) => listener.remove());
    };
  }, [map, decoded, vehicles, origin, destination, selectedId, vehiclePosition, movingVehicle, hospitals, roadConditions, onMapClick]);

  const fitKey = useMemo(
    () =>
      JSON.stringify({
        o: origin,
        d: destination,
        ids: decoded.map((row) => row.candidate.id),
      }),
    [origin, destination, decoded],
  );

  useEffect(() => {
    if (!map) return;
    const fit: LatLng[] = [];
    decoded.forEach((d) => fit.push(...d.path));
    if (origin) fit.push(origin);
    if (destination) fit.push(destination);
    if (fit.length === 0) {
      vehicles.forEach((v) => fit.push({ lat: v.latitude, lng: v.longitude }));
      hospitals.forEach((h) => fit.push({ lat: h.lat, lng: h.lng }));
    }
    if (fit.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    fit.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 80);
  }, [map, fitKey, decoded, origin, destination, vehicles, hospitals]);

  return null;
}

function makeUnitLabel(position: LatLng, callSign: string, status: string) {
  const div = document.createElement("div");
  div.style.cssText =
    "transform:translate(-50%,8px);background:#fff;border:1px solid #dadce0;border-radius:8px;padding:3px 6px;font:11px/1.2 Inter,sans-serif;color:#202124;box-shadow:0 1px 3px rgba(60,64,67,.18);text-align:center;white-space:nowrap;pointer-events:none;position:absolute";
  div.innerHTML = `<strong>${callSign}</strong><div style="color:#5f6368;font-size:10px">${status}</div>`;

  class Label extends google.maps.OverlayView {
    onAdd() {
      this.getPanes()?.overlayMouseTarget.appendChild(div);
    }
    draw() {
      const projection = this.getProjection();
      if (!projection) return;
      const point = projection.fromLatLngToDivPixel(new google.maps.LatLng(position.lat, position.lng));
      if (!point) return;
      div.style.left = `${point.x}px`;
      div.style.top = `${point.y + 18}px`;
    }
    onRemove() {
      div.remove();
    }
  }
  return new Label();
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
  const center = props.origin ?? { lat: 19.076, lng: 72.8777 };
  const [traffic, setTraffic] = useState(false);

  return (
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
      {props.pinMode && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full bg-ink px-3 py-1.5 text-[12px] text-white shadow">
          {props.pinMode === "origin" ? "Click the map to set the incident" : "Click the map to set the hospital"}
        </div>
      )}
      <div className="pointer-events-none absolute bottom-6 left-3 z-20 flex flex-wrap gap-2 rounded-lg border border-line bg-white/95 px-2.5 py-1.5 text-[11px] text-muted shadow-sm">
        <span className="flex items-center gap-1"><img src={vehicleIconUrl("AMBULANCE")} alt="" className="h-4" /> Unit</span>
        <span className="flex items-center gap-1"><img src={incidentIconUrl()} alt="" className="h-4" /> Incident</span>
        <span className="flex items-center gap-1"><img src={hospitalIconUrl()} alt="" className="h-4" /> Hospital</span>
      </div>
    </div>
  );
}
