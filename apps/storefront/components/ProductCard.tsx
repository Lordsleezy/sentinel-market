import Link from "next/link"
import { Cpu } from "lucide-react"
import type { StoreProduct } from "./api"
import { BuyButton } from "./BuyButton"

type ProductCardProps = {
  product: StoreProduct
}

const formatPrice = (price: number, currency = "usd") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(price)

export function ProductCard({ product }: ProductCardProps) {
  const hasPrice = typeof product.price === "number"

  return (
    <article className="card">
      <Link className="card-link" href={`/products/${product.handle}`}>
        <div className="image">
          {product.images?.[0] ? <img alt="" src={product.images[0]} /> : <Cpu size={44} />}
        </div>
        <h2>{product.title}</h2>
        <div className="meta">{product.description}</div>
        {hasPrice && <div className="price">{formatPrice(product.price!, product.currency)}</div>}
      </Link>
      <BuyButton
        disabled={!hasPrice}
        handle={product.handle}
        productId={product.id}
        variantId={product.variantId}
      />
    </article>
  )
}
