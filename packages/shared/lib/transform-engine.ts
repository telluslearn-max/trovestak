// ============================================
// TRANSFORM ENGINE
// CSV to JSON transformation for product import
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectVariants, generateShortName, generateSlug, extractColors, extractStorage, extractSize, extractRAM, extractChip } from './variant-detector';
import { generateSEOTitle, generateSEODescription, generateOverview, generateSubtitle, generateBreadcrumb } from './seo-generator';
import { generateSpecs, getAddonEligibility, getDefaultWarranty } from './spec-generator';
import { generateFeatures, generateFAQ } from './content-generator';
import type { ProductInput, ProductFeature, FAQItem } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSV Parser
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return '"' + field.replace(/"/g, '""') + '"';
  }
  return field;
}

// Main transform function
export function transformProduct(csvRow: string[], header: string[]): ProductInput | null {
  if (csvRow.length < header.length) {
    console.warn('Row has fewer columns than header, skipping...');
    return null;
  }
  
  const row: Record<string, string> = {};
  header.forEach((col, index) => {
    row[col] = csvRow[index] || '';
  });
  
  const name = row['name'] || '';
  if (!name) return null;
  
  // Extract fields from CSV
  const navCategory = row['nav_category'] || '';
  const navSubcategory = row['nav_subcategory'] || '';
  const brandType = row['brand_type'] || '';
  const description = row['description'] || '';
  
  // Detect category from nav_category or product name
  const category = getCategoryFromNav(navCategory, name);
  const subcategory = navSubcategory || getSubcategoryFromName(name);
  
  // Generate variants
  const detectedVariants = detectVariants(name);
  const colors = extractColors(name);
  const storage = extractStorage(name);
  const size = extractSize(name);
  const ram = extractRAM(name);
  const chip = extractChip(name);
  
  // Generate product fields
  const shortName = generateShortName(name);
  const slug = generateSlug(name);
  const subtitle = generateSubtitle(name, brandType);
  
  // Extract brand from brand_type
  const brand = brandType.split(' · ')[0].trim() || name.split(' ')[0];
  
  // Generate content
  const overview = description || generateOverview(name, brand, category);
  const features = generateFeatures(name, brand, category, subcategory);
  const specs = generateSpecs(name, category, subcategory);
  const faq = generateFAQ(name, brand, category);
  
  // Generate SEO
  const seoTitle = generateSEOTitle(name, 'Premium Quality');
  const seoDescription = generateSEODescription(name, [
    'Genuine product',
    '1 Year warranty',
    'Free delivery'
  ]);
  
  // Generate breadcrumb
  const breadcrumb = generateBreadcrumb(navCategory, navSubcategory, name);
  
  // Determine warranty
  const warranty = getDefaultWarranty(category);
  
  // Determine badge
  const badge = determineBadge(name);
  
  // Build variants object
  const variants: ProductInput['variants'] = {
    colors: colors.map(c => ({ name: c.name, hex: c.hex, hex2: c.hex2 })),
    sizes: size ? [size] : [],
    tiers: []
  };
  
  // Add storage as tiers if detected
  if (storage.length > 0) {
    storage.forEach((s, index) => {
      variants.tiers!.push({
        label: s,
        desc: `${ram || '8GB'} RAM / ${s} Storage`,
        price: 0, // Will be set during pricing
        is_default: index === 0
      });
    });
  }
  
  // Determine addons eligibility
  const addons = getAddonEligibility(0, category, subcategory);
  
  // Build product input
  const productInput: ProductInput = {
    product: {
      name,
      short_name: shortName,
      subtitle,
      category,
      subcategory,
      brand_type: brandType || brand,
      badge,
      warranty
    },
    pricing: {
      cost_price: 0, // Will be set from supplier data
      sell_price: 0, // Will be calculated or set
      discount_percent: 0,
      compare_price: undefined,
      currency: 'KES'
    },
    availability: 'in_stock',
    variants,
    addons: {
      bnpl: addons.bnpl,
      trade_in: addons.trade_in,
      shipping: addons.shipping,
      same_day_available: addons.same_day,
      insurance: addons.insurance
    },
    content: {
      overview,
      features,
      specs,
      faq
    },
    breadcrumb
  };
  
  return productInput;
}

