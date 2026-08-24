import { describe, expect, it } from "vitest";
import {
  blockedSliceEncodedPolyline,
  encodePolyline,
  routeOverlapsBlocked,
} from "../src/lib/geo";

const sharedOrigin = { lat: 19.0178, lng: 72.8478 };
const sharedDest = { lat: 19.0022, lng: 72.8416 };

const routeA = encodePolyline([
  sharedOrigin,
  { lat: 19.014, lng: 72.846 },
  { lat: 19.01, lng: 72.844 },
  { lat: 19.006, lng: 72.843 },
  { lat: 19.004, lng: 72.842 },
  sharedDest,
]);

const routeB = encodePolyline([
  sharedOrigin,
  { lat: 19.016, lng: 72.854 },
  { lat: 19.012, lng: 72.858 },
  { lat: 19.008, lng: 72.852 },
  { lat: 19.004, lng: 72.846 },
  sharedDest,
]);

describe("live blockage geometry", () => {
  it("marks the selected route as overlapping its own mid-corridor slice", () => {
    const slice = blockedSliceEncodedPolyline(routeA, 0);
    expect(routeOverlapsBlocked(routeA, slice)).toBe(true);
  });

  it("does not mark a diverging alternative as blocked", () => {
    const slice = blockedSliceEncodedPolyline(routeA, 0);
    expect(routeOverlapsBlocked(routeB, slice)).toBe(false);
  });
});
