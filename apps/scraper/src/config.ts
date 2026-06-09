import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
  SCRAPER_MIN_SCORE: z.coerce.number().default(72),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  EBAY_API_KEY: z.string().optional(),
  NEWEGG_API_KEY: z.string().optional(),
  CJ_ACCESS_TOKEN: z.string().optional(),
  BACK_MARKET_API_KEY: z.string().optional(),
})

export const config = envSchema.parse(process.env)
