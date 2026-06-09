import { json, supabaseAdmin } from "./_supabase.mjs"

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(200, {})
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" })

  const limit = Number(event.queryStringParameters?.limit || 12)
  const { data, error } = await supabaseAdmin()
    .from("products")
    .select("id,title,description,price,specs,images,supplier,source_url,bundle_items,created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    return json(500, { error: error.message })
  }

  return json(200, { products: data || [] })
}
