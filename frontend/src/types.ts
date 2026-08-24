export type Role = "ADMIN" | "DISPATCHER";
export type Priority = "CRITICAL" | "HIGH" | "STANDARD";
export type EmergencyStatus = "OPEN" | "ASSIGNED" | "DISPATCHED" | "COMPLETED" | "CANCELLED";
export type VehicleStatus = "AVAILABLE" | "ASSIGNED" | "INACTIVE";
export type VehicleType = "AMBULANCE" | "FIRE" | "POLICE";
export type RoadStatus = "CLEAR" | "ADVISORY" | "CONGESTED" | "BLOCKED";
export type TrafficLevel = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
export type JourneyStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Vehicle = {
  id: string;
  callSign: string;
  type: VehicleType;
  latitude: number;
  longitude: number;
  locationLabel: string;
  status: VehicleStatus;
  capabilities: Record<string, unknown>;
  assignedEmergencyId: string | null;
  distanceMeters?: number;
};

export type Emergency = {
  id: string;
  code: string;
  priority: Priority;
  status: EmergencyStatus;
  originLabel: string;
  originLat: number;
  originLng: number;
  destinationLabel: string;
  destinationLat: number;
  destinationLng: number;
  notes: string;
  createdAt: string;
  vehicle: Vehicle | null;
};

export type Candidate = {
  id: string;
  label: string;
  polyline: string;
  etaSeconds: number;
  etaLabel: string;
  distanceMeters: number;
  distanceLabel: string;
  trafficLevel: TrafficLevel;
  roadImpact: RoadStatus;
  blocked: boolean;
  score: number | null;
  corridorIds: string[];
  breakdown: {
    etaPenalty: number;
    distancePenalty: number;
    trafficPenalty: number;
    roadPenalty: number;
    score: number | null;
    eligible: boolean;
    ineligibilityReason: string | null;
  } | null;
};

export type Explanation = {
  weights: { eta: number; distance: number; traffic: number; road: number };
  winnerLabel: string | null;
  summary: string;
  factors: string[];
  excluded: Array<{ label: string; reason: string }>;
  components: {
    etaPenalty: number;
    distancePenalty: number;
    trafficPenalty: number;
    roadPenalty: number;
    score: number;
  } | null;
};

export type RouteRequest = {
  id: string;
  emergencyId: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  originLabel: string;
  destinationLabel: string;
  provider: "GOOGLE" | "DEMO";
  providerStatus: "OK" | "FALLBACK" | "ERROR";
  providerMessage: string | null;
  dataSourceLabel: string;
  candidates: Candidate[];
  selection: {
    id: string;
    candidateId: string;
    selectedBy: "ENGINE" | "DISPATCHER";
    reason: Explanation | Record<string, unknown>;
    version: number;
    candidate: Candidate | null;
  } | null;
};

export type Journey = {
  id: string;
  emergencyId: string;
  vehicleId: string;
  selectionId: string;
  status: JourneyStatus;
  startedAt: string;
  estimatedArrivalAt: string;
  lastLat: number;
  lastLng: number;
  progress: number;
};

export type RouteEvent = {
  id: string;
  journeyId: string;
  type: string;
  occurredAt: string;
  payload: Record<string, unknown>;
};

export type RoadCondition = {
  id: string;
  title: string;
  status: RoadStatus;
  corridorId: string;
  geometry: {
    polyline?: string;
    points?: Array<{ lat: number; lng: number }>;
    label?: string;
  };
  simulated: boolean;
  activeFrom: string;
  activeUntil: string | null;
};

export type Health = {
  ok: boolean;
  database: "up" | "down";
  googleRoutesConfigured: boolean;
  dataSource: string;
};

export type JourneyDetail = {
  journey: Journey;
  emergency: {
    id: string;
    code: string;
    priority: Priority;
    status: EmergencyStatus;
    originLabel: string;
    originLat: number;
    originLng: number;
    destinationLabel: string;
    destinationLat: number;
    destinationLng: number;
  };
  vehicle: { id: string; callSign: string; type: VehicleType };
  routeRequest: RouteRequest;
  events: RouteEvent[];
};

export type RerouteResult = {
  adopted: boolean;
  reason: string;
  explanation: Explanation;
  currentBlocked?: boolean;
  previousEtaSeconds?: number;
  newEtaSeconds?: number;
  request: RouteRequest;
  journey: JourneyDetail;
};
