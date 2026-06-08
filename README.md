# Sentinel Market

Automated tech marketplace for Sentinel Prime. The repo is a Medusa-style monorepo with:

- `apps/backend` - Medusa.js backend, PostgreSQL, Stripe, custom admin metrics API, deploy-ready for Railway.
- `apps/storefront` - Next.js storefront starter-inspired app themed for `market.sentinelprime.org`.
- `apps/scraper` - Node.js deal scraper using supplier APIs where possible, Playwright fallbacks, Ollama scoring, bundle detection, and Medusa catalog publishing.
- `apps/admin` - admin extension source for marketplace widgets.

## Requirements

- Node.js 20 LTS through Node 24 LTS. Medusa's Next.js starter currently does not support Node 25+.
- pnpm 9+
- PostgreSQL 15+
- Redis 7+
- Ollama running locally with `qwen2.5:7b` pulled:

```bash
ollama pull qwen2.5:7b
ollama serve
```

## Setup

```bash
cd sentinel-market
cp .env.example .env
docker compose up -d
pnpm install
pnpm --filter @sentinel-market/backend db:setup
pnpm dev
```

The backend runs at `http://localhost:9000`, Medusa Admin at `http://localhost:9000/app`, and the storefront at `http://localhost:8000`.

## Environment

All credentials live in `.env`. Important values:

- `DATABASE_URL` - PostgreSQL connection string. On Railway, use the PostgreSQL plugin URL and append `?sslmode=require` if required by the provider.
- `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_KEY` - Stripe payment configuration.
- `MEDUSA_ADMIN_API_TOKEN` - admin API token used by the scraper to create products.
- `OLLAMA_BASE_URL`, `OLLAMA_MODEL` - local Ollama scorer endpoint.
- Supplier keys for eBay, Newegg, CJ Dropshipping, and Back Market.

## Railway Deployment

1. Create a Railway project and add PostgreSQL and Redis services.
2. Add environment variables from `.env.example`.
3. Set the backend service root to `sentinel-market` if deploying from this parent repository, or repo root if this directory is pushed as the repository root.
4. Use `pnpm --filter @sentinel-market/backend build` as the build command and `pnpm --filter @sentinel-market/backend start` as the start command.
5. Point the custom domain/API domain to the Railway backend. Host the storefront on Vercel/Netlify with `NEXT_PUBLIC_MEDUSA_BACKEND_URL` set to the Railway backend URL.

## Scraper Workflow

The scraper runs every 4 hours by default (`SCRAPER_CRON=0 */4 * * *`):

1. Collect candidate computer and parts deals from supplier APIs.
2. Use Playwright for pages that need browser rendering.
3. Normalize price, specs, supplier metadata, source URL, and images.
4. Ask Ollama `qwen2.5:7b` for value scoring and listing copy.
5. Detect bundles by matching laptops/desktops with compatible accessories already available.
6. Push approved listings to Medusa with supplier and scoring metadata.

Run once manually:

```bash
pnpm --filter @sentinel-market/scraper scrape:once
```

## GitHub

Target repository: `Lordsleezy/sentinel-market`.
