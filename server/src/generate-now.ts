/**
 * CLI script to manually trigger story generation.
 * Usage: npm run generate          (generates for today)
 *        npx tsx src/generate-now.ts 2026-03-05  (specific date)
 */
import { generateDaily } from './generate.js';

const date = process.argv[2]; // optional YYYY-MM-DD

generateDaily(date || undefined)
  .then((result) => {
    console.log('Result:', result);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Generation failed:', err);
    process.exit(1);
  });
