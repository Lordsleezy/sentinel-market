import Medusa from "@medusajs/js-sdk"

const sdk = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000",
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})

export type StoreProduct = {
  id: string
  title: string
  description?: string | null
}

export const listProducts = async (): Promise<StoreProduct[]> => {
  try {
    const response = await sdk.store.product.list({
      limit: 8,
      region_id: process.env.NEXT_PUBLIC_DEFAULT_REGION,
    })

    return response.products.map((product) => ({
      id: product.id,
      title: product.title,
      description: product.description,
    }))
  } catch {
    return []
  }
}
