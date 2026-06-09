import { Cpu } from "lucide-react"
import { listProducts } from "../../components/api"
import { BuyButton } from "../../components/BuyButton"

export const metadata = {
  title: "Products | Sentinel Market",
  description: "Browse Sentinel Market products and bundles.",
}

export default async function ProductsPage() {
  const products = await listProducts()

  return (
    <main className="shell">
      <nav className="nav">
        <a className="brand" href="/">
          <span className="mark" />
          <span>Sentinel Market</span>
        </a>
        <div className="nav-links">
          <a href="/">Home</a>
          <a href="/products">Products</a>
        </div>
      </nav>

      <section className="catalog-header">
        <h1>Products</h1>
        <p>Sentinel Prime computers, parts, and upgrades ready for secure Stripe checkout.</p>
      </section>

      <section className="grid catalog-grid">
        {products.length > 0 ? (
          products.map((product) => (
            <article className="card" key={product.id}>
              <div className="image">
                {product.images?.[0] ? <img alt="" src={product.images[0]} /> : <Cpu size={44} />}
              </div>
              <h2>{product.title}</h2>
              <div className="meta">
                {product.description || "Specs and fulfillment notes are being prepared."}
              </div>
              {typeof product.price === "number" && <div className="price">${product.price.toFixed(2)}</div>}
              <BuyButton disabled={typeof product.price !== "number"} productId={product.id} />
            </article>
          ))
        ) : (
          <section className="empty-state" aria-label="No products available">
            <Cpu size={42} />
            <h2>No products yet, check back soon</h2>
            <p>The storefront is connected. New Sentinel Market listings will appear here as soon as they are approved.</p>
          </section>
        )}
      </section>
    </main>
  )
}
