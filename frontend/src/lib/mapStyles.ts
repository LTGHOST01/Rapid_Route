/** Light basemap, fewer POI labels. Not a dark theme. */
export const LIGHT_DISPATCH_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.attraction", stylers: [{ visibility: "off" }] },
  { featureType: "poi.place_of_worship", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
];

export function routeColor(_index: number, recommended: boolean, blocked: boolean) {
  if (blocked) return "#D93025";
  if (recommended) return "#1A73E8";
  return "#9AA0A6";
}

export function midpoint<T>(points: T[]): T | null {
  if (points.length === 0) return null;
  return points[Math.floor(points.length * 0.45)];
}
