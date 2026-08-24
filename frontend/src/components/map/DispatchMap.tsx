import type { LatLng } from "../../lib/geo";
import type { Candidate, RoadCondition, Vehicle } from "../../types";
import { FallbackMap } from "./FallbackMap";
import { GoogleDispatchMap } from "./GoogleDispatchMap";

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

export function DispatchMap(props: Props) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY as string | undefined;
  if (key && key.length > 8 && !key.includes("BROWSER_KEY")) {
    return <GoogleDispatchMap {...props} />;
  }
  return <FallbackMap {...props} />;
}
