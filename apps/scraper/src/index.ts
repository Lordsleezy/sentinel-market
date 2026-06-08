import { CronJob } from "cron"
import { connectors } from "./connectors/index.js"
import { config } from "./config.js"
import { identifyBundleOpportunities } from "./services/bundles.js"
import { listExistingCatalog, publishDeal } from "./services/medusa.js"
import { evaluateDeal } from "./services/ollama.js"
import type { DealCandidate } from "./types.js"

const runScrape = async () => {
  console.log(`[scraper] run started ${new Date().toISOString()}`)

  const batches = await Promise.allSettled(connectors.map((connector) => connector.fetchDeals()))
  const candidates = batches.flatMap((batch) => (batch.status === "fulfilled" ? batch.value : []))
  const uniqueCandidates = dedupe(candidates)
  const catalog = await listExistingCatalog()

  console.log(`[scraper] found ${uniqueCandidates.length} unique candidates`)

  for (const candidate of uniqueCandidates) {
    const evaluated = await evaluateDeal(candidate)
    evaluated.bundleHints = identifyBundleOpportunities(evaluated, catalog)

    if (!evaluated.approved || evaluated.score < config.SCRAPER_MIN_SCORE) {
      console.log(`[scraper] skipped ${evaluated.title} score=${evaluated.score}`)
      continue
    }

    await publishDeal(evaluated)
    console.log(`[scraper] published ${evaluated.generatedTitle} score=${evaluated.score}`)
  }

  console.log(`[scraper] run finished ${new Date().toISOString()}`)
}

const dedupe = (deals: DealCandidate[]) => {
  const seen = new Set<string>()
  return deals.filter((deal) => {
    const key = `${deal.supplier}:${deal.sourceId || deal.sourceUrl}`
    if (seen.has(key) || !deal.title) {
      return false
    }
    seen.add(key)
    return true
  })
}

if (process.argv.includes("--once")) {
  runScrape().catch((error) => {
    console.error(error)
    process.exit(1)
  })
} else {
  const job = new CronJob(config.SCRAPER_CRON, () => {
    runScrape().catch((error) => console.error("[scraper] run failed", error))
  })

  job.start()
  console.log(`[scraper] scheduled with ${config.SCRAPER_CRON}`)
}
