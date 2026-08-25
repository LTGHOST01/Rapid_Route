export type CatalogPlace = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  kind: "origin" | "hospital" | "fire";
  area?: string;
  facilityType?: string;
};

export const MUMBAI_ORIGINS: CatalogPlace[] = [
  { id: "dadar", label: "Dadar", lat: 19.0178, lng: 72.8478, kind: "origin" },
  { id: "bandra_west", label: "Bandra West", lat: 19.0596, lng: 72.8295, kind: "origin" },
  { id: "bandra_east", label: "Bandra East", lat: 19.0607, lng: 72.8489, kind: "origin" },
  { id: "sion", label: "Sion", lat: 19.043, lng: 72.863, kind: "origin" },
  { id: "kurla", label: "Kurla", lat: 19.0726, lng: 72.8845, kind: "origin" },
  { id: "mumbai_central", label: "Mumbai Central", lat: 18.9696, lng: 72.8193, kind: "origin" },
  { id: "worli", label: "Worli", lat: 19.0176, lng: 72.8172, kind: "origin" },
  { id: "lower_parel", label: "Lower Parel", lat: 18.9935, lng: 72.8305, kind: "origin" },
  { id: "parel", label: "Parel", lat: 19.003, lng: 72.842, kind: "origin" },
  { id: "prabhadevi", label: "Prabhadevi", lat: 19.0166, lng: 72.8289, kind: "origin" },
  { id: "mahim", label: "Mahim", lat: 19.041, lng: 72.84, kind: "origin" },
  { id: "wadala", label: "Wadala", lat: 19.0144, lng: 72.8631, kind: "origin" },
  { id: "chembur", label: "Chembur", lat: 19.0522, lng: 72.8994, kind: "origin" },
  { id: "powai", label: "Powai", lat: 19.1197, lng: 72.905, kind: "origin" },
  { id: "andheri", label: "Andheri", lat: 19.1197, lng: 72.8468, kind: "origin" },
  { id: "juhu", label: "Juhu", lat: 19.1075, lng: 72.8263, kind: "origin" },
  { id: "santacruz", label: "Santacruz", lat: 19.081, lng: 72.841, kind: "origin" },
  { id: "vile_parle", label: "Vile Parle", lat: 19.099, lng: 72.844, kind: "origin" },
  { id: "goregaon", label: "Goregaon", lat: 19.1663, lng: 72.8526, kind: "origin" },
  { id: "byculla", label: "Byculla", lat: 18.9766, lng: 72.8328, kind: "origin" },
  { id: "colaba", label: "Colaba", lat: 18.9067, lng: 72.8147, kind: "origin" },
  { id: "nariman_point", label: "Nariman Point", lat: 18.9256, lng: 72.8242, kind: "origin" },
  { id: "csmt", label: "CSMT", lat: 18.9402, lng: 72.8353, kind: "origin" },
];