function getCategoryFromNav(navCategory: string, productName: string): string {
  const categoryMap: Record<string, string> = {
    'Mobile': 'mobile',
    'Computing': 'computing',
    'Audio': 'audio',
    'Wearables': 'wearables',
    'Gaming': 'gaming',
    'Cameras': 'cameras',
    'Smart Home': 'smart-home',
    'Software': 'software'
  };
  
  if (navCategory && categoryMap[navCategory]) {
    return categoryMap[navCategory];
  }
  
  // Fallback: detect from product name
  const lowerName = productName.toLowerCase();
  
  if (lowerName.includes('phone') || lowerName.includes('iphone') || 
      lowerName.includes('galaxy') || lowerName.includes('pixel')) {
    return 'mobile';
  }
  
  if (lowerName.includes('macbook') || lowerName.includes('laptop') || 
      lowerName.includes('computer') || lowerName.includes('monitor')) {
    return 'computing';
  }
  
  if (lowerName.includes('airpod') || lowerName.includes('earbud') || 
      lowerName.includes('headphone') || lowerName.includes('speaker') || 
      lowerName.includes('jbl') || lowerName.includes('bose')) {
    return 'audio';
  }
  
  if (lowerName.includes('watch') || lowerName.includes('fitness')) {
    return 'wearables';
  }
  
  if (lowerName.includes('gaming') || lowerName.includes('playstation') || 
      lowerName.includes('xbox') || lowerName.includes('nintendo')) {
    return 'gaming';
  }
  
  if (lowerName.includes('camera') || lowerName.includes('drone') || 
      lowerName.includes('gimbal')) {
    return 'cameras';
  }
  
  if (lowerName.includes('tv') || lowerName.includes('smart') || 
      lowerName.includes('home')) {
    return 'smart-home';
  }
  
  return 'computing'; // default
}

function getSubcategoryFromName(productName: string): string {
  const lowerName = productName.toLowerCase();
  
  // Mobile
  if (lowerName.includes('pro max') || lowerName.includes('ultra')) return 'flagship-phones';
  if (lowerName.includes('pro') || lowerName.includes('plus')) return 'mid-range-phones';
  if (lowerName.includes('se') || lowerName.includes('mini')) return 'budget-phones';
  if (lowerName.includes('ipad')) return 'ipad';
  if (lowerName.includes('tablet')) return 'android-tablets';
  
  // Audio
  if (lowerName.includes('earbud') || lowerName.includes('airpod')) return 'wireless-earbuds';
  if (lowerName.includes('headphone') || lowerName.includes('wh-')) return 'over-ear-headphones';
  if (lowerName.includes('speaker') || lowerName.includes('jbl')) return 'bluetooth-speakers';
  if (lowerName.includes('soundbar')) return 'soundbars';
  
  // Computing
  if (lowerName.includes('macbook')) return 'macbooks';
  if (lowerName.includes('laptop') || lowerName.includes('notebook')) return 'windows-laptops';
  if (lowerName.includes('monitor') || lowerName.includes('display')) return 'monitors';
  if (lowerName.includes('keyboard') || lowerName.includes('mouse') || lowerName.includes('webcam')) return 'peripherals';
  if (lowerName.includes('router') || lowerName.includes('switch') || lowerName.includes('network')) return 'networking';
  if (lowerName.includes('printer') || lowerName.includes('scanner')) return 'printers';
  if (lowerName.includes('ssd') || lowerName.includes('hdd') || lowerName.includes('storage')) return 'storage';
  if (lowerName.includes('ups') || lowerName.includes('back-ups')) return 'power-ups';
  
  // Wearables
  if (lowerName.includes('apple watch')) return 'apple-watch';
  if (lowerName.includes('galaxy watch')) return 'samsung-watch';
  if (lowerName.includes('fitness') || lowerName.includes('fitness band')) return 'fitness-trackers';
  
  // Gaming
  if (lowerName.includes('ps5') || lowerName.includes('playstation')) return 'playstation';
  if (lowerName.includes('xbox')) return 'xbox';
  if (lowerName.includes('nintendo') || lowerName.includes('switch')) return 'nintendo-switch';
  if (lowerName.includes('controller') || lowerName.includes('headset') || lowerName.includes('gaming')) return 'gaming-gear';
  
  // Cameras
  if (lowerName.includes('drone')) return 'drones-gimbals';
  if (lowerName.includes('gimbal')) return 'drones-gimbals';
  if (lowerName.includes('action camera') || lowerName.includes('gopro')) return 'action-cameras';
  if (lowerName.includes('microphone') || lowerName.includes('mic')) return 'microphones';
  
  // Smart Home
  if (lowerName.includes('tv') || lowerName.includes('television')) return 'smart-tvs';
  if (lowerName.includes('light') || lowerName.includes('bulb')) return 'smart-lights';
  if (lowerName.includes('appliance') || lowerName.includes('fridge') || lowerName.includes('washer')) return 'home-appliances';
  
  return '';
}

