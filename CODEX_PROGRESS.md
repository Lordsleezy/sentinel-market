# Codex Progress - Sentinel Market

## Current Repo Understanding

Sentinel Market is a Netlify + Next.js storefront with Netlify Functions and Supabase tables for products, orders, bundles, and deals. The scraper runs from GitHub Actions every 4 hours.

Before this pass, the scraper still had individual supplier connector files for eBay, Newegg, CJ Dropshipping, and Back Market.

## Added This Pass

- Removed all individual supplier API integrations from the scraper.
- Added `SENTINEL_WEB_URL` configuration.
- Added a Sentinel Web client in `apps/scraper/src/services/sentinelWeb.ts`.
- The scraper now submits browser scrape jobs to Sentinel Web for:
  - eBay
  - Newegg
  - CJ Dropshipping
  - Back Market
  - Swappa
  - Decluttr
  - Facebook Marketplace
  - Walmart
  - Best Buy
  - Craigslist
  - liquidation pages
  - clearance pages
- Each returned product is scored through Sentinel Web `POST /score`.
- Approved products are written to Supabase `products` and `deals`.
- Laptop/desktop products still trigger compatible accessory bundle detection.
- Existing listings older than 24 hours are recrawled through Sentinel Web:
  - price changes update the Supabase product price
  - sold/unavailable listings are deleted
- GitHub Actions `scraper.yml` still runs every 4 hours and keeps the commented Wake on LAN section for later Legion integration.

## Environment

Required for GitHub Actions:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` recommended for writes under current RLS
- `SENTINEL_WEB_URL`

Requested public/commercial env vars are also reflected in `.env.example`:

- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Notes

- Sentinel Web now owns supplier page access, browser behavior, pagination, and scoring.
- Sentinel Market only orchestrates jobs, applies approval threshold, handles bundles, and writes Supabase rows.
- `SUPABASE_SERVICE_ROLE_KEY` is still needed for reliable GitHub Actions writes unless Supabase RLS policies are changed to allow an authenticated scraper identity.

## Verification

Completed:

- `corepack pnpm -r typecheck`
- `corepack pnpm -r lint`
- `corepack pnpm --filter @sentinel-market/scraper build`
- `corepack pnpm --filter @sentinel-market/storefront build`

Pending:

- Git push to `Lordsleezy/sentinel-market`
