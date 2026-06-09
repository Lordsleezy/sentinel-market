# Codex Progress - Sentinel Market

## Current Focus

Sentinel Market is now scoped to a clean storefront deployment for `market.sentinelprime.org`.

## Completed

- Removed the scraper app, scheduled scraper workflow, and scraper health function from the active repo.
- Kept Netlify as the deployment target with Next.js storefront output and Netlify Functions.
- Added a professional Sentinel Prime dark theme empty state on the homepage and products page.
- Added product listing cards sourced from Supabase through `netlify/functions/products.mjs`.
- Added Stripe Checkout session creation through `netlify/functions/create-checkout.mjs`.
- Added Stripe webhook order capture through `netlify/functions/stripe-webhook.mjs`.
- Updated README setup for Supabase, Stripe, and Netlify deployment.

## Required Deployment Secrets

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Verification

- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm build`
- `node --check netlify/functions/create-checkout.mjs`
- `node --check netlify/functions/stripe-webhook.mjs`
- `node --check netlify/functions/products.mjs`
- Browser smoke test at `http://localhost:8000/`
- Browser smoke test at `http://localhost:8000/products`

Pending push.
