import { useEffect, useMemo } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { decodePolyline, type LatLng } from "../../lib/geo";
import { mutedInkMapStyle, routeColor } from "../../lib/mapStyles";
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
      const line = new google.maps.Polyline({
        map,
        path,
        strokeColor: routeColor(index, recommended, candidate.blocked),
        strokeOpacity: candidate.blocked ? 0.55 : recommended ? 1 : 0.75,
        strokeWeight: recommended ? 7 : 4,
        icons: candidate.blocked
          ? [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 }, offset: "0", repeat: "14px" }]
          : undefined,
        zIndex: recommended ? 4 : 2,
      });
      polylines.push(line);
    });

    roadConditions
      .filter((c) => c.status !== "CLEAR" && c.geometry?.polyline)
      .forEach((condition) => {
        polylines.push(
          new google.maps.Polyline({
            map,
            path: decodePolyline(condition.geometry.polyline!),
            strokeColor: condition.status === "BLOCKED" ? "#B42318" : "#B54708",
            strokeOpacity: 0.35,
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
          label: { text: vehicle.callSign, color: "#b4b1a8", fontSize: "11px", fontFamily: "IBM Plex Sans" },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5,
            fillColor: vehicle.status === "AVAILABLE" ? "#2F6B3C" : "#C4A574",
            fillOpacity: 1,
            strokeColor: "#14171c",
            strokeWeight: 1,
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
          label: { text: "O", color: "#14171c", fontSize: "11px", fontWeight: "700" },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#C4A574",
            fillOpacity: 1,
            strokeColor: "#14171c",
            strokeWeight: 1,
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
          label: { text: "H", color: "#14171c", fontSize: "11px", fontWeight: "700" },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#E8D2A6",
            fillOpacity: 1,
            strokeColor: "#14171c",
            strokeWeight: 1,
          },
        }),
      );
    }
    if (vehiclePosition) {
      markers.push(
        new google.maps.Marker({
          map,
          position: vehiclePosition,
          title: "Dispatched unit",
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 5,
            fillColor: "#E8D2A6",
            fillOpacity: 1,
            strokeColor: "#14171c",
            strokeWeight: 1,
            rotation: 0,
          },
          zIndex: 10,
        }),
      );
    }

    const fit: LatLng[] = [];
    decoded.forEach((d) => fit.push(...d.path));
    if (origin) fit.push(origin);
    if (destination) fit.push(destination);
    vehicles.forEach((v) => fit.push({ lat: v.latitude, lng: v.longitude }));
    if (fit.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      fit.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 64);
    }

    return () => {
      polylines.forEach((line) => line.setMap(null));
      markers.forEach((marker) => marker.setMap(null));
      listeners.forEach((listener) => listener.remove());
    };
  }, [
    map,
    decoded,
    vehicles,
    origin,
    destination,
    selectedId,
    vehiclePosition,
    roadConditions,
    onMapClick,
  ]);

  return null;
}

export function GoogleDispatchMap(props: Props) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY as string;
  const center = props.origin ?? { lat: 19.0178, lng: 72.8478 };

  return (
    <APIProvider apiKey={key}>
      <Map
        defaultCenter={center}
        defaultZoom={12}
        disableDefaultUI
        clickableIcons={false}
        styles={mutedInkMapStyle}
        gestureHandling="greedy"
        mapTypeControl={false}
        fullscreenControl={false}
        streetViewControl={false}
        className="h-full w-full"
      >
        <Overlay {...props} />
      </Map>
    </APIProvider>
  );
}
