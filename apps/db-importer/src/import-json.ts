import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || 'https://lgxqlgyciazmlllowhel.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneHFsZ3ljaWF6bWxsbG93aGVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUyMzgzOCwiZXhwIjoyMDg3MDk5ODM4fQ.7YxdKcZg-ykkfEW6-NrOa4wxSRUNpOAwbVIO0FDKs9M';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const JSON_OUTPUT_DIR = 'C:/Users/Administrator/Documents/ANTIGRAVITY/tellus/Suppliers/json-output';

interface ProductJSON {
  product: {
    name: string;
    short_name?: string;
    subtitle?: string;
    category: string;
    subcategory: string;
    brand_type?: string;
    badge?: string;
    warranty?: string;
  };
  pricing: {
    cost_price: number;
    sell_price: number;
    discount_percent?: number;
    compare_price?: number;
  };
  content: {
    overview?: string;
    features?: any[];
    specs?: any;
    faq?: any[];
  };
}

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function importProducts() {
  console.log('Starting product import...\n');
  
  // Get all JSON files
  const categories = ['mobile', 'computing', 'audio', 'wearables', 'gaming', 'cameras', 'smart-home', 'software'];
  
  let totalImported = 0;
  let totalFailed = 0;
  
  for (const category of categories) {
    const categoryPath = path.join(JSON_OUTPUT_DIR, category);
    
    if (!fs.existsSync(categoryPath)) {
      console.log(`Skipping ${category} - directory not found`);
      continue;
    }
    
    const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.json'));
    console.log(`\n=== ${category}: ${files.length} products ===`);
    
    for (const file of files) {
      try {
        const filePath = path.join(categoryPath, file);
        const jsonData: ProductJSON = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        const slug = generateSlug(jsonData.product.name);
        
        // Check if product exists
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('slug', slug)
          .single();
        
        if (existing) {
          console.log(`  SKIP: ${jsonData.product.name} (already exists)`);
          continue;
        }
        
        // Insert product
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert({
            name: jsonData.product.name,
            slug: slug,
            short_name: jsonData.product.short_name || jsonData.product.name.substring(0, 30),
            subtitle: jsonData.product.subtitle || '',
            description: jsonData.content.overview || '',
            nav_category: jsonData.product.category,
            nav_subcategory: jsonData.product.subcategory,
            brand_type: jsonData.product.brand_type || '',
            badge: jsonData.product.badge || '',
            warranty: jsonData.product.warranty || '1 Year',
            availability: 'in_stock',
            seo_title: `${jsonData.product.name} | Trovestak Kenya`,
            seo_description: jsonData.content.overview?.substring(0, 160) || '',
            is_active: true
          })
          .select()
          .single();
        
        if (productError) {
          console.log(`  ERROR: ${jsonData.product.name} - ${productError.message}`);
          totalFailed++;
          continue;
        }
        
        // Insert pricing
        await supabase.from('product_pricing').insert({
          product_id: product.id,
          cost_price: jsonData.pricing.cost_price || 0,
          sell_price: jsonData.pricing.sell_price || 0,
          discount_percent: jsonData.pricing.discount_percent || 0,
          compare_price: jsonData.pricing.compare_price,
          currency: 'KES'
        });
        
        // Insert specs
        if (jsonData.content.specs) {
          await supabase.from('product_specs').insert({
            product_id: product.id,
            spec_data: jsonData.content.specs
          });
        }
        
        // Insert content
        await supabase.from('product_content').insert({
          product_id: product.id,
          overview: jsonData.content.overview || '',
          features: jsonData.content.features || [],
          faq: jsonData.content.faq || []
        });
        
        // Insert default addons
        const addons = [
          { product_id: product.id, addon_type: 'bnpl', is_enabled: jsonData.pricing.sell_price >= 15000 },
          { product_id: product.id, addon_type: 'trade_in', is_enabled: true },
          { product_id: product.id, addon_type: 'shipping', is_enabled: true },
          { product_id: product.id, addon_type: 'insurance', is_enabled: jsonData.pricing.sell_price >= 10000 }
        ];
        
        await supabase.from('product_addons').insert(addons);
        
        totalImported++;
        console.log(`  OK: ${jsonData.product.name}`);
        
      } catch (err: any) {
        console.log(`  ERROR: ${file} - ${err.message}`);
        totalFailed++;
      }
    }
  }
  
  console.log(`\n=== Import Complete ===`);
  console.log(`Imported: ${totalImported}`);
  console.log(`Failed: ${totalFailed}`);
}

importProducts().catch(console.error);
