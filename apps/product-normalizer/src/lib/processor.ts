import { 
  getUnprocessedProducts, 
  updateProductNormalization, 
  getProductsCount,
  Product 
} from './db.js';
import { normalizeProductName, NormalizationResult } from './gemini.js';

const BATCH_SIZE = 50;
const DELAY_BETWEEN_REQUESTS = 200; // ms - rate limiting

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processProduct(product: Product): Promise<void> {
  console.log(`Processing: "${product.name}" (ID: ${product.id})`);

  const result: NormalizationResult = await normalizeProductName(product.name);
  
  await updateProductNormalization(
    product.id,
    result.normalizedName,
    result.reasoning
  );

  if (result.isShorthand) {
    console.log(`  ✓ "${product.name}" → "${result.normalizedName}" (shorthand detected)`);
  } else {
    console.log(`  ✓ "${product.name}" (already official)`);
  }
}

export async function runNormalizationBatch(): Promise<{
  processed: number;
  remaining: number;
}> {
  console.log(`\n[${new Date().toISOString()}] Fetching products to normalize...`);
  
  const products = await getUnprocessedProducts(BATCH_SIZE);
  
  if (products.length === 0) {
    console.log('No products to process.');
    const remaining = await getProductsCount();
    return { processed: 0, remaining };
  }

  console.log(`Found ${products.length} products to process`);

  let processed = 0;
  let shorthandCount = 0;

  for (const product of products) {
    try {
      await processProduct(product);
      processed++;
      
      if (processed < products.length) {
        await delay(DELAY_BETWEEN_REQUESTS);
      }
    } catch (error) {
      console.error(`  ✗ Failed to process product ${product.id}:`, error);
    }
  }

  const remaining = await getProductsCount();
  console.log(`\nBatch complete: ${processed} processed, ${remaining} remaining`);

  return { processed, remaining };
}

export async function runContinuous(intervalMs: number = 5 * 60 * 1000): Promise<void> {
  console.log(`Starting continuous normalization (interval: ${intervalMs}ms)`);
  console.log('Press Ctrl+C to stop\n');

  // Initial run
  await runNormalizationBatch();

  // Set interval for subsequent runs
  setInterval(async () => {
    try {
      await runNormalizationBatch();
    } catch (error) {
      console.error('Batch error:', error);
    }
  }, intervalMs);
}
