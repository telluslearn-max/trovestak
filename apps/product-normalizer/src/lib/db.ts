import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return client;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  normalized_name: string | null;
  name_normalized_at: string | null;
  name_normalization_reasoning: string | null;
}

export async function getUnprocessedProducts(limit: number = 50): Promise<Product[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('products')
    .select('id, name, slug, normalized_name, name_normalized_at, name_normalization_reasoning')
    .is('normalized_name', null)
    .eq('is_active', true)
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  return data || [];
}

export async function updateProductNormalization(
  productId: string,
  normalizedName: string,
  reasoning: string
): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('products')
    .update({
      normalized_name: normalizedName,
      name_normalized_at: new Date().toISOString(),
      name_normalization_reasoning: reasoning,
    })
    .eq('id', productId);

  if (error) {
    throw new Error(`Failed to update product ${productId}: ${error.message}`);
  }
}

export async function getProductsCount(): Promise<number> {
  const supabase = getSupabaseClient();
  
  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .is('normalized_name', null)
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to count products: ${error.message}`);
  }

  return count || 0;
}
