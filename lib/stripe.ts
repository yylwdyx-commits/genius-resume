import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

// Named export kept for convenience — use getStripe() in route handlers
export const PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY ?? "",
  yearly: process.env.STRIPE_PRICE_YEARLY ?? "",
};