function determineBadge(productName: string): string | undefined {
  const lowerName = productName.toLowerCase();
  
  if (lowerName.includes('2025') || lowerName.includes('2024')) {
    return 'New';
  }
  
  if (lowerName.includes('pro max') || lowerName.includes('ultra') || lowerName.includes('pro')) {
    return 'Best Seller';
  }
  
  return undefined;
}

// Process CSV file
export async function processCSV(
  inputPath: string, 
  outputDir: string,
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  // Read CSV file
  const csvContent = fs.readFileSync(inputPath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows');
  }
  
  // Parse header
  const header = parseCSVLine(lines[0]);
  console.log('CSV Header:', header.join(', '));
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  let success = 0;
  let failed = 0;
  
  // Process each row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const columns = parseCSVLine(line);
      const product = transformProduct(columns, header);
      
      if (product) {
        // Determine output path based on category
        const category = product.product.category;
        const categoryDir = path.join(outputDir, category);
        
        if (!fs.existsSync(categoryDir)) {
          fs.mkdirSync(categoryDir, { recursive: true });
        }
        
        // Generate filename from slug
        const slug = generateSlug(product.product.name);
        const outputPath = path.join(categoryDir, `${slug}.json`);
        
        // Write JSON file
        fs.writeFileSync(outputPath, JSON.stringify(product, null, 2), 'utf8');
        success++;
        
        if (onProgress) {
          onProgress(i, lines.length - 1);
        }
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Error processing row ${i}:`, error);
      failed++;
    }
  }
  
  return { success, failed };
}

// Generate index file
export function generateIndex(outputDir: string): void {
  const categories: Record<string, string[]> = {};
  
  // Read all JSON files and categorize
  function walkDir(dir: string): void {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!categories[item]) {
          categories[item] = [];
        }
        
        // Add files from this category
        const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.json'));
        categories[item].push(...files);
      }
    }
  }
  
  walkDir(outputDir);
  
  // Write index
  const indexPath = path.join(outputDir, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(categories, null, 2), 'utf8');
  
  console.log('Index generated:', indexPath);
  console.log('Categories:', Object.keys(categories).join(', '));
}

// CLI usage
async function main() {
  // Default paths - adjust these for your environment
  const basePath = 'C:/Users/Administrator/Documents/ANTIGRAVITY/tellus';
  const inputPath = process.argv[2] || path.join(basePath, 'Suppliers/products_final_normalized.csv');
  const outputDir = process.argv[3] || path.join(basePath, 'Suppliers/json-output');
  
  console.log('Transforming CSV to JSON...');
  console.log('Input:', inputPath);
  console.log('Output:', outputDir);
  
  const result = await processCSV(inputPath, outputDir, (current, total) => {
    if (current % 50 === 0 || current === total) {
      console.log(`Progress: ${current}/${total}`);
    }
  });
  
  console.log(`\nTransform complete!`);
  console.log(`Success: ${result.success}`);
  console.log(`Failed: ${result.failed}`);
  
  // Generate index
  generateIndex(outputDir);
}

// Run if called directly
if (process.argv[1] === __filename) {
  main().catch(console.error);
}
