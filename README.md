# Sentinel Market

Automated Sentinel Prime tech marketplace running on Netlify, Supabase, and GitHub Actions.

## Architecture

- `apps/storefront` - Next.js storefront for `market.sentinelprime.org`.
- `netlify/functions` - serverless API layer for products, scraper health, and admin dashboard metrics.
- `apps/scraper` - Node.js scraper run by GitHub Actions every 4 hours.
- `supabase/schema.sql` - Supabase tables, indexes, and RLS policies.

Supabase is the catalog, orders, bundle, and deal database.

## Supabase Setup

Run [supabase/schema.sql](C:/Users/pgg12/Documents/Market/sentinel-market/supabase/schema.sql) against the existing Sentinel Prime Supabase project:

1. Open [Supabase Dashboard](https://supabase.com/dashboard).
2. Select the existing Sentinel Prime project.
3. Go to `SQL Editor`.
4. Click `New query`.
5. Open [supabase/schema.sql](C:/Users/pgg12/Documents/Market/sentinel-market/supabase/schema.sql) locally and paste the full file into the SQL editor.
6. Click `Run`.
7. Confirm the tables `products`, `orders`, `bundles`, and `deals` exist under `Table Editor`.
8. Go to `Project Settings` -> `API`.
9. Copy the `Project URL` into `SUPABASE_URL`.
10. Copy the anon public key into `SUPABASE_ANON_KEY`.
11. Copy the service role key into `SUPABASE_SERVICE_ROLE_KEY`.

Keep `SUPABASE_SERVICE_ROLE_KEY` only in Netlify environment variables and GitHub Actions secrets. Do not expose it in `NEXT_PUBLIC_*` variables.

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

## Supplier API Credentials

The GitHub Actions scraper needs real supplier credentials before it can create catalog rows.

### eBay

Required variable: `EBAY_API_KEY`

1. Create or log in to an [eBay Developers Program](https://developer.ebay.com/) account.
2. Open `Application Keys`.
3. Create an application for production marketplace access.
4. Generate an OAuth token for the Browse API scope used by marketplace search.
5. Add that bearer token or app access token as the GitHub Actions secret `EBAY_API_KEY`.
6. If eBay issues separate client ID/client secret credentials for your app, use them to mint the OAuth token outside the workflow and rotate `EBAY_API_KEY` when it expires.

The scraper calls eBay Browse search for computers and parts. Production apps may require eBay approval depending on volume.

### Newegg

Required variable: `NEWEGG_API_KEY`

1. Apply for a [Newegg Marketplace Seller](https://www.newegg.com/sellers/) account.
2. After approval, open the Newegg Seller Portal.
3. Go to API or integration settings.
4. Generate an API key for product/deal/catalog access.
5. Add it as the GitHub Actions secret `NEWEGG_API_KEY`.

Newegg marketplace API access is usually tied to an approved seller account. If Newegg provides seller ID and secret key instead of a single bearer token, store the generated bearer/API token in `NEWEGG_API_KEY` or update the connector to sign requests with the seller credentials.

### CJ Dropshipping

Required variable: `CJ_ACCESS_TOKEN`

1. Create or log in to a [CJ Dropshipping](https://cjdropshipping.com/) account.
2. Open the developer/API area from your CJ account dashboard.
3. Create an API integration and authorize product access.
4. Generate or copy the API access token.
5. Add it as the GitHub Actions secret `CJ_ACCESS_TOKEN`.

If CJ requires login-based token refresh for your account, keep `CJ_EMAIL` and `CJ_PASSWORD` in a secure secret store and rotate `CJ_ACCESS_TOKEN` manually until refresh support is added.

## Netlify Deployment

1. Open the Sentinel Prime Netlify team.
2. Either connect `Lordsleezy/sentinel-market` to the existing Sentinel Prime site, or create a new Netlify site from that repository.
3. Set the production domain to `market.sentinelprime.org` in `Domain management`.
4. If `sentinelprime.org` DNS is already managed by Netlify, add `market` as a domain alias/subdomain. If DNS is external, add the CNAME Netlify provides for `market.sentinelprime.org`.
5. Use the root directory of the repository.
6. Netlify reads [netlify.toml](C:/Users/pgg12/Documents/Market/sentinel-market/netlify.toml):
   - Build command: `corepack pnpm --filter @sentinel-market/storefront build`
   - Publish directory: `apps/storefront/.next`
   - Functions directory: `netlify/functions`
   - Production site URL: `https://market.sentinelprime.org`
   - Production API base: `https://market.sentinelprime.org/.netlify/functions`
7. Add the environment variables above in Netlify.
8. Deploy.
9. Confirm `https://market.sentinelprime.org/products` loads. Before the scraper runs, it should show `Products coming soon, check back shortly`.

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
