import { fetch } from "undici"
import { config } from "../config.js"
import type { DealCandidate, SentinelWebProduct, Supplier } from "../types.js"

type ScrapeTarget = {
  supplier: Supplier
  url: string
  instructions: string
}

type SentinelJob = {
  id: string
  status: "queued" | "running" | "completed" | "failed"
  results?: SentinelWebProduct[]
  error?: string | null
}

type SentinelScore = {
  score: number
  market_value?: number
  rationale?: string
}

export const scrapeTargets: ScrapeTarget[] = [
  {
    supplier: "ebay",
    url: "https://www.ebay.com/sch/i.html?_nkw=laptop+computer+parts&_sop=15",
    instructions: "Extract laptop, desktop, component, and accessory deal cards with title, price, condition, seller rating, specs, and images.",
  },
  {
    supplier: "newegg",
    url: "https://www.newegg.com/p/pl?d=computer+parts",
    instructions: "Extract computer parts and clearance deals with current price, specs, image, and source URL.",
  },
  {
    supplier: "cj-dropshipping",
    url: "https://cjdropshipping.com/search/Computer%20accessory.html",
    instructions: "Extract computer accessories suitable for laptop bundles, including title, price, image, and product URL.",
  },
  {
    supplier: "back-market",
    url: "https://www.backmarket.com/en-us/l/laptops/0744fd27-8605-465d-8691-3b6a10c8812a",
    instructions: "Extract refurbished laptop deals with condition, price, specs, seller info, and images.",
  },
  {
    supplier: "swappa",
    url: "https://swappa.com/laptops",
    instructions: "Extract laptop listings with condition, price, specs, seller info, and images.",
  },
  {
    supplier: "decluttr",
    url: "https://www.decluttr.com/us/store/category/computers/",
    instructions: "Extract used computer listings and accessories with title, price, condition, specs, and images.",
  },
  {
    supplier: "facebook-marketplace",
    url: "https://www.facebook.com/marketplace/category/computers",
    instructions: "Extract visible computer marketplace listings where accessible, including price, title, location/seller info, and source URL.",
  },
  {
    supplier: "walmart",
    url: "https://www.walmart.com/search?q=laptop+clearance",
    instructions: "Extract laptop clearance product cards with title, current price, specs, images, and seller info.",
  },
  {
    supplier: "best-buy",
    url: "https://www.bestbuy.com/site/searchpage.jsp?st=open+box+laptop",
    instructions: "Extract open-box and clearance laptop deals with title, price, condition, specs, images, and source URL.",
  },
  {
    supplier: "craigslist",
    url: "https://sfbay.craigslist.org/search/sya?query=laptop",
    instructions: "Extract local computer listings with title, price, condition text, image, and source URL.",
  },
  {
    supplier: "liquidation",
    url: "https://www.liquidation.com/c/consumer-electronics-computers",
    instructions: "Extract liquidation computer lots with lot price, condition, images, and source URL.",
  },
  {
    supplier: "clearance",
    url: "https://www.microcenter.com/search/search_results.aspx?Ntt=laptop+clearance",
    instructions: "Extract clearance computer and accessory listings with title, price, specs, images, and source URL.",
  },
]

export const fetchDealsFromSentinelWeb = async (): Promise<DealCandidate[]> => {
  const batches = await Promise.allSettled(scrapeTargets.map(scrapeTarget))
  return batches.flatMap((batch) => (batch.status === "fulfilled" ? batch.value : []))
}

export const scoreWithSentinelWeb = async (deal: DealCandidate): Promise<SentinelScore> => {
  const response = await fetch(`${config.SENTINEL_WEB_URL.replace(/\/$/, "")}/score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product: {
        title: deal.title,
        price: deal.price,
        condition: deal.condition,
        specs: deal.specs,
        source_url: deal.sourceUrl,
        seller_info: deal.sellerInfo,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Sentinel Web score failed: ${response.status}`)
  }

  return (await response.json()) as SentinelScore
}

export const scrapeExistingListing = async (sourceUrl: string): Promise<SentinelWebProduct[]> => {
  const job = await submitJob({
    targetUrl: sourceUrl,
    instructions: "Recrawl this exact product listing. Return title, current price, sold/unavailable text if present, condition, specs, and images.",
    maxPages: 1,
  })
  return job.results || []
}

const scrapeTarget = async (target: ScrapeTarget): Promise<DealCandidate[]> => {
  const job = await submitJob({
    targetUrl: target.url,
    instructions: target.instructions,
    maxPages: 3,
  })

  return (job.results || []).map((product, index) => toDealCandidate(target.supplier, product, index))
}

const submitJob = async ({
  targetUrl,
  instructions,
  maxPages,
}: {
  targetUrl: string
  instructions: string
  maxPages: number
}): Promise<SentinelJob> => {
  const response = await fetch(`${config.SENTINEL_WEB_URL.replace(/\/$/, "")}/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target_url: targetUrl,
      instructions,
      max_pages: maxPages,
    }),
  })

  if (!response.ok) {
    throw new Error(`Sentinel Web scrape failed: ${response.status}`)
  }

  const created = (await response.json()) as SentinelJob
  return pollJob(created.id)
}

const pollJob = async (jobId: string): Promise<SentinelJob> => {
  const started = Date.now()
  while (Date.now() - started < config.SENTINEL_WEB_TIMEOUT_MS) {
    const response = await fetch(`${config.SENTINEL_WEB_URL.replace(/\/$/, "")}/jobs/${jobId}`)
    if (!response.ok) {
      throw new Error(`Sentinel Web job status failed: ${response.status}`)
    }
    const job = (await response.json()) as SentinelJob
    if (job.status === "completed") return job
    if (job.status === "failed") throw new Error(job.error || `Sentinel Web job failed: ${jobId}`)
    await sleep(2500)
  }
  throw new Error(`Sentinel Web job timed out: ${jobId}`)
}

const toDealCandidate = (supplier: Supplier, product: SentinelWebProduct, index: number): DealCandidate => ({
  supplier,
  sourceId: product.source_url || `${supplier}-${index}`,
  sourceUrl: product.source_url,
  title: product.title,
  price: Number(product.price || 0),
  averageMarketPrice: undefined,
  currency: "USD",
  category: inferCategory(product),
  condition: normalizeCondition(product.condition),
  sellerRating: Number(product.seller_info?.rating || 0) || undefined,
  sellerInfo: product.seller_info,
  specs: product.specs || {},
  images: product.images || [],
  inventoryQuantity: 1,
})

const inferCategory = (product: SentinelWebProduct): DealCandidate["category"] => {
  const haystack = `${product.title} ${JSON.stringify(product.specs || {})}`.toLowerCase()
  if (haystack.includes("laptop") || haystack.includes("macbook") || haystack.includes("thinkpad")) return "laptop"
  if (haystack.includes("desktop") || haystack.includes("workstation") || haystack.includes("tower")) return "desktop"
  if (["dock", "charger", "sleeve", "keyboard", "mouse", "monitor", "hub", "adapter"].some((term) => haystack.includes(term))) {
    return "accessory"
  }
  return "component"
}

const normalizeCondition = (condition?: string): DealCandidate["condition"] => {
  const lower = (condition || "").toLowerCase()
  if (lower.includes("new")) return "new"
  if (lower.includes("excellent")) return "excellent"
  if (lower.includes("good") || lower.includes("refurb")) return "good"
  if (lower.includes("fair")) return "fair"
  if (lower.includes("parts")) return "parts"
  return "good"
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
