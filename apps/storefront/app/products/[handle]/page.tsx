import Link from "next/link"
import { notFound } from "next/navigation"
import { BuyButton } from "../../../components/BuyButton"
import { Footer } from "../../../components/Footer"
import { getProduct } from "../../../components/api"

type ProductPageProps = {
  params: Promise<{ handle: string }>
}

const formatPrice = (price: number, currency = "usd") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(price)

export async function generateMetadata({ params }: ProductPageProps) {
  const { handle } = await params
  const product = await getProduct(handle)
  return {
    title: product ? `${product.title} | Sentinel Market` : "Product | Sentinel Market",
    description: product?.description || "Sentinel Market product details.",
  }
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { handle } = await params
  const product = await getProduct(handle)

  if (!product) {
    notFound()
  }

  const defaultVariant = product.variants?.[0]
  const hasPrice = typeof (defaultVariant?.price ?? product.price) === "number"
  const displayPrice = defaultVariant?.price ?? product.price
  const currency = defaultVariant?.currency || product.currency

  return (
    <main className="shell">
      <nav className="nav">
        <Link className="brand" href="/">
          <span className="mark" />
          <span>Sentinel Market</span>
        </Link>
        <div className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/products">Products</Link>
        </div>
      </nav>

      <section className="product-detail">
        <div className="product-gallery">
          {product.images?.[0] ? (
            <img alt={product.title} className="product-hero" src={product.images[0]} />
          ) : (
            <div className="product-hero placeholder">No image</div>
          )}
        </div>
        <div className="product-copy">
          <p className="eyebrow">Medusa catalog</p>
          <h1>{product.title}</h1>
          <p>{product.description || "Product details are being finalized."}</p>
          {hasPrice && <div className="price detail-price">{formatPrice(displayPrice!, currency)}</div>}
          {product.variants && product.variants.length > 1 && (
            <div className="variant-list">
              <p>Available options</p>
              <ul>
                {product.variants.map((variant) => (
                  <li key={variant.id}>
                    {variant.title}
                    {typeof variant.price === "number" && ` — ${formatPrice(variant.price, variant.currency)}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <BuyButton
            disabled={!hasPrice}
            handle={product.handle}
            productId={product.id}
            variantId={defaultVariant?.id || product.variantId}
          />
        </div>
      </section>

      <Footer />
    </main>
  )
}
