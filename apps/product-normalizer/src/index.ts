import 'dotenv/config';
import { runNormalizationBatch, runContinuous } from './lib/processor.js';

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function main() {
  const args = process.argv.slice(2);
  const isContinuous = args.includes('--continuous') || args.includes('-c');
  const isOnce = args.includes('--once') || args.includes('-o');

  console.log('='.repeat(50));
  console.log('Product Name Normalization Worker');
  console.log('='.repeat(50));

  if (isOnce) {
    console.log('Running single batch...\n');
    await runNormalizationBatch();
    process.exit(0);
  }

  if (isContinuous) {
    await runContinuous(INTERVAL_MS);
    return;
  }

  // Default: run once
  console.log('Running single batch (use --continuous for continuous mode)...\n');
  await runNormalizationBatch();
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
