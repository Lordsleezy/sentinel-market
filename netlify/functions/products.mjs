import { getMedusaProduct, json, listMedusaProducts } from "./_medusa.mjs"

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, {})
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" })

  try {
    const limit = Number(event.queryStringParameters?.limit || 12)
    const id = event.queryStringParameters?.id
    const handle = event.queryStringParameters?.handle

    if (id || handle) {
      const product = await getMedusaProduct({ id, handle })
      return json(200, { product })
    }

    const products = await listMedusaProducts(limit)
    return json(200, { products, source: "medusa" })
  } catch (error) {
    return json(500, { error: error.message })
  }
}