export const MUMBAI_HOSPITALS: CatalogPlace[] = [
  {
    id: "holy_family",
    label: "Holy Family Hospital",
    lat: 19.0548,
    lng: 72.8278,
    kind: "hospital",
    area: "Bandra West",
    facilityType: "Multispecialty hospital",
  },
  {
    id: "lilavati",
    label: "Lilavati Hospital",
    lat: 19.0514,
    lng: 72.8292,
    kind: "hospital",
    area: "Bandra West",
    facilityType: "Multispecialty hospital",
  },
  {
    id: "asian_heart",
    label: "Asian Heart Institute, BKC",
    lat: 19.0655,
    lng: 72.8694,
    kind: "hospital",
    area: "Bandra East",
    facilityType: "Cardiac hospital",
  },
  {
    id: "bhabha",
    label: "Bhabha Hospital",
    lat: 19.0602,
    lng: 72.832,
    kind: "hospital",
    area: "Bandra West",
    facilityType: "Municipal general hospital",
  },
  {
    id: "kem",
    label: "KEM Hospital",
    lat: 19.0022,
    lng: 72.8416,
    kind: "hospital",
    area: "Parel",
    facilityType: "Tertiary public hospital",
  },
  {
    id: "sion_hospital",
    label: "Sion Hospital (LTMMC)",
    lat: 19.0368,
    lng: 72.86,
    kind: "hospital",
    area: "Sion",
    facilityType: "Tertiary public hospital",
  },
  {
    id: "jj",
    label: "JJ Hospital",
    lat: 18.9633,
    lng: 72.8331,
    kind: "hospital",
    area: "Byculla",
    facilityType: "Tertiary public hospital",
  },
  {
    id: "tata_memorial",
    label: "Tata Memorial Hospital",
    lat: 19.0048,
    lng: 72.8431,
    kind: "hospital",
    area: "Parel",
    facilityType: "Cancer hospital",
  },
  {
    id: "hinduja",
    label: "P.D. Hinduja Hospital",
    lat: 19.033,
    lng: 72.8385,
    kind: "hospital",
    area: "Mahim",
    facilityType: "Multispecialty hospital",
  },
  {
    id: "nanavati",
    label: "Nanavati Max Hospital",
    lat: 19.096,
    lng: 72.84,
    kind: "hospital",
    area: "Vile Parle",
    facilityType: "Multispecialty hospital",
  },
  {
    id: "cooper",
    label: "Cooper Hospital",
    lat: 19.1076,
    lng: 72.836,
    kind: "hospital",
    area: "Juhu",
    facilityType: "Municipal general hospital",
  },
  {
    id: "breach_candy",
    label: "Breach Candy Hospital",
    lat: 18.9726,
    lng: 72.8045,
    kind: "hospital",
    area: "Breach Candy",
    facilityType: "Multispecialty hospital",
  },
  {
    id: "bombay_hospital",
    label: "Bombay Hospital",
    lat: 18.941,
    lng: 72.828,
    kind: "hospital",
    area: "Marine Lines",
    facilityType: "Multispecialty hospital",
  },
];

export const MUMBAI_FIRE_SCENES: CatalogPlace[] = [
  {
    id: "phoenix_parel",
    label: "Phoenix Palladium, Lower Parel",
    lat: 18.9944,
    lng: 72.825,
    kind: "fire",
    area: "Lower Parel",
    facilityType: "Mall fire",
  },
  {
    id: "wadala_tt",
    label: "Wadala Truck Terminal godown",
    lat: 19.0168,
    lng: 72.8755,
    kind: "fire",
    area: "Wadala",
    facilityType: "Warehouse fire",
  },
  {
    id: "crawford_market",
    label: "Crawford Market",
    lat: 18.9478,
    lng: 72.8342,
    kind: "fire",
    area: "Fort",
    facilityType: "Market fire",
  },
  {
    id: "byculla_market",
    label: "Byculla Market",
    lat: 18.9752,
    lng: 72.8335,
    kind: "fire",
    area: "Byculla",
    facilityType: "Market fire",
  },
  {
    id: "worli_highrise",
    label: "Worli high-rise, Dr Annie Besant Rd",
    lat: 19.0116,
    lng: 72.818,
    kind: "fire",
    area: "Worli",
    facilityType: "Building fire",
  },
  {
    id: "andheri_midc",
    label: "Andheri MIDC industrial shed",
    lat: 19.1176,
    lng: 72.8695,
    kind: "fire",
    area: "Andheri East",
    facilityType: "Industrial fire",
  },
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
  origin: { ...MUMBAI_ORIGINS[0], label: "Dadar TT flyover" },
  destination: MUMBAI_HOSPITALS.find((h) => h.id === "kem")!,
  priority: "CRITICAL" as const,
  incidentType: "TRAUMA" as const,
  notes: "Two-wheeler vs BEST bus at Dadar TT. Patient to KEM trauma.",
  blockCorridorId: "SION_LINK",
};

export const FIRE_DEMO = {
  origin: MUMBAI_FIRE_SCENES.find((s) => s.id === "phoenix_parel")!,
  destination: {
    ...MUMBAI_FIRE_SCENES.find((s) => s.id === "phoenix_parel")!,
    label: "Fire scene",
  },
  priority: "CRITICAL" as const,
  incidentType: "FIRE" as const,
  notes: "Mall fire at Phoenix Palladium.",
};
