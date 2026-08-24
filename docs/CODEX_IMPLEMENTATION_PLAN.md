# Codex implementation plan

Build a documentation-driven MVP, not a fake maps engine. Repository root contains `frontend/`, `backend/`, `docs/`, root `.env.example`, and `.gitignore`.

## Phase 1 — scaffold and foundations

- Create React/Vite/TypeScript frontend with Tailwind and Framer Motion; create Express/TypeScript backend.
- Install frontend: React Router, TanStack Query, Google Maps loader. Backend: Express, Prisma, pg, bcrypt, jsonwebtoken, Zod, dotenv, cors. Add Socket.IO only after polling works.
- Configure linting, error handler, request logging with secrets redacted, health endpoint, environment validation.

## Phase 2 — data and authentication

- Implement the nine models in [ARCHITECTURE.md](ARCHITECTURE.md): User, EmergencyVehicle, Emergency, RoadCondition, RouteRequest, RouteCandidate, RouteSelection, Journey, RouteEvent.
- Add Prisma migration and seed: one admin, one dispatcher, 3–5 vehicles, fixed Mumbai/target-city demo conditions.
- Implement login, password hashing, JWT middleware, roles (`ADMIN`, `DISPATCHER`) and protected API routes.

## Phase 3 — dispatch and Google integration

- Build emergency creation and vehicle availability/assignment endpoints/UI.
- Implement `googleRoutesService` server-side only. Request traffic-aware driving alternatives with a minimal field mask. Return normalized candidates, never secret headers/keys.
- Implement pure `routeScoringService` exactly as [ROUTING_ALGORITHM.md](ROUTING_ALGORITHM.md), including hard blocked exclusion, weights, explanation object, and persistence.
- Render Google map with candidate polylines/markers; compare route cards and clearly mark recommended/ineligible.

## Phase 4 — journey and dynamic rerouting

- Start Journey from selected route. Simulate location by interpolating decoded selected-polyline points on a timer; persist meaningful milestones/events, not every animation frame.
- Admin changes a road condition or runs a preset incident. Detect its tagged/intersecting candidate impact, fetch fresh candidates from current location, re-score, apply threshold, update ETA and timeline.
- Add clearly labelled demo fallback fixture candidates when Routes API is unreachable/rate-limited. Never label demo data as live Google traffic.

## Phase 5 — polish, tests, deploy

- Build dashboard, logs, admin views, loading/empty/error states, and responsive UX from [GROK_FRONTEND_BRIEF.md](GROK_FRONTEND_BRIEF.md).
- Unit-test normalization/scoring/block rules/reroute threshold; integration-test auth and route endpoints with mocked Google client; manual browser test the end-to-end demo.
- Use [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel/Railway. Add screenshots and execute the demo script.

## Definition of done

One dispatcher can authenticate, create an emergency, assign an available vehicle, see real Google candidates when configured, understand the recommendation, dispatch, trigger a simulated blockage, watch an eligible reroute/ETA update, and inspect the persisted event history. No secrets are committed.
