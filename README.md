# Valley Wedding Cars Booking Form

A Netlify-ready booking experience with live pricing powered by Supabase and Netlify Functions. Includes a protected React admin console for managing the car catalog and price rules.

## Features

- Dynamic vehicle catalog backed by Supabase Postgres
- Secure Netlify Functions providing CRUD APIs for cars and price rules
- Live price estimation that applies distance and contextual rules
- React-based `/admin` dashboard secured by a bearer token (or Netlify Identity)
- Shared TypeScript types between frontend and serverless functions

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Supabase**
   - Create a Supabase project.
   - Run the SQL files in `/sql` in order:
     - `schema.sql`
     - `sample-data.sql` (optional seed data)

3. **Environment variables** (Netlify UI or `.env` for local `netlify dev`):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE`
   - `ADMIN_API_TOKEN` (used by the admin dashboard for now)
   - Optional: `IDENTITY_JWKS_URL` if enabling Netlify Identity JWT validation

4. **Local development**
   ```bash
   npm run dev
   ```
   This runs `netlify dev`, serving the Vite frontend and functions.

5. **Production build**
   ```bash
   npm run build
   ```
   Outputs to `dist/` for Netlify deployment.

## API Endpoints

All functions are available under `/api/*` thanks to `netlify.toml` redirects.

### Public
- `GET /api/cars` – List active cars.
- `GET /api/price-rules` – List active price rules.
- `POST /api/price-estimate` – Calculate an estimate given `{ carId, kms?, scope, dateISO? }`.

### Admin (Bearer token or Netlify Identity required)
- `POST /api/cars-admin` – Create a car.
- `PUT /api/cars-admin` – Update a car.
- `DELETE /api/cars-admin` – Soft-delete (sets `active=false`).
- `POST /api/price-rules-admin` – Create a rule.
- `PUT /api/price-rules-admin` – Update a rule.
- `DELETE /api/price-rules-admin` – Soft-delete a rule.

Include the header `Authorization: Bearer <ADMIN_API_TOKEN>` to authenticate.

## Admin Dashboard

- Navigate to `/admin` after build/deploy.
- Paste your admin token (stored securely in Netlify env vars).
- Manage cars and price rules with live updates; deactivating removes them from public lists.

## Deployment Notes

- Netlify automatically runs `npm run build` and serves `dist/`.
- Ensure Supabase credentials are configured in the Netlify site environment.
- After deployment, verify:
  - `/api/cars` responds with your catalog.
  - `/admin` allows CRUD operations using the configured token.
  - Public form renders vehicles and live price estimates.

## Tech Stack

- Vite + TypeScript for the frontend bundle
- React + Tailwind for the admin app
- Vanilla TypeScript for the booking form
- Netlify Functions (TypeScript) using Supabase service role key
- Supabase Postgres for persistence

## Scripts

- `npm run dev` – Local development via `netlify dev`
- `npm run build` – Production build (Vite + functions)
- `npm run preview` – Preview the built assets locally

## License

MIT
