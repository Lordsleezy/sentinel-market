import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
  SCRAPER_MIN_SCORE: z.coerce.number().default(72),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SENTINEL_WEB_URL: z.string().url(),
  SENTINEL_WEB_TIMEOUT_MS: z.coerce.number().default(180000),
})

export const config = envSchema.parse(process.env)
