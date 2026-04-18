import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { stripe, isStripeConfigured } from '../../lib/stripe';

export const prerender = false;

type Incoming = { id: string; quantity: number };

export const POST: APIRoute = async ({ request, url }) => {
  try {
    if (!isStripeConfigured()) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY on the server.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const body = (await request.json()) as { items?: Incoming[] };
    const items = body.items ?? [];
    if (items.length === 0) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), { status: 400 });
    }

    const ids = items.map((i) => i.id);
    const { data: products, error } = await supabase
      .from('products')
      .select('id, slug, name, price_pence, currency, image_url, description')
      .in('id', ids);

    if (error || !products || products.length === 0) {
      return new Response(JSON.stringify({ error: 'Products not found' }), { status: 404 });
    }

    // Build Stripe line_items dynamically from Supabase rows (price_data, not Stripe Price IDs)
    const lineItems = items
      .map((i) => {
        const p = products.find((pp) => pp.id === i.id);
        if (!p) return null;
        return {
          quantity: Math.max(1, Math.min(20, i.quantity)),
          price_data: {
            currency: (p.currency || 'gbp').toLowerCase(),
            unit_amount: p.price_pence,
            product_data: {
              name: p.name,
              description: p.description ?? undefined,
              images: p.image_url ? [p.image_url] : undefined,
              metadata: { product_id: p.id, slug: p.slug },
            },
          },
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));

    if (lineItems.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid items' }), { status: 400 });
    }

    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: ['GB', 'IE', 'FR', 'DE', 'US'] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            display_name: 'Standard shipping',
            fixed_amount: { amount: 400, currency: 'gbp' },
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 2 },
              maximum: { unit: 'business_day', value: 4 },
            },
          },
        },
      ],
      phone_number_collection: { enabled: false },
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
      metadata: {
        cart: JSON.stringify(items.map((i) => ({ id: i.id, qty: i.quantity }))),
      },
    });

    return new Response(JSON.stringify({ url: session.url, id: session.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[checkout] error', e);
    return new Response(JSON.stringify({ error: e?.message ?? 'Unknown error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
