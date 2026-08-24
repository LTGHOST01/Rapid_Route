export type CatalogPlace = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  kind: "origin" | "hospital";
};

export const MUMBAI_ORIGINS: CatalogPlace[] = [
  { id: "dadar", label: "Dadar", lat: 19.0178, lng: 72.8478, kind: "origin" },
  { id: "sion", label: "Sion", lat: 19.043, lng: 72.863, kind: "origin" },
  { id: "kurla", label: "Kurla", lat: 19.0726, lng: 72.8845, kind: "origin" },
  { id: "mumbai_central", label: "Mumbai Central", lat: 18.9696, lng: 72.8193, kind: "origin" },
];

export const MUMBAI_HOSPITALS: CatalogPlace[] = [
  { id: "kem", label: "KEM Hospital, Parel", lat: 19.0022, lng: 72.8416, kind: "hospital" },
  { id: "sion_hospital", label: "Sion Hospital (LTMMC)", lat: 19.0368, lng: 72.86, kind: "hospital" },
  { id: "jj", label: "JJ Hospital, Byculla", lat: 18.9633, lng: 72.8331, kind: "hospital" },
];

export const DEMO_CORRIDORS = [
  {
    id: "SION_LINK",
    label: "Sion–Parel link",
    role: "primary",
    note: "Tagged onto demo Route A. Blocking this corridor is the deterministic reroute demo.",
  },
  { id: "PAREL_INLAND", label: "Parel inland", role: "alternate" },
  { id: "EASTERN_CONNECTOR", label: "Eastern connector", role: "alternate" },
] as const;

export const DETERMINISTIC_DEMO = {
  origin: MUMBAI_ORIGINS[0],
  destination: MUMBAI_HOSPITALS[0],
  priority: "CRITICAL" as const,
  incidentType: "TRAUMA" as const,
  notes: "Multi-vehicle collision at Dadar. Two critical patients for KEM.",
  blockCorridorId: "SION_LINK",
};
