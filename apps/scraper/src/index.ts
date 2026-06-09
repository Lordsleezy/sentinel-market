import { connectors } from "./connectors/index.js"
import { config } from "./config.js"
import { identifyBundleOpportunities } from "./services/bundles.js"
import { evaluateDeal } from "./services/scoring.js"
import { listExistingCatalog, publishDeal } from "./services/supabase.js"
import type { DealCandidate } from "./types.js"

const runScrape = async () => {
  console.log(`[scraper] run started ${new Date().toISOString()}`)

  const batches = await Promise.allSettled(connectors.map((connector) => connector.fetchDeals()))
  const candidates = batches.flatMap((batch) => (batch.status === "fulfilled" ? batch.value : []))
  const uniqueCandidates = dedupe(candidates)
  const catalog = await listExistingCatalog()

  console.log(`[scraper] found ${uniqueCandidates.length} unique candidates`)

  for (const candidate of uniqueCandidates) {
    const evaluated = evaluateDeal(candidate)
    evaluated.bundleItemIds = identifyBundleOpportunities(evaluated, catalog)

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

runScrape().catch((error) => {
  console.error(error)
  process.exit(1)
})
