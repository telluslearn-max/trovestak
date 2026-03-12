import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface ProductRow {
  name: string;
  slug: string;
  description: string;
  short_description: string;
  brand_type: string;
  warranty: string;
  badge?: string;
  nav_category: string;
  nav_subcategory: string;
  thumbnail_url: string;
  gallery_urls: string;
  type: string;
  sku: string;
  is_featured: string;
  is_active: string;
  availability: string;
  cost_price: string;
  sell_price: string;
  compare_price?: string;
  discount_percent: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  variants_json: string;
  specs_json: string;
  content_json: string;
  addons_json: string;
}

interface Variant {
  name: string;
  sku: string;
  price_kes: number;
  cost_price: number;
  stock_quantity: number;
  options: Record<string, unknown>;
}

interface Addon {
  addon_type: string;
  is_enabled: boolean;
  config: Record<string, unknown>;
}

function parseCSV(content: string): ProductRow[] {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  const rows: ProductRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.replace(/^"|"$/g, '') || '';
    });
    
    rows.push(row as unknown as ProductRow);
  }
  
  return rows;
}

function parseJSON<T>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString.replace(/""/g, '"'));
  } catch {
    return null;
  }
}

async function importProduct(row: ProductRow): Promise<{ success: boolean; error?: string; productId?: string }> {
  try {
    console.log(`\n📦 Importing: ${row.name}`);
    
    const slug = row.slug || row.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const productData = {
      name: row.name,
      slug,
      description: row.description,
      short_description: row.short_description,
      brand_type: row.brand_type,
      warranty: row.warranty || '1 Year',
      badge: row.badge || null,
      nav_category: row.nav_category,
      nav_subcategory: row.nav_subcategory,
      thumbnail_url: row.thumbnail_url,
      gallery_urls: parseJSON<string[]>(row.gallery_urls) || [],
      type: row.type || 'simple',
      sku: row.sku,
      is_featured: row.is_featured === 'true',
      is_active: row.is_active === 'true',
      availability: row.availability || 'in_stock',
      seo_title: row.seo_title,
      seo_description: row.seo_description,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('sku', row.sku)
      .single();

    let productId: string;

    if (existingProduct) {
      console.log(`  🔄 Updating existing product: ${existingProduct.id}`);
      await supabase
        .from('products')
        .update(productData)
        .eq('id', existingProduct.id);
      productId = existingProduct.id;
    } else {
      console.log(`  ➕ Creating new product...`);
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select('id')
        .single();
      
      if (productError) throw productError;
      productId = product!.id;
    }

    console.log(`  ✅ Product created: ${productId}`);

    const sellPrice = parseInt(row.sell_price) || 0;
    const costPrice = parseInt(row.cost_price) || 0;
    const comparePrice = row.compare_price ? parseInt(row.compare_price) : null;
    const discountPercent = row.discount_percent ? parseInt(row.discount_percent) : 0;

    console.log(`  💰 Importing pricing: KES ${sellPrice.toLocaleString()}`);
    const { error: pricingError } = await supabase
      .from('product_pricing')
      .upsert({
        product_id: productId,
        cost_price: costPrice,
        sell_price: sellPrice,
        compare_price: comparePrice,
        discount_percent: discountPercent,
        currency: 'KES',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'product_id' });

    if (pricingError) {
      console.error(`  ⚠️  Pricing error: ${pricingError.message}`);
    }

    const variants = parseJSON<Variant[]>(row.variants_json);
    if (variants && variants.length > 0) {
      console.log(`  📋 Importing ${variants.length} variants...`);
      
      for (const variant of variants) {
        const variantData = {
          product_id: productId,
          name: variant.name,
          sku: variant.sku,
          price_kes: variant.price_kes,
          stock_quantity: variant.stock_quantity,
          options: variant.options || {},
          updated_at: new Date().toISOString(),
        };

        if (variant.sku) {
          const { data: existingVariant } = await supabase
            .from('product_variants')
            .select('id')
            .eq('sku', variant.sku)
            .single();

          if (existingVariant) {
            await supabase
              .from('product_variants')
              .update(variantData)
              .eq('id', existingVariant.id);
          } else {
            await supabase
              .from('product_variants')
              .insert(variantData);
          }
        } else {
          await supabase
            .from('product_variants')
            .insert(variantData);
        }
      }
      console.log(`  ✅ Variants imported`);
    }

    const specs = parseJSON<Record<string, Record<string, string>>>(row.specs_json);
    if (specs) {
      console.log(`  📊 Importing specs...`);
      const { error: specsError } = await supabase
        .from('product_specs')
        .upsert({
          product_id: productId,
          spec_data: specs,
          spec_category: 'technical',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'product_id' });

      if (specsError) {
        console.error(`  ⚠️  Specs error: ${specsError.message}`);
      }
    }

    const content = parseJSON<{
      overview?: string;
      features?: Array<{ title: string; items: string[] }>;
      highlights?: Array<{ key: string; value: string }>;
      faq?: Array<{ question: string; answer: string }>;
    }>(row.content_json);

    if (content) {
      console.log(`  📝 Importing content...`);
      const { error: contentError } = await supabase
        .from('product_content')
        .upsert({
          product_id: productId,
          overview: content.overview || '',
          features: content.features || [],
          highlights: content.highlights || [],
          faq: content.faq || [],
          gallery: parseJSON<string[]>(row.gallery_urls) || [],
          updated_at: new Date().toISOString(),
        }, { onConflict: 'product_id' });

      if (contentError) {
        console.error(`  ⚠️  Content error: ${contentError.message}`);
      }
    }

    const addons = parseJSON<Addon[]>(row.addons_json);
    if (addons && addons.length > 0) {
      console.log(`  🔌 Importing ${addons.length} addons...`);
      
      for (const addon of addons) {
        await supabase
          .from('product_addons')
          .upsert({
            product_id: productId,
            addon_type: addon.addon_type,
            is_enabled: addon.is_enabled,
            config: addon.config,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'product_id,addon_type' });
      }
      console.log(`  ✅ Addons imported`);
    }

    console.log(`  🎉 ${row.name} imported successfully!`);
    return { success: true, productId };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`  ❌ Error: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

async function main() {
  const args = process.argv.slice(2);
  let filePath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      filePath = args[i + 1];
    }
  }

  if (!filePath) {
    console.log('\n📋 Usage: pnpm db-importer import-full --file <path-to-csv>');
    console.log('\n📁 Example: pnpm db-importer import-full --file ./src/templates/categories/mobile.csv\n');
    
    const templatesDir = path.join(process.cwd(), 'apps', 'storefront', 'src', 'templates', 'categories');
    if (fs.existsSync(templatesDir)) {
      const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.csv'));
      console.log('Available templates:');
      files.forEach(f => console.log(`  - ${f}`));
    }
    process.exit(1);
  }

  const fullPath = path.isAbsolute(filePath) 
    ? filePath 
    : path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File not found: ${fullPath}`);
    process.exit(1);
  }

  console.log(`\n🚀 Starting import from: ${fullPath}`);
  console.log('='.repeat(50));

  const content = fs.readFileSync(fullPath, 'utf-8');
  const rows = parseCSV(content);

  console.log(`\n📊 Found ${rows.length} product(s) to import`);

  let successCount = 0;
  let failCount = 0;

  for (const row of rows) {
    const result = await importProduct(row);
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\n📈 Import Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📦 Total: ${rows.length}`);
  
  process.exit(failCount > 0 ? 1 : 0);
}

main();
