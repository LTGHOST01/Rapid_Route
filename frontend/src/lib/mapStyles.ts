export const mutedInkMapStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#1c2128" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8b8a84" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#14171c" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#2a3038" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.medical", stylers: [{ visibility: "on" }] },
  { featureType: "poi.medical", elementType: "labels.text.fill", stylers: [{ color: "#c4a574" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a3038" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#14171c" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3d4450" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c0e11" }] },
];

export const ROUTE_PALETTE = ["#C4A574", "#6E8B74", "#8A7A62"] as const;

export function routeColor(index: number, recommended: boolean, blocked: boolean) {
  if (blocked) return "#B42318";
  if (recommended) return "#E8D2A6";
  return ROUTE_PALETTE[index % ROUTE_PALETTE.length];
}
