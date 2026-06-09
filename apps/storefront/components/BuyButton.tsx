"use client"

import { ShoppingCart } from "lucide-react"
import { useState } from "react"

type BuyButtonProps = {
  productId: string
  variantId?: string | null
  handle?: string
  disabled?: boolean
}

export function BuyButton({ productId, variantId, handle, disabled = false }: BuyButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheckout = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: productId,
          variant_id: variantId,
          handle,
        }),
      })
      const payload = (await response.json()) as { url?: string; error?: string }

      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Unable to start checkout")
      }

      window.location.assign(payload.url)
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout")
      setIsLoading(false)
    }
  }

  return (
    <>
      <button className="buy" disabled={disabled || isLoading} onClick={handleCheckout} type="button">
        <ShoppingCart size={16} />
        {isLoading ? "Opening Stripe..." : "Buy Now"}
      </button>
      {error && <p className="checkout-error">{error}</p>}
    </>
  )
}
