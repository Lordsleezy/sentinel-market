import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Footer } from "../../../components/Footer"

export const metadata = {
  title: "Checkout complete | Sentinel Market",
  description: "Your Sentinel Market checkout is complete.",
}

export default function CheckoutSuccessPage() {
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

      <section className="success-state">
        <CheckCircle2 size={48} />
        <h1>Payment received</h1>
        <p>Your Medusa cart has been paid through Stripe and is queued for Sentinel Prime fulfillment.</p>
        <Link className="hero-link" href="/products">
          Back to products
        </Link>
      </section>

      <Footer />
    </main>
  )
}
