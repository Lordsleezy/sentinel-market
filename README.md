# Sentinel Market

Sentinel Market is the Netlify-ready storefront for Sentinel Prime. It uses Next.js for the public catalog, Medusa v2 for products and carts, Netlify Functions for API and checkout endpoints, and Stripe Checkout for payments.

## What Ships

- `apps/storefront` - Next.js storefront for `https://market.sentinelprime.org`.
- `netlify/functions/products.mjs` - reads product listings from Medusa Store API.
- `netlify/functions/create-checkout.mjs` - creates a Medusa cart, then opens Stripe Checkout.
- `netlify/functions/stripe-webhook.mjs` - records completed Stripe orders (optional Supabase logging).
- `supabase/schema.sql` - products, orders, bundles, and deals schema.

The scraper and automation workflow are intentionally removed from this deployment path. This repo is focused on a clean storefront that can go live on Netlify.

## Environment Variables

Copy `.env.example` locally and add the same values in Netlify:

- `SITE_URL=https://market.sentinelprime.org`
- `MARKET_DOMAIN=https://market.sentinelprime.org`
- `MEDUSA_API_URL=https://legion.sentinelprime.org`
- `MEDUSA_PUBLISHABLE_KEY` (Medusa publishable key for Store API)
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_API_BASE_URL=https://market.sentinelprime.org/.netlify/functions`
- `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Optional legacy order logging:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Keep `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` server-side only. Do not expose them in `NEXT_PUBLIC_*` variables.

## Supabase Setup

Run [supabase/schema.sql](C:/Users/pgg12/Documents/Market/sentinel-market/supabase/schema.sql) against the existing Sentinel Prime Supabase project:

1. Open [Supabase Dashboard](https://supabase.com/dashboard).
2. Select the existing Sentinel Prime project.
3. Go to `SQL Editor`.
4. Click `New query`.
5. Paste the full contents of [supabase/schema.sql](C:/Users/pgg12/Documents/Market/sentinel-market/supabase/schema.sql).
6. Click `Run`.
7. Confirm `products`, `orders`, `bundles`, and `deals` exist in `Table Editor`.
8. Go to `Project Settings` -> `API`.
9. Copy the `Project URL` to `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`.
10. Copy the anon public key to `SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
11. Copy the service role key to `SUPABASE_SERVICE_ROLE_KEY` in Netlify.

To add a product before automation exists, insert a row in `products` with `title`, `description`, `price`, `supplier`, and a unique `source_url`. `images` can be an empty array or an array of public image URLs.

## Stripe Setup

1. Create or open the Stripe account for Sentinel Prime.
2. Copy the publishable key to `STRIPE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Copy the secret key to `STRIPE_SECRET_KEY`.
4. Add a webhook endpoint in Stripe:
   - URL: `https://market.sentinelprime.org/.netlify/functions/stripe-webhook`
   - Event: `checkout.session.completed`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`.

When a customer clicks `Buy Now`, the storefront calls `/.netlify/functions/create-checkout`, redirects to Stripe Checkout, and Stripe calls the webhook after payment. The webhook inserts the order into the Supabase `orders` table with status `pending_manual_fulfillment`.

## Netlify Deployment

1. In Netlify, connect `Lordsleezy/sentinel-market`.
2. Use the repository root as the base directory.
3. Netlify reads [netlify.toml](C:/Users/pgg12/Documents/Market/sentinel-market/netlify.toml):
   - Build command: `corepack pnpm --filter @sentinel-market/storefront build`
   - Publish directory: `apps/storefront/.next`
   - Functions directory: `netlify/functions`
   - Production URL: `https://market.sentinelprime.org`
4. In `Domain management`, add or assign `market.sentinelprime.org`.
5. If DNS is managed outside Netlify, create the CNAME record Netlify provides for `market.sentinelprime.org`.
6. Add the environment variables listed above.
7. Deploy.

Before products are added, the homepage and `/products` page show a professional empty state: `No products yet, check back soon`.

## Local Development

```bash
corepack pnpm install
corepack pnpm dev
```

Run checks:

```bash
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm build
```
