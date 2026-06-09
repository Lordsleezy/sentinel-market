export type StoreProduct = {
  id: string
  title: string
  description?: string | null
  price?: number | null
  supplier?: string | null
  images?: string[] | null
}

export const listProducts = async (): Promise<StoreProduct[]> => {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/.netlify/functions"
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.MARKET_DOMAIN || "https://market.sentinelprime.org"
    const url = apiBaseUrl.startsWith("http")
      ? `${apiBaseUrl}/products?limit=8`
      : `${siteUrl}${apiBaseUrl}/products?limit=8`

    const response = await fetch(url, {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      return []
    }

    const payload = (await response.json()) as { products?: StoreProduct[] }

    return (payload.products || []).map((product) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      supplier: product.supplier,
      images: product.images,
    }))
  } catch {
    return []
  }
}
