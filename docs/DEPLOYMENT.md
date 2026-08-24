# Deployment

One public GitHub repository:

```text
rapidroute/
├── frontend/
├── backend/
├── docs/
├── README.md
├── .env.example
└── .gitignore
```

## Railway: backend and PostgreSQL

1. Create a Railway project from the GitHub repository; add a PostgreSQL service.
2. Create a backend service with root directory `backend/`. Railway provides/injects a database connection string; set `DATABASE_URL` to it.
3. Set `JWT_SECRET`, `GOOGLE_MAPS_API_KEY`, `CORS_ORIGIN=https://<vercel-domain>`, and `NODE_ENV=production` in Railway Variables. Never set frontend `VITE_` values here.
4. Build: `npm ci && npx prisma generate && npm run build`. Start: `npx prisma migrate deploy && npm run start` (or run migrations as a release/deploy command if configured separately).
5. Expose Railway’s HTTPS public backend URL and check `/health`.

## Vercel: frontend

1. Import the same repository into Vercel; set Root Directory to `frontend/`.
2. Build command: `npm run build`; output directory: `dist` (Vite default).
3. Set `VITE_API_BASE_URL=https://<railway-backend>/api` and `VITE_GOOGLE_MAPS_BROWSER_KEY=<restricted-browser-key>` in Vercel environment variables.
4. Deploy, then add the exact Vercel production domain (and preview domains only if needed) to the browser key’s HTTP-referrer allowlist.

## Production wiring

- CORS: backend allows the exact Vercel frontend origin; do not use `*` with credentialed auth.
- Cookies are unnecessary for this MVP: return JWT to the client and use an authorization header. If cookies are later used, configure `Secure`, `HttpOnly`, `SameSite`, and cross-origin credentials deliberately.
- Frontend never calls Google Routes. Browser uses only the referrer-restricted Maps JavaScript key.
- Run `prisma migrate deploy` against Railway PostgreSQL; seed only non-sensitive demo users/vehicles/conditions.
- Test login, route calculation, demo fallback, reroute, and browser console/network requests after deployment.

## Pre-demo checklist

Confirm database migration, CORS origin, production map referrer restriction, Routes API restriction, budget alert, `/health`, and the fallback scenario. Keep real secrets exclusively in Railway/Vercel configuration.

After `prisma migrate deploy`, run `npx prisma db seed` once so the demo dispatcher/admin users and Mumbai vehicles exist. Change those passwords before any shared deployment.

Railway start command (also in `backend/railway.toml`):

`npx prisma migrate deploy && npm run start`

Vercel root directory: `frontend/`. Output: `dist`. SPA fallback is in `frontend/vercel.json`.
