# Sentinel Market

Automated Sentinel Prime tech marketplace running on Netlify, Supabase, and GitHub Actions.

## Architecture

- `apps/storefront` - Next.js storefront for `market.sentinelprime.org`.
- `netlify/functions` - serverless API layer for products, scraper health, and admin dashboard metrics.
- `apps/scraper` - Node.js scraper run by GitHub Actions every 4 hours.
- `supabase/schema.sql` - Supabase tables, indexes, and RLS policies.

Supabase is the catalog, orders, bundle, and deal database.

## Supabase Setup

Run [supabase/schema.sql](C:/Users/pgg12/Documents/Market/sentinel-market/supabase/schema.sql) in the Supabase SQL editor.

Tables:

- `products` - catalog listings and bundle item references.
- `orders` - manual fulfillment queue and supplier attribution.
- `bundles` - generated bundle listings.
- `deals` - scored deal records tied to products.

The admin metrics function is protected by Supabase auth and only allows `paul@sentinelprime.org`.

## Environment Variables

Copy `.env.example` locally and add these in Netlify and GitHub Actions secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `EBAY_API_KEY`
- `NEWEGG_API_KEY`
- `CJ_ACCESS_TOKEN`
- `BACK_MARKET_API_KEY`

Storefront public variables:

- `NEXT_PUBLIC_API_BASE_URL=https://market.sentinelprime.org/.netlify/functions`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Netlify Deployment

1. Connect `Lordsleezy/sentinel-market` to Netlify.
2. Set the site domain to `market.sentinelprime.org`.
3. Use the root directory of the repository.
4. Netlify reads [netlify.toml](C:/Users/pgg12/Documents/Market/sentinel-market/netlify.toml):
   - Build command: `corepack pnpm --filter @sentinel-market/storefront build`
   - Publish directory: `apps/storefront/.next`
   - Functions directory: `netlify/functions`
5. Add the environment variables above in Netlify.
6. Deploy.

Routes:

- `/api/products` -> `/.netlify/functions/products`
- `/api/scraper-health` -> `/.netlify/functions/scraper-health`
- `/admin-dashboard` -> `/.netlify/functions/admin-dashboard`

## Scraper

The scraper runs from [.github/workflows/scraper.yml](C:/Users/pgg12/Documents/Market/sentinel-market/.github/workflows/scraper.yml) every 4 hours:

```yaml
schedule:
  - cron: "0 */4 * * *"
```

It collects deals from eBay, Newegg, CJ Dropshipping, and Back Market, then scores each deal from 0-100 using:

- price versus average market price
- specs
- condition
- seller rating

Approved deals are written directly to Supabase. If a laptop or desktop is found, the scraper checks existing compatible accessories and creates a bundle row.

Run locally:

```bash
corepack pnpm install
corepack pnpm --filter @sentinel-market/scraper scrape:once
```

## Wake on LAN

The scraper workflow includes a commented-out Wake on LAN pattern for later Legion-assisted scraping. It is intentionally disabled until the Legion MAC address, wake path, and sleep webhook are ready.

## Development

```bash
corepack pnpm install
corepack pnpm dev:storefront
corepack pnpm -r typecheck
```

The storefront falls back to sample products if Supabase or Netlify Functions are unavailable locally.
