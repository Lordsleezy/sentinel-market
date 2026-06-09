import { createClient } from "@supabase/supabase-js"
import { config } from "../config.js"
import type { EvaluatedDeal, ExistingCatalogItem } from "../types.js"

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

export const listExistingCatalog = async (): Promise<ExistingCatalogItem[]> => {
  const { data, error } = await supabase
    .from("products")
    .select("id,title,price,specs,supplier,bundle_items")
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
