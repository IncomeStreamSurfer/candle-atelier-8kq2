import type { APIRoute } from 'astro';
import { stripe } from '../../../lib/stripe';
import { supabase } from '../../../lib/supabase';
import { sendOrderConfirmation } from '../../../lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const sig = request.headers.get('stripe-signature');
  const secret = import.meta.env.STRIPE_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    console.error('[webhook] missing signature or secret');
    return new Response('missing signature', { status: 400 });
  }

  const raw = await request.text();
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (e: any) {
    console.error('[webhook] signature verification failed', e?.message);
    return new Response(`bad signature: ${e?.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;

    // Fetch line items
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100, expand: ['data.price.product'] });
    const items = lineItems.data.map((li: any) => ({
      name: li.description ?? li.price?.product?.name ?? 'Item',
      quantity: li.quantity ?? 1,
      amount_pence: li.amount_total ?? 0,
    }));

    const { data: inserted, error } = await supabase
      .from('orders')
      .insert({
        stripe_session_id: session.id,
        stripe_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        customer_email: session.customer_details?.email ?? session.customer_email ?? null,
        customer_name: session.customer_details?.name ?? null,
        amount_total_pence: session.amount_total ?? 0,
        currency: session.currency ?? 'gbp',
        line_items: items,
        shipping_address: session.shipping_details ?? session.customer_details?.address ?? null,
        status: 'paid',
      })
      .select()
      .single();

    if (error) {
      console.error('[webhook] supabase insert failed', error);
      return new Response('db error', { status: 500 });
    }

    const email = session.customer_details?.email ?? session.customer_email;
    if (email && inserted) {
      try {
        await sendOrderConfirmation({
          to: email,
          name: session.customer_details?.name ?? null,
          orderId: inserted.id,
          amountPence: session.amount_total ?? 0,
          currency: session.currency ?? 'gbp',
          lineItems: items,
        });
      } catch (e) {
        console.error('[webhook] resend send failed', e);
      }
    }
  }

  return new Response('ok', { status: 200 });
};
