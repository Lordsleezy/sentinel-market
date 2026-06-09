import { CheckCircle2 } from "lucide-react"

export const metadata = {
  title: "Checkout complete | Sentinel Market",
  description: "Your Sentinel Market checkout is complete.",
}

export default function CheckoutSuccessPage() {
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

      <section className="success-state">
        <CheckCircle2 size={48} />
        <h1>Payment received</h1>
        <p>Your order has been recorded and is queued for Sentinel Prime fulfillment.</p>
        <a className="hero-link" href="/products">
          Back to products
        </a>
      </section>
    </main>
  )
}
