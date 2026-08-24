# Architecture

## Product boundary

RapidRoute is a **dispatch decision system**, not a maps provider. Google Maps Platform owns the road network, driving routes, route geometry, distance, ETA, and traffic-aware route generation. RapidRoute owns operational state: incidents, vehicle availability, local road reports, policy scoring, selection explanation, journey state, reroute history, and fallback demo data.

## Practical stack

| Layer | Choice | Responsibility |
|---|---|---|
| Frontend | React + Vite + TypeScript + Tailwind + Framer Motion | Responsive dispatcher/admin interface, map rendering, safe interaction states |
| API | Node.js + Express + TypeScript | JWT auth, validation, policy orchestration, Google server calls |
| Data | PostgreSQL + Prisma | Dispatch and audit records |
| Maps | Maps JavaScript API | Base map, markers, route polylines |
| Routing | Google Routes API | Traffic-aware route alternatives, ETA, geometry, distance |

## Request flow

1. Dispatcher records emergency origin, destination, priority, and notes.
2. API finds available compatible vehicles, ranks by simple proximity/availability policy, and dispatcher confirms one.
3. API calls Google `computeRoutes` with `DRIVE`, traffic awareness, alternative routes, and a minimal field mask.
4. API matches active local road conditions to candidate geometry (initial demo: manually associated corridor/route segment; document this limitation).
5. Scoring service rejects blocked candidates, ranks remaining candidates, saves request/candidates/selection, and returns an explanation.
6. Frontend shows the map and comparison cards. Dispatch starts a Journey.
7. A simulated condition change or movement tick creates RouteEvents. If it materially affects the selected route, API requests fresh Google candidates and selects again.

## Services

- `authService`: bcrypt password verification, JWT issue/verify, role checks.
- `vehicleService`: available/assigned/inactive state and candidate vehicle query.
- `googleRoutesService`: server-side HTTP client; timeout, field mask, error normalization.
- `roadConditionService`: active local reports and candidate impact tagging.
- `routeScoringService`: pure, unit-tested score and explanation generator.
- `journeyService`: start/pause/complete, deterministic simulation ticks, reroute trigger.
- `demoFallbackService`: fixture candidates and clearly labelled simulated traffic if Google is unavailable.

## Database model overview

| Model | Key fields / relationships | Purpose |
|---|---|---|
| User | id, name, email unique, passwordHash, role, timestamps | Dispatcher/admin identity |
| EmergencyVehicle | id, callSign unique, type, lat/lng, status, capabilities JSON, assignedEmergencyId nullable | Fleet readiness and assignment |
| Emergency | id, code unique, priority, status, origin/destination labels + coordinates, notes, createdById | Incident lifecycle; belongs to creator and optional vehicle |
| RoadCondition | id, title, severity, status (`CLEAR/CONGESTED/BLOCKED`), geometry/corridor JSON, activeFrom/Until, reportedById | Local operational road report—not Google road data |
| RouteRequest | id, emergencyId, origin/destination snapshot, provider, providerStatus, requestedAt | One provider routing attempt |
| RouteCandidate | id, requestId, providerRouteIndex, polyline, etaSeconds, distanceMeters, trafficLevel, roadImpact, blocked, score nullable | Immutable candidate snapshot |
| RouteSelection | id, requestId, candidateId, selectedBy (`ENGINE/DISPATCHER`), reason JSON, version | Explainable decision; one current selection per request |
| Journey | id, emergencyId unique, vehicleId, selectionId, status, startedAt, estimatedArrivalAt, lastLat/lng, progress | Active dispatched trip |
| RouteEvent | id, journeyId, type, occurredAt, payload JSON | Timeline: dispatched, position, condition change, reroute, arrived |

Use UUID IDs, UTC timestamps, Prisma enums, `Decimal`/numeric latitude and longitude, and indexes on emergency status/createdAt, vehicle status, road-condition active/status, and journey status. Keep provider responses trimmed to fields needed for audit rather than storing unrestricted raw payloads.

## API surface

All application routes are mounted under `/api`. `/health` is also exposed at the server root for Railway.

`POST /api/auth/login`; `GET /api/auth/me`

`GET/POST /api/emergencies`; `GET /api/emergencies/:id`; `POST /api/emergencies/:id/assign-vehicle`; `POST /api/emergencies/:id/routes`; `POST /api/emergencies/:id/select-route`; `POST /api/emergencies/:id/dispatch`

`GET/POST/PATCH /api/vehicles`; `GET/POST/PATCH /api/road-conditions`

`GET /api/journeys/:id`; `POST /api/journeys/:id/tick`; `POST /api/journeys/:id/reroute`; `GET /api/journeys/:id/events`

`POST /api/demo/road-scenario` — labelled DEMO SIMULATION (CLEAR / CONGESTED / BLOCKED). Updates a corridor report and evaluates reroute for the active journey.

`GET /api/logs/route-requests`; `GET /api/logs/emergencies`; `GET /api/logs/journeys`; `GET /api/admin/stats`

`GET /health` and `GET /api/health`

Validate bodies with Zod, authorize every protected endpoint, and return only public DTOs (never password hashes, secrets, or raw provider headers). Vehicle and road-condition writes are admin-only. Dispatchers can run the demo scenario so the judging flow stays on one screen.

## Implementation notes

- Route calculation origin is the assigned vehicle’s current coordinates (emergency origin if no vehicle is assigned). Destination is the incident hospital.
- Google Routes is requested with `DRIVE`, `TRAFFIC_AWARE`, `computeAlternativeRoutes: true`, and a minimal field mask. Failures (missing key, timeout, 429, 5xx) fall through to fixture candidates labelled **DEMO SIMULATION**.
- Road-to-route matching uses the candidate’s corridor IDs and, when geometry is present, a proximity check against the encoded polyline. This is simulated local-condition input, not a municipal feed.
- JWT is returned to the client and sent as `Authorization: Bearer`. Cookies are not used.
