import type { LatLng } from "./geo";

const MUMBAI_BOUNDS = {
  south: 18.87,
  west: 72.75,
  north: 19.28,
  east: 73.05,
};

export type PickedPlace = LatLng & { label: string };

export function filterCatalog<T extends { label: string; area?: string }>(
  items: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items.slice(0, 8);
  return items
    .filter((item) => `${item.label} ${item.area ?? ""}`.toLowerCase().includes(q))
    .slice(0, 8);
}

export function geocodeAddress(query: string): Promise<PickedPlace | null> {
  if (!window.google?.maps?.Geocoder) return Promise.resolve(null);
  const geocoder = new google.maps.Geocoder();
  return new Promise((resolve) => {
    geocoder.geocode(
      {
        address: query.includes("Mumbai") ? query : `${query}, Mumbai, India`,
        bounds: MUMBAI_BOUNDS,
        componentRestrictions: { country: "in" },
      },
      (results, status) => {
        const hit = results?.[0];
        const loc = hit?.geometry?.location;
        if (status !== "OK" || !loc) {
          resolve(null);
          return;
        }
        resolve({
          label: hit.formatted_address ?? query,
          lat: loc.lat(),
          lng: loc.lng(),
        });
      },
    );
  });
}

export function reverseGeocode(point: LatLng): Promise<string> {
  if (!window.google?.maps?.Geocoder) {
    return Promise.resolve(`${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`);
  }
  const geocoder = new google.maps.Geocoder();
  return new Promise((resolve) => {
    geocoder.geocode({ location: point }, (results, status) => {
      if (status === "OK" && results?.[0]?.formatted_address) {
        resolve(shortAddress(results[0].formatted_address));
        return;
      }
      resolve(`${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`);
    });
  });
}

export function shortAddress(value: string): string {
  return value
    .replace(/, Maharashtra.*$/i, "")
    .replace(/, India$/i, "")
    .trim();
}
