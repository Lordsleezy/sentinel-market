import { createClient } from "@supabase/supabase-js"
import { config } from "../config.js"
import { scrapeExistingListing } from "./sentinelWeb.js"
import type { EvaluatedDeal, ExistingCatalogItem } from "../types.js"

const supabaseKey = config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY

if (!supabaseKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is required for scraper writes")
}

const supabase = createClient(config.SUPABASE_URL, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

export const listExistingCatalog = async (): Promise<ExistingCatalogItem[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("id,title,price,specs,supplier,source_url,bundle_items,created_at")
    .order("created_at", { ascending: false })
    .limit(250)

  if (error) {
    console.warn(`[supabase] catalog read failed: ${error.message}`)
    return []
  }

  return (data || []).map((product) => ({
    id: product.id,
    title: product.title,
    category: inferCategory(product.title, product.specs),
    price: Number(product.price || 0),
    source_url: product.source_url,
    created_at: product.created_at,
    specs: product.specs || {},
  }))
}

export const publishDeal = async (deal: EvaluatedDeal) => {
  const { data: product, error: productError } = await supabase
    .from("products")
    .upsert(
      {
        title: deal.generatedTitle,
        description: deal.generatedDescription,
        price: deal.price,
        specs: deal.specs,
        images: deal.images,
        supplier: deal.supplier,
        source_url: deal.sourceUrl,
        bundle_items: deal.bundleItemIds,
      },
      { onConflict: "source_url" }
    )
    .select("id")
    .single()

  if (productError) {
    throw new Error(`Product upsert failed: ${productError.message}`)
  }

  const { error: dealError } = await supabase.from("deals").insert({
    product_id: product.id,
    original_price: deal.averageMarketPrice || deal.price,
    sale_price: deal.price,
    score: deal.score,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  })

  if (dealError) {
    throw new Error(`Deal insert failed: ${dealError.message}`)
  }

  if (deal.bundleItemIds.length > 0) {
    await createBundle(deal, product.id)
  }
}

export const recrawlStaleListings = async () => {
  const staleCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from("products")
    .select("id,title,price,source_url,created_at")
    .lt("created_at", staleCutoff)
    .limit(50)

  if (error) {
    console.warn(`[supabase] stale listing read failed: ${error.message}`)
    return
  }

  for (const product of data || []) {
    if (!product.source_url) continue
    try {
      const refreshed = await scrapeExistingListing(product.source_url)
      const current = refreshed.find((item) => item.source_url === product.source_url) || refreshed[0]

      if (!current || /sold|unavailable|out of stock|ended/i.test(`${current.raw_text || ""} ${current.title || ""}`)) {
        await supabase.from("products").delete().eq("id", product.id)
        console.log(`[recrawl] removed sold/unavailable listing ${product.title}`)
        continue
      }

      if (typeof current.price === "number" && Number(current.price) !== Number(product.price)) {
        await supabase.from("products").update({ price: current.price }).eq("id", product.id)
        console.log(`[recrawl] updated price ${product.title}: ${product.price} -> ${current.price}`)
      }
    } catch (error) {
      console.warn(`[recrawl] failed ${product.source_url}:`, error)
    }
  }
}

const createBundle = async (deal: EvaluatedDeal, productId: string) => {
  const accessoryIds = deal.bundleItemIds.slice(0, 3)
  const { data: accessories } = await supabase.from("products").select("id,price,title").in("id", accessoryIds)

  const accessoryTotal = (accessories || []).reduce((sum, item) => sum + Number(item.price || 0), 0)
  const totalPrice = Number((deal.price + accessoryTotal).toFixed(2))

  await supabase.from("bundles").insert({
    name: `${deal.generatedTitle} bundle`,
    products: [productId, ...accessoryIds],
    total_price: totalPrice,
    margin: Number((totalPrice * 0.18).toFixed(2)),
  })
}

const inferCategory = (title: string, specs: Record<string, unknown> | null) => {
  const haystack = `${title} ${JSON.stringify(specs || {})}`.toLowerCase()
  if (haystack.includes("laptop")) return "laptop"
  if (haystack.includes("desktop") || haystack.includes("workstation")) return "desktop"
  if (["dock", "charger", "sleeve", "keyboard", "mouse", "hub", "monitor"].some((term) => haystack.includes(term))) {
    return "accessory"
  }
  return "component"
}
