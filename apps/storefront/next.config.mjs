import { fileURLToPath } from "node:url"

const workspaceRoot = fileURLToPath(new URL("../../", import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: workspaceRoot,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.ebayimg.com" },
      { protocol: "https", hostname: "**.neweggimages.com" },
      { protocol: "https", hostname: "**.backmarket.com" },
      { protocol: "https", hostname: "**.cjdropshipping.com" },
      { protocol: "https", hostname: "**.medusajs.com" }
    ]
  },
  env: {
    MARKET_DOMAIN: process.env.MARKET_DOMAIN || "https://market.sentinelprime.org"
  }
}

export default nextConfig
