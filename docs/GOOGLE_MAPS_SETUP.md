# Google Maps Platform setup

Official references: [Routes API](https://developers.google.com/maps/documentation/routes), [Maps JavaScript API](https://developers.google.com/maps/documentation/javascript), and [API security best practices](https://developers.google.com/maps/api-security-best-practices).

## Correct key architecture

Use **two keys** with different restrictions. A key sent to a browser is visible to users; it is not a secret. A server key is secret and must never enter frontend code, Vite variables, repository history, browser requests, or logs.

| Key | Location | Used for | Restrict it to |
|---|---|---|---|
| Server Routes key | `backend/.env`: `GOOGLE_MAPS_API_KEY` | Express → Routes API `computeRoutes` | API restriction: Routes API only; application restriction suitable for server workload (e.g., server IP if stable). Keep private. |
| Browser Maps key | `frontend/.env`: `VITE_GOOGLE_MAPS_BROWSER_KEY` | Browser loads Maps JavaScript API and map tiles | API restriction: Maps JavaScript API only; HTTP referrer allowlist: localhost during dev plus exact Vercel production domain(s). |

Do not use the browser key to call Routes API. Do not put `GOOGLE_MAPS_API_KEY` in a `VITE_` variable—Vite publishes those values into the bundle.

## Cloud Console checklist

1. Create/select a dedicated Google Cloud project, attach billing, and create a budget plus billing alerts.
2. Enable **Maps JavaScript API** and **Routes API** only. Enable Places API only if autocomplete is intentionally added.
3. Create a server key; restrict application use and restrict API use to Routes API. Store only in backend environment configuration.
4. Create a browser key; restrict it by HTTP referrers and to Maps JavaScript API. Add every deployed host explicitly; avoid broad wildcards.
5. Rotate a suspected or leaked key immediately, inspect Google Cloud metrics/credentials, then replace deployment variables.

## Backend request policy

Express calls `https://routes.googleapis.com/directions/v2:computeRoutes` with the server key in `X-Goog-Api-Key`, a minimal `X-Goog-FieldMask`, `DRIVE`, traffic-aware preference, and `computeAlternativeRoutes: true`. Request only duration, distance, encoded polyline, and the traffic/advisory fields actually used. Google documents Compute Routes as an HTTP POST response shaped by the requested field mask.

## Environment variables

```text
# backend/.env (never committed)
GOOGLE_MAPS_API_KEY=server-routes-key

# frontend/.env (browser-visible, referrer-restricted)
VITE_GOOGLE_MAPS_BROWSER_KEY=browser-maps-js-key
```

Keep production values in Railway/Vercel project settings, not source files. Ensure `.env` is ignored and use `.env.example` with placeholders only.

## Billing and quota precautions

- Set budgets/alerts before public demo access; inspect SKU pricing and quota limits in the Cloud Console.
- Limit API-enabled services per key, set reasonable per-minute quotas, and monitor usage daily during development.
- Debounce route recalculation; cache a completed request briefly by origin/destination/condition version; avoid map reload loops.
- Use field masks; do not use `*` in production. Handle `429`, 5xx, and timeout responses with demo fallback and a visible data-source label.

## Fallback behaviour (implemented)

If `GOOGLE_MAPS_API_KEY` is unset, the request times out, or Routes API returns an error, `googleRoutesService` returns a structured failure. The dispatch/reroute path then loads fixture candidates from `demoFallbackService` and persists `provider=DEMO`, `providerStatus=FALLBACK`. The API and UI label this **DEMO SIMULATION** and never call it live Google traffic.

If `VITE_GOOGLE_MAPS_BROWSER_KEY` is unset, the dispatcher map renders a schematic projection of the same encoded polylines, also labelled **DEMO SIMULATION**. With a referrer-restricted browser key, `@vis.gl/react-google-maps` draws those polylines on the real Maps JavaScript base map.
