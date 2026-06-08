import { fetch } from "undici"
import { config } from "../config.js"
import type { EvaluatedDeal, ExistingCatalogItem } from "../types.js"

const headers = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${config.MEDUSA_ADMIN_API_TOKEN || ""}`,
})

export const listExistingCatalog = async (): Promise<ExistingCatalogItem[]> => {
  if (!config.MEDUSA_ADMIN_API_TOKEN) {
    return []
  }

  const response = await fetch(`${config.MEDUSA_ADMIN_API_URL}/admin/products?limit=100`, {
    headers: headers(),
  })

  if (!response.ok) {
    return []
  }

  const payload = (await response.json()) as {
    products?: Array<{ id: string; title: string; metadata?: Record<string, unknown> }>
  }

  return (payload.products || []).map((product) => ({
    id: product.id,
    title: product.title,
    category: String(product.metadata?.source_category || ""),
    specs: product.metadata?.specs as Record<string, unknown> | undefined,
  }))
}

export const publishDeal = async (deal: EvaluatedDeal) => {
  if (!config.MEDUSA_ADMIN_API_TOKEN) {
    console.log(`[dry-run] ${deal.generatedTitle} score=${deal.score}`)
    return
  }

  const response = await fetch(`${config.MEDUSA_ADMIN_API_URL}/admin/products`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      title: deal.generatedTitle,
      description: deal.generatedDescription,
      status: "draft",
      images: deal.images.map((url) => ({ url })),
      metadata: {
        source_supplier: deal.supplier,
        source_id: deal.sourceId,
        source_url: deal.sourceUrl,
        source_category: deal.category,
        source_price: deal.price,
        source_currency: deal.currency,
        value_score: deal.score,
        specs: deal.specs,
        bundle_hints: deal.bundleHints,
      },
      options: [{ title: "Condition", values: ["Sourced deal"] }],
      variants: [
        {
          title: "Default",
          manage_inventory: true,
          inventory_quantity: deal.inventoryQuantity || 1,
          prices: [{ currency_code: deal.currency.toLowerCase(), amount: Math.round(deal.price * 100) }],
        },
      ],
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Medusa publish failed (${response.status}): ${body}`)
  }
}
