import { json } from "./_supabase.mjs"

export const handler = async () =>
  json(200, {
    ok: true,
    service: "sentinel-market-netlify",
    timestamp: new Date().toISOString(),
  })
