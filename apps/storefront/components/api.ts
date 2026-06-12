export type StoreVariant = {
  id: string
  title: string
  price?: number | null
  currency?: string
}

export type StoreProduct = {
  id: string
  handle: string
  title: string
  description?: string | null
  price?: number | null
  currency?: string
  supplier?: string | null
  images?: string[] | null
  variantId?: string | null
  variants?: StoreVariant[]
}

const apiBase = () => process.env.NEXT_PUBLIC_API_BASE_URL || "/.netlify/functions"
const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL || process.env.MARKET_DOMAIN || "https://market.sentinelprime.org"

const medusaUrl = () =>
  (process.env.MEDUSA_API_URL || process.env.NEXT_PUBLIC_MEDUSA_URL || "http://136.118.148.167:9000").replace(
    /\/$/,
    "",
  )

const publishableKey = () =>
  process.env.MEDUSA_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
  "pk_328841e769dad23631dd3baf9616ac30c7c9dd9fd090cf5483ca2e949d97da28"

const buildUrl = (path: string) => {
  const base = apiBase()
  return base.startsWith("http") ? `${base}${path}` : `${siteUrl()}${base}${path}`
}

const priceFromVariant = (variant: {
  calculated_price?: { calculated_amount?: number; original_amount?: number; currency_code?: string }
  prices?: { amount?: number }[]
}) => {
  const calculated = variant?.calculated_price?.calculated_amount
  if (typeof calculated === "number") return calculated / 100
  const original = variant?.calculated_price?.original_amount
  if (typeof original === "number") return original / 100
  const price = variant?.prices?.[0]?.amount
  if (typeof price === "number") return price / 100
  return null
}

const mapMedusaProduct = (product: {
  id: string
  handle: string
  title: string
  description?: string | null
  thumbnail?: string | null
  images?: { url?: string }[]
  variants?: {
    id: string
    title: string
    calculated_price?: { calculated_amount?: number; original_amount?: number; currency_code?: string }
    prices?: { amount?: number }[]
  }[]
}): StoreProduct => {
  const variant = product.variants?.[0]
  const images = (product.images || []).map((image) => image.url).filter(Boolean) as string[]
  if (product.thumbnail && !images.includes(product.thumbnail)) {
    images.unshift(product.thumbnail)
  }
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description,
    price: variant ? priceFromVariant(variant) : null,
    currency: variant?.calculated_price?.currency_code || "usd",
    images,
    variantId: variant?.id || null,
    variants: (product.variants || []).map((item) => ({
      id: item.id,
      title: item.title,
      price: priceFromVariant(item),
      currency: item.calculated_price?.currency_code || "usd",
    })),
    supplier: "medusa",
  }
}

async function fetchFromMedusaDirect(limit = 12): Promise<StoreProduct[]> {
  const headers = { "x-publishable-api-key": publishableKey() }
  const regionsRes = await fetch(`${medusaUrl()}/store/regions`, { headers, next: { revalidate: 300 } })
  const regionsPayload = (await regionsRes.json()) as { regions?: { id: string; currency_code?: string }[] }
  const regions = regionsPayload.regions || []
  const usd = regions.find((r) => r.currency_code === "usd")
  const region = usd?.id || regions[0]?.id || ""
  const params = new URLSearchParams({
    limit: String(limit),
    fields: "*variants.calculated_price,+variants.prices",
  })
  if (region) params.set("region_id", region)
  const res = await fetch(`${medusaUrl()}/store/products?${params}`, { headers, next: { revalidate: 300 } })
  if (!res.ok) return []
  const payload = (await res.json()) as { products?: Parameters<typeof mapMedusaProduct>[0][] }
  return (payload.products || []).map(mapMedusaProduct)
}

const mapProduct = (product: StoreProduct): StoreProduct => ({
  id: product.id,
  handle: product.handle,
  title: product.title,
  description: product.description,
  price: product.price,
  currency: product.currency,
  supplier: product.supplier,
  images: product.images,
  variantId: product.variantId,
  variants: product.variants,
})

export const listProducts = async (limit = 12): Promise<StoreProduct[]> => {
  try {
    const direct = await fetchFromMedusaDirect(limit)
    if (direct.length > 0) return direct
    const response = await fetch(buildUrl(`/products?limit=${limit}`), {
      next: { revalidate: 300 },
    })
    if (!response.ok) return []
    const payload = (await response.json()) as { products?: StoreProduct[] }
    return (payload.products || []).map(mapProduct)
  } catch {
    return []
  }
}

export const getProduct = async (handle: string): Promise<StoreProduct | null> => {
  try {
    const headers = { "x-publishable-api-key": publishableKey() }
    const regionsRes = await fetch(`${medusaUrl()}/store/regions`, { headers, next: { revalidate: 300 } })
    const regionsPayload = (await regionsRes.json()) as { regions?: { id: string; currency_code?: string }[] }
    const regions = regionsPayload.regions || []
    const usd = regions.find((r) => r.currency_code === "usd")
    const region = usd?.id || regions[0]?.id || ""
    const params = new URLSearchParams({
      fields: "*variants.calculated_price,+variants.prices",
      handle,
    })
    if (region) params.set("region_id", region)
    const directRes = await fetch(`${medusaUrl()}/store/products?${params}`, { headers, next: { revalidate: 300 } })
    if (directRes.ok) {
      const payload = (await directRes.json()) as { products?: Parameters<typeof mapMedusaProduct>[0][] }
      const product = payload.products?.[0]
      if (product) return mapMedusaProduct(product)
    }
    const response = await fetch(buildUrl(`/products?handle=${encodeURIComponent(handle)}`), {
      next: { revalidate: 300 },
    })
    if (!response.ok) return null
    const payload = (await response.json()) as { product?: StoreProduct }
    return payload.product ? mapProduct(payload.product) : null
  } catch {
    return null
  }
}
