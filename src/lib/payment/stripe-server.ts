import Stripe from "stripe"

import { STRIPE_API_VERSION } from "./constants"

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY não configurada")
    }
    if (process.env.NODE_ENV === "production" && !secretKey.startsWith("sk_live_")) {
      throw new Error("Produção requer chave live (sk_live_*)")
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: STRIPE_API_VERSION as any,
      typescript: true,
    })
  }
  return stripeInstance
}
