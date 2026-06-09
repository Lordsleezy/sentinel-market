import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || anonKey

if (!supabaseUrl || !anonKey) {
  console.warn("Supabase environment variables are missing")
}

export const supabaseAdmin = () =>
  createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

export const supabaseAuth = () =>
  createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

export const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": process.env.SITE_URL || "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  },
  body: JSON.stringify(body),
})

export const requirePaul = async (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization || ""
  const token = authHeader.replace(/^Bearer\s+/i, "")

  if (!token) {
    return { error: json(401, { error: "Missing Supabase bearer token" }) }
  }

  const { data, error } = await supabaseAuth().auth.getUser(token)

  if (error || data.user?.email !== "paul@sentinelprime.org") {
    return { error: json(403, { error: "Admin access denied" }) }
  }

  return { user: data.user }
}
