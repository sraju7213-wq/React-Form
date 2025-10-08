# Valley Wedding Cars Pricing System

This project powers the public enquiry form and administrative back office for Valley Wedding Cars. It exposes Netlify Functions that integrate with Supabase for vehicle and pricing data and serves a lightweight React admin panel for CRUD operations.

## Features
- Public endpoints for fetching cars and pricing rules.
- Authenticated CRUD endpoints for managing cars and rules.
- Live price estimator backed by Supabase data.
- React-based `/admin` interface protected with a bearer token input.
- Shared TypeScript pricing utilities to keep server and client in sync.

## Getting Started

### 1. Provision the database
1. Create a Supabase project.
2. Run [`sql/schema.sql`](sql/schema.sql) followed by [`sql/sample-data.sql`](sql/sample-data.sql) in the Supabase SQL editor.

### 2. Configure environment variables
Set the following variables in Netlify (Site settings → Build & deploy → Environment):

- `SUPABASE_URL` – your Supabase project URL.
- `SUPABASE_SERVICE_ROLE` – the service role key (used only within serverless functions).
- `ADMIN_API_TOKEN` – a long random string required by admin endpoints.
- *(Optional)* `IDENTITY_JWKS_URL` – Netlify Identity JWKS endpoint if you wire JWT auth.

### 3. Install dependencies
```bash
npm install
```

### 4. Run locally
```bash
npm run dev
```
Netlify Dev will proxy function calls under `/api/*` and serve the Vite development server.

### 5. Build
```bash
npm run build
```
Outputs static assets to `dist/` ready for Netlify deployment.

### 6. Deploy
Push to the connected repository or run `netlify deploy` as usual. After deployment:
- Visit `/api/cars` to verify data.
- Open `/admin`, paste your admin token, and manage inventory and rules.
- Confirm that the public form fetches cars and live prices correctly.

## Folder Overview
```
/
  netlify.toml
  package.json
  sql/                  # Database schema and seed data
  src/
    shared/             # Shared types & pricing utilities
    admin/              # React admin application
    main.ts             # Public form script
    style.css           # Shared styles
  netlify/functions/    # Netlify Functions (TypeScript)
```

## Testing Authentication Locally
1. Start Netlify Dev.
2. Use an HTTP client (e.g. curl, Postman) with header `Authorization: Bearer <ADMIN_API_TOKEN>` when calling `/api/cars-admin` and `/api/price-rules-admin` endpoints.

## Notes
- CORS headers are included in functions to allow usage from the Netlify-hosted frontend.
- The `/admin` application stores the provided token in `localStorage` for convenience during subsequent requests.
- Extend `_auth.ts` if/when Netlify Identity is adopted.
