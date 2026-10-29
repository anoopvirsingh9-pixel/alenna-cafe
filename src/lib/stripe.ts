import Stripe from "stripe";

/**
 * Stripe is only initialised when the secret key is present.
 * Until the keys are added in hosting, `getStripe()` returns null and the
 * checkout shows a friendly "payments finishing setup" state.
 */
let cached: Stripe | null = null;

export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!cached) {
    cached = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return cached;
}
