import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Sentinel Market",
  description: "AI-ranked computers, parts, and bundles from Sentinel Prime.",
  metadataBase: new URL(process.env.MARKET_DOMAIN || "https://market.sentinelprime.org"),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
