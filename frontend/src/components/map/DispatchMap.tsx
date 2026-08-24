import type { ReactNode } from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import type { LatLng } from "../../lib/geo";
import type { Candidate, RoadCondition, Vehicle } from "../../types";
import type { HospitalPlace } from "../../lib/geo";
import { FallbackMap } from "./FallbackMap";
import { GoogleDispatchMap } from "./GoogleDispatchMap";

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
  pinMode?: "origin" | "destination" | null;
};

export function hasBrowserMapsKey() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
  return Boolean(key && key.length > 8 && !key.includes("BROWSER_KEY"));
}

export function MapsApiGate({ children }: { children: ReactNode }) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
  if (!hasBrowserMapsKey() || !key) return children;
  return (
    <APIProvider apiKey={key} region="IN" language="en">
      {children}
    </APIProvider>
  );
}

export function DispatchMap(props: Props) {
  if (hasBrowserMapsKey()) {
    return <GoogleDispatchMap {...props} />;
  }
  return <FallbackMap {...props} />;
}
