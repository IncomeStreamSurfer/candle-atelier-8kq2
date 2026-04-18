import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ site }) => {
  const base = (site ?? new URL('https://candle-atelier.vercel.app')).toString().replace(/\/$/, '');
  const { data: products } = await supabase.from('products').select('slug');

  const urls = [
    '',
    '/shop',
    '/cart',
    ...((products ?? []).map((p) => `/product/${p.slug}`)),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${base}${u}</loc></url>`).join('\n')}
</urlset>`;

  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
