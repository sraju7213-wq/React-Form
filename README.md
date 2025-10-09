# Valley Wedding Cars Booking Platform

A Netlify-ready booking experience with live pricing powered by Supabase and Netlify Functions. The project ships a secure React admin console for managing the car catalogue and price rules alongside a rich public enquiry form with live estimates.

## Features

- Dynamic vehicle catalogue backed by Supabase Postgres
- Netlify Functions for public reads, secured CRUD, and live price estimation
- React-based `/admin` dashboard secured by a bearer token (or Netlify Identity)
- Shared TypeScript pricing utilities consumed by both the frontend and serverless functions
- Tailwind-powered styling shared between the public form and the admin experience

## Getting Started

### 1. Provision the database

1. Create a Supabase project.
2. Run [`sql/schema.sql`](sql/schema.sql) followed by [`sql/sample-data.sql`](sql/sample-data.sql) (optional seed data) in the Supabase SQL editor.

### 2. Configure environment variables

Set the following variables in Netlify (Site settings → Build & deploy → Environment) or a local `.env` used by `netlify dev`:

- `SUPABASE_URL` – your Supabase project URL
- `SUPABASE_SERVICE_ROLE` – the service role key (used only within serverless functions)
- `ADMIN_API_TOKEN` – long random string required by admin endpoints and dashboard
- *(Optional)* `IDENTITY_JWKS_URL` – Netlify Identity JWKS endpoint if you wire JWT auth

### 3. Install dependencies

```bash
npm install
```

### 4. Run locally

```bash
npm run dev
```

`netlify dev` proxies function calls under `/api/*` and serves the Vite frontend/admin bundle.

### 5. Build & deploy

```bash
npm run build
```

Outputs static assets to `dist/` ready for Netlify deployment. Deploy via Git push or `netlify deploy` and confirm:

- `/api/cars` responds with your catalogue
- `/admin` loads, accepts your admin token, and performs CRUD successfully
- The public form fetches vehicles and produces live price estimates

## API Endpoints

All functions are exposed under `/api/*` thanks to redirects in `netlify.toml`.

### Public

- `GET /api/cars` – List active cars
- `GET /api/price-rules` – List active price rules
- `POST /api/price-estimate` – Calculate an estimate given `{ carId, kms?, scope, dateISO? }`

### Admin (Bearer token or Netlify Identity required)

- `POST /api/cars-admin` – Create a car
- `PUT /api/cars-admin` – Update a car
- `DELETE /api/cars-admin` – Soft-delete (sets `active=false`)
- `POST /api/price-rules-admin` – Create a rule
- `PUT /api/price-rules-admin` – Update a rule
- `DELETE /api/price-rules-admin` – Soft-delete a rule

Include the header `Authorization: Bearer <ADMIN_API_TOKEN>` (or a valid Netlify Identity JWT if configured).

## Admin Dashboard

- Navigate to `/admin` after build/deploy
- Paste your admin token (stored securely in Netlify env vars)
- Manage cars and price rules with instant feedback; deactivating removes them from public lists

## Folder Overview

```
/
  netlify.toml
  package.json
  sql/                  # Database schema and optional seed data
  src/
    admin/              # React admin application
    public/             # Public booking form entry point
    shared/             # Shared types & pricing helpers
  netlify/functions/    # Netlify Functions (TypeScript)
```

## Testing Authentication Locally

1. Start Netlify Dev.
2. Use an HTTP client (curl, Postman, etc.) with header `Authorization: Bearer <ADMIN_API_TOKEN>` when calling `/api/cars-admin` or `/api/price-rules-admin`.

## Notes

- CORS headers are included in functions to allow usage from the Netlify-hosted frontend.
- The `/admin` application stores the provided token in `localStorage` for convenience.
- Extend `_auth.ts` if/when Netlify Identity replaces the temporary bearer token.

## Scripts

- `npm run dev` – Local development via `netlify dev`
- `npm run build` – Production build (Vite + functions)
- `npm run preview` – Preview the built assets locally
- `npm run typecheck` – Run TypeScript in `--noEmit` mode

## Tech Stack

- Vite + TypeScript
- React + Tailwind CSS for the admin dashboard
- Vanilla TypeScript for the booking form
- Netlify Functions using the Supabase service role key
- Supabase Postgres for persistence

## License

MIT
