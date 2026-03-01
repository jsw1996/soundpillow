import { config } from './config.js';
import { THEMES } from './themes.js';
import { upsertStory, loadStories, todayDate } from './store.js';
import { generateAudioForStory } from './tts.js';
import type { SleepcastTheme, GeneratedSleepcast } from './types.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'arcee-ai/trinity-large-preview:free';

const SYSTEM_PROMPT = `You are a master storyteller creating bedtime stories for a sleep app called SoundPillow. Your stories are designed to gently guide listeners into deep, peaceful sleep.

Rules:
- Write in second person ("you"), present tense, to immerse the listener
- Keep the tone warm, gentle, and deeply calming — like a whispered bedtime story
- Use rich sensory descriptions: textures, warmth, sounds, scents, soft light
- Pace slows progressively — sentences get shorter and more spacious toward the end
- NO conflict, tension, excitement, or sudden events
- NO questions to the reader
- Include natural pauses (use "..." for breathing moments)
- End with the listener drifting into sleep
- Story should be 600-800 words (roughly 5-7 minutes when read slowly)
- Write in the language requested
- Split into 6-8 natural paragraphs
- Each story must be UNIQUE — never repeat the same plot, imagery or structure`;

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  zh: 'Chinese (Simplified)',
  ja: 'Japanese',
  es: 'Spanish',
};

function buildUserPrompt(theme: SleepcastTheme, locale: string, date: string): string {
  const langName = LANG_NAMES[locale] || 'English';
  return `Write a bedtime sleepcast story in ${langName} based on this scene:

"${theme.prompt}"

Today's date is ${date}. Use this to subtly inspire seasonal or temporal details (time of year, weather, mood) to make each day's story feel fresh and unique.

Create a soothing, immersive story titled with a poetic name that fits the scene. The story should make the listener feel safe, warm, and drowsy.`;
}

function parseStoryText(text: string, theme: SleepcastTheme): GeneratedSleepcast {
  const lines = text.split('\n').filter((l) => l.trim());
  let title = theme.name;
  let storyLines = lines;

  if (lines.length > 1) {
    const firstLine = lines[0].replace(/^#+\s*/, '').replace(/[*"]/g, '').trim();
    if (firstLine.length < 80) {
      title = firstLine;
      storyLines = lines.slice(1);
    }
  }

  const story = storyLines.join('\n');
  const paragraphs = story
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const finalParagraphs = paragraphs.length >= 3
    ? paragraphs
    : splitIntoChunks(story, 6);

  return {
    id: `sleepcast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    themeId: theme.id,
    title,
    story,
    paragraphs: finalParagraphs,
    createdAt: Date.now(),
  };
}

function splitIntoChunks(text: string, count: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];
  const perChunk = Math.ceil(sentences.length / count);
  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += perChunk) {
    chunks.push(sentences.slice(i, i + perChunk).join('').trim());
  }
  return chunks.filter((c) => c.length > 0);
}

/** Generate a single story for one theme + locale */
async function generateOne(
  theme: SleepcastTheme,
  locale: string,
  date: string,
): Promise<GeneratedSleepcast> {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.openRouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://soundpillow.app',
      'X-OpenRouter-Title': 'SoundPillow',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(theme, locale, date) },
      ],
      temperature: 0.85,
      max_tokens: 2048,
      top_p: 0.95,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => 'Unknown error');
    throw new Error(`OpenRouter API error (${response.status}): ${err}`);
  }

  const json = await response.json() as {
    choices?: { message?: { content?: string } }[];
  };

  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Empty response from AI');

  return parseStoryText(content, theme);
}

/**
 * Generate all stories for a given date.
 * Skips theme/locale combos that already exist (idempotent).
 */
export async function generateDaily(date?: string): Promise<{ generated: number; skipped: number; errors: number }> {
  const targetDate = date || todayDate();
  const existing = await loadStories(targetDate);
  const locales = config.locales;

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  console.log(`\n🌙 Generating stories for ${targetDate}`);
  console.log(`   Themes: ${THEMES.length}, Locales: ${locales.join(', ')}`);
  console.log(`   Total: ${THEMES.length * locales.length} stories\n`);

  for (const theme of THEMES) {
    for (const locale of locales) {
      const existingStory = existing?.stories[theme.id]?.[locale];

      // If story exists but is missing audio, backfill TTS only
      if (existingStory && !existingStory.audioUrls?.length && config.azureSpeechKey) {
        try {
          console.log(`   🔊 Backfilling TTS for ${theme.name} [${locale}]...`);
          existingStory.audioUrls = await generateAudioForStory(
            existingStory.id, existingStory.paragraphs, locale, targetDate,
          );
          await upsertStory(targetDate, theme.id, locale, existingStory);
          console.log(`   🔊 TTS backfill complete (${existingStory.audioUrls.length} files)`);
          generated++;
        } catch (ttsErr) {
          console.error(`   ⚠️  TTS backfill failed for ${theme.name} [${locale}]:`, (ttsErr as Error).message);
          errors++;
        }
        continue;
      }

      // Skip if already fully generated (story + audio)
      if (existingStory) {
        skipped++;
        continue;
      }

      try {
        console.log(`   ✍️  ${theme.name} [${locale}]...`);
        const story = await generateOne(theme, locale, targetDate);

        // Generate TTS audio for each paragraph
        if (config.azureSpeechKey) {
          try {
            console.log(`      🔊 Generating TTS audio...`);
            story.audioUrls = await generateAudioForStory(
              story.id, story.paragraphs, locale, targetDate,
            );
            console.log(`      🔊 TTS complete (${story.audioUrls.length} files)`);
          } catch (ttsErr) {
            console.error(`      ⚠️  TTS failed (story saved without audio):`, (ttsErr as Error).message);
          }
        }

        await upsertStory(targetDate, theme.id, locale, story);
        console.log(`   ✅ ${theme.name} [${locale}] → "${story.title}"`);
        generated++;

        // Small delay between requests to be polite to the API
        await new Promise((r) => setTimeout(r, 2000));
      } catch (err) {
        console.error(`   ❌ ${theme.name} [${locale}]:`, (err as Error).message);
        errors++;
      }
    }
  }

  console.log(`\n🌙 Done: ${generated} generated, ${skipped} skipped, ${errors} errors\n`);
  return { generated, skipped, errors };
}
