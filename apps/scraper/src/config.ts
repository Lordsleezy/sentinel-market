import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
  SCRAPER_CRON: z.string().default("0 */4 * * *"),
  SCRAPER_MIN_SCORE: z.coerce.number().default(72),
  MEDUSA_ADMIN_API_URL: z.string().url().default("http://localhost:9000"),
  MEDUSA_ADMIN_API_TOKEN: z.string().optional(),
  OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  OLLAMA_MODEL: z.string().default("qwen2.5:7b"),
  EBAY_CLIENT_ID: z.string().optional(),
  EBAY_CLIENT_SECRET: z.string().optional(),
  NEWEGG_SELLER_ID: z.string().optional(),
  NEWEGG_SECRET_KEY: z.string().optional(),
  CJ_ACCESS_TOKEN: z.string().optional(),
  BACK_MARKET_PARTNER_TOKEN: z.string().optional(),
})

export const config = envSchema.parse(process.env)
