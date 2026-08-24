# RapidRoute

**RIH-PS-011 — Intelligent Emergency Vehicle Route Management.** RapidRoute is an emergency dispatch and route-decision layer built on Google Maps Platform. Google supplies real roads, route geometry, ETA, traffic-aware candidate routes; RapidRoute selects an available vehicle, applies emergency and road-condition policy, explains the recommendation, dispatches the mission, and reroutes when conditions change.

## Problem

Dispatchers need more than a consumer navigation suggestion: they need an accountable choice of vehicle and route, a record of why it was chosen, and a way to react when a corridor becomes unsafe or blocked.

## Solution and features

- Dispatcher creates an incident; system recommends a suitable available vehicle.
- Backend requests Google Routes API alternatives, then RapidRoute scores them.
- Blocked corridors are excluded; congestion and road reports affect the score.
- Map compares candidates, displays the recommended route and decision factors.
- A simulated vehicle journey, condition updates, route-event timeline, and dynamic reroute make the decision visible.
- Admin manages vehicles and road conditions; demo mode preserves the judging flow if a provider call fails.

## Architecture

`React/Vite dashboard → Express API → PostgreSQL/Prisma`

`Express API → Google Routes API (server key)`

`React map → Maps JavaScript API (browser-restricted key)`

See [Architecture](docs/ARCHITECTURE.md), [routing algorithm](docs/ROUTING_ALGORITHM.md), and [Google Maps setup](docs/GOOGLE_MAPS_SETUP.md).

## Tech stack

React, Vite, TypeScript, Tailwind CSS, Framer Motion; Node.js, Express, TypeScript; PostgreSQL, Prisma; JWT; Google Maps JavaScript API and Google Routes API. Socket.IO is optional only if live multi-user updates are implemented; polling is enough for the demo.

## Screenshots

Add genuine product screenshots before submission:

- `docs/screenshots/dispatcher-dashboard.png`
- `docs/screenshots/route-comparison.png`
- `docs/screenshots/reroute-timeline.png`

## Demo flow

Create a critical emergency → choose suggested ambulance → compare Google candidates → dispatch recommended route → simulate congestion/blockage → show automatic reroute and changed ETA. Full script: [DEMO_FLOW.md](docs/DEMO_FLOW.md).

## Local setup

Requires Node 20+ and PostgreSQL 16.

```bash
# 1. Create the database
sudo pg_ctlcluster 16 main start   # if PostgreSQL is not running
# create user/database if needed:
#   createuser rapidroute && createdb -O rapidroute rapidroute

# 2. Backend
cp .env.example /tmp/rr.env.example   # reference only
# write backend/.env from the backend block in .env.example
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev                           # http://localhost:4000/health

# 3. Frontend (second terminal)
# write frontend/.env from the frontend block in .env.example
cd frontend
npm install
npm run dev                           # http://localhost:5173
```

Seed accounts (local/demo only):

| Role | Email | Password |
|---|---|---|
| Dispatcher | `dispatcher@rapidroute.local` | `RapidRoute!dispatch` |
| Admin | `admin@rapidroute.local` | `RapidRoute!admin` |

Without Google keys the API and map run in labelled **DEMO SIMULATION**. Add `GOOGLE_MAPS_API_KEY` (server, Routes API only) and `VITE_GOOGLE_MAPS_BROWSER_KEY` (browser, Maps JavaScript API + HTTP referrers) to use live roads. The frontend never calls Google Routes.

Deterministic demo: **Dadar → KEM Hospital**. Load the Mumbai demo, assign the nearest Dadar ambulance, calculate routes, start the journey, then **Block road** on **Sion–Parel link**. Route A becomes ineligible and RapidRoute adopts Route B.

## Mandatory evaluator input

CSV/JSON records must use exactly these columns:

`vehicle_id, vehicle_type, emergency_type, current_location, destination, latitude, longitude, traffic_level, road_status, road_distance, estimated_travel_time, timestamp`

- Schema: `backend/data/eval-input.schema.json`
- Sample CSV: `backend/data/eval-scenarios.csv`
- `GET /api/eval/schema`
- `GET /api/eval/scenarios` — the four required resilience cases
- `POST /api/eval/ingest` — authenticated JSON `{ "records": [...] }` or `{ "csv": "..." }`

| Scenario | Expected result |
|---|---|
| Low-traffic route | Selects the suitable faster/lighter-traffic candidate |
| Heavy traffic | Leaves the congested primary and recommends a clearer alternative |
| Road blockage | Marks the blocked candidate ineligible and keeps an open alternative |
| Destination unreachable | Returns **No suitable route available** — destination cannot currently be reached |

Detailed implementation and deployment steps are in [CODEX_IMPLEMENTATION_PLAN.md](docs/CODEX_IMPLEMENTATION_PLAN.md) and [DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Security

Never commit `.env`, API keys, database passwords, or JWT secrets. Keep the Routes API key server-only and restrict it to the Routes API. The browser map key is separate, referrer-restricted, and limited to Maps JavaScript API.

## Future scope

Real fleet GPS, authenticated road reports, dispatch integrations, notification delivery, and audited analytics belong after the hackathon—not fake routing infrastructure, ML prediction, or IoT claims.

## Suggested commits

1. `chore: initialize RapidRoute full-stack architecture`
2. `feat: implement emergency routing and dispatch`
3. `feat: add dynamic rerouting and road simulation`
4. `docs: add setup and deployment documentation`
