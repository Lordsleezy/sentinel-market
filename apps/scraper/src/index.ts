import { config } from "./config.js"
import { identifyBundleOpportunities } from "./services/bundles.js"
import { fetchDealsFromSentinelWeb, scoreWithSentinelWeb } from "./services/sentinelWeb.js"
import { listExistingCatalog, publishDeal, recrawlStaleListings } from "./services/supabase.js"
import type { DealCandidate } from "./types.js"

const runScrape = async () => {
  console.log(`[scraper] run started ${new Date().toISOString()}`)

  const candidates = await fetchDealsFromSentinelWeb()
  const uniqueCandidates = dedupe(candidates)
  const catalog = await listExistingCatalog()

  console.log(`[scraper] found ${uniqueCandidates.length} unique candidates`)

  for (const candidate of uniqueCandidates) {
    const score = await scoreWithSentinelWeb(candidate)
    const evaluated = {
      ...candidate,
      score: score.score,
      averageMarketPrice: score.market_value || candidate.averageMarketPrice,
      approved: score.score >= config.SCRAPER_MIN_SCORE,
      generatedTitle: generateTitle(candidate),
      generatedDescription: generateDescription(candidate, score),
      bundleItemIds: identifyBundleOpportunities(
        {
          ...candidate,
          score: score.score,
          approved: score.score >= config.SCRAPER_MIN_SCORE,
          generatedTitle: generateTitle(candidate),
          generatedDescription: generateDescription(candidate, score),
          bundleItemIds: [],
        },
        catalog
      ),
    }

    if (!evaluated.approved || evaluated.score < config.SCRAPER_MIN_SCORE) {
      console.log(`[scraper] skipped ${evaluated.title} score=${evaluated.score}`)
      continue
    }

    await publishDeal(evaluated)
    console.log(`[scraper] published ${evaluated.generatedTitle} score=${evaluated.score}`)
  }

  await recrawlStaleListings()
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

const generateTitle = (deal: DealCandidate) => {
  const condition = deal.condition ? `${deal.condition[0].toUpperCase()}${deal.condition.slice(1)} ` : ""
  return `${condition}${deal.title}`.replace(/\s+/g, " ").trim().slice(0, 140)
}

const generateDescription = (deal: DealCandidate, score: { score: number; market_value?: number; rationale?: string }) => {
  const specs = Object.entries(deal.specs || {})
    .slice(0, 10)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ")
  return [
    `${deal.title} sourced from ${deal.supplier}.`,
    `Sentinel Web score ${score.score}/100${score.market_value ? ` versus estimated market value $${score.market_value.toFixed(2)}` : ""}.`,
    specs ? `Specs: ${specs}.` : "Specs will be confirmed before fulfillment.",
    score.rationale ? `Scoring rationale: ${score.rationale}` : "",
  ]
    .filter(Boolean)
    .join(" ")
}

runScrape().catch((error) => {
  console.error(error)
  process.exit(1)
})
