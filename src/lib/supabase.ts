import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL ?? process.env.PUBLIC_SUPABASE_URL;
const anon = import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? process.env.PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // eslint-disable-next-line no-console
  console.warn('[supabase] missing PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url ?? '', anon ?? '', {
  auth: { persistSession: false },
});

export type Product = {
  id: string;
  slug: string;
  name: string;
  price_pence: number;
  currency: string;
  image_url: string | null;
  description: string | null;
  notes: string | null;
  stock: number | null;
};

export type ContentEntry = {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  seo_description: string | null;
  published_at: string | null;
};
