/**
 * CLI script to regenerate TTS audio for existing stories (without re-generating story text).
 *
 * Usage:
 *   npm run server:tts                    # Regenerate TTS for today's stories
 *   npm run server:tts -- 2026-03-01      # Specific date
 *   npm run server:tts -- --force         # Overwrite existing audio files
 *   npm run server:tts -- 2026-03-01 --force
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { config, validateConfig } from './config.js';
import { loadStories, saveStories, todayDate } from './store.js';
import { generateAudioForStory } from './tts.js';

const args = process.argv.slice(2);
const force = args.includes('--force');
const dateArg = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const targetDate = dateArg || todayDate();

async function removeExistingAudio(date: string): Promise<void> {
  const audioDir = path.join(config.dataDir, '..', 'audio', date);
  try {
    await fs.rm(audioDir, { recursive: true, force: true });
    console.log(`   🗑  Removed existing audio for ${date}`);
  } catch {
    // Directory doesn't exist, nothing to remove
  }
}

async function regenerateTts(): Promise<void> {
  validateConfig();

  if (!config.azureSpeechKey) {
    console.error('❌ AZURE_SPEECH_KEY is not set. Cannot generate TTS.');
    process.exit(1);
  }

  const data = await loadStories(targetDate);
  if (!data) {
    console.error(`❌ No stories found for ${targetDate}`);
    process.exit(1);
  }

  console.log(`\n🔊 Regenerating TTS audio for ${targetDate}`);
  if (force) {
    console.log('   --force: will overwrite existing audio files');
    await removeExistingAudio(targetDate);
  }

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const [themeId, locales] of Object.entries(data.stories)) {
    for (const [locale, story] of Object.entries(locales)) {
      // Skip if already has audio (unless --force)
      if (!force && story.audioUrls?.length) {
        skipped++;
        continue;
      }

      try {
        console.log(`   🔊 ${themeId} [${locale}] (${story.paragraphs.length} paragraphs)...`);
        story.audioUrls = await generateAudioForStory(
          story.id, story.paragraphs, locale, targetDate,
        );
        console.log(`   ✅ ${themeId} [${locale}] → ${story.audioUrls.length} files`);
        generated++;

        // Small delay between stories to respect rate limits
        await new Promise((r) => setTimeout(r, 1000));
      } catch (err) {
        console.error(`   ❌ ${themeId} [${locale}]:`, (err as Error).message);
        errors++;
      }
    }
  }

  // Save updated stories with audioUrls
  await saveStories(data);

  console.log(`\n🔊 Done: ${generated} generated, ${skipped} skipped, ${errors} errors\n`);
  process.exit(errors > 0 ? 1 : 0);
}

regenerateTts().catch((err) => {
  console.error('TTS regeneration failed:', err);
  process.exit(1);
});
