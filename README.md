# Candle Atelier

A dark, minimal Astro storefront for a hand-poured candle shop. Products live in Supabase, Stripe Checkout sessions are built dynamically from the database (no pre-made Stripe prices), and an order confirmation email fires on `checkout.session.completed`.

## Stack

- **Astro 6** (server output) + `@astrojs/vercel`
- **Tailwind v4** via `@tailwindcss/vite`
- **Supabase** for products / orders / content
- **Stripe** Checkout (dynamic pricing via `price_data`)
- **Resend** transactional email

## Data model

| Table | Purpose |
| --- | --- |
| `products` | name, slug, price_pence, currency, image_url, description, notes |
| `orders` | stripe_session_id, customer, amount, line_items (jsonb), shipping_address |
| `content` | editorial entries (reserved for future journal / CMS) |

Seed products (Forest Balm £22, Sea Salt £24, Amber Wood £26, Fig & Cedar £28) are inserted by the migration.

## Routes

- `/` — hero, collection grid, atelier story, candle care
- `/shop` — all products
- `/product/[slug]` — individual product + add-to-cart
- `/cart` — localStorage cart + proceed-to-Stripe
- `/success`, `/cancel` — post-checkout
- `/api/checkout` — creates Stripe session from cart
- `/api/stripe/webhook` — writes order + fires Resend email
- `/sitemap.xml`, `/robots.txt`

## Environment

Copy `.env.example` to `.env` and fill in:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY` (`sk_test_…` or `sk_live_…`)
- `STRIPE_WEBHOOK_SECRET` (`whsec_…` — set after registering the webhook)
- `RESEND_API_KEY`

## Local dev

```bash
npm install
npm run dev
```

## Deploy

Automatic via Vercel. The Stripe webhook is registered at:

```
https://<your-domain>/api/stripe/webhook
```

subscribing to `checkout.session.completed`.

## Harbor hook

The `content` table exists so Harbor can write long-form articles into this site without schema migrations. A single seed row is inserted at build time.
