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

const buildUrl = (path: string) => {
  const base = apiBase()
  return base.startsWith("http") ? `${base}${path}` : `${siteUrl()}${base}${path}`
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
