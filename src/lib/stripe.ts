import Stripe from 'stripe';

const key = import.meta.env.STRIPE_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY ?? '';

export const stripe = new Stripe(key, {
  apiVersion: '2024-12-18.acacia' as any,
  appInfo: { name: 'Candle Atelier', version: '1.0.0' },
});

export const isStripeConfigured = () => Boolean(key && key.startsWith('sk_'));
