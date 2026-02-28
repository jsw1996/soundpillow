import type { SleepcastTheme, GeneratedSleepcast } from '../types';

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
- Split into 6-8 natural paragraphs`;

function getApiKey(): string {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY
    || (window as unknown as Record<string, unknown>).OPENROUTER_API_KEY
    || '';
  return key as string;
}

export function isGeminiConfigured(): boolean {
  return !!getApiKey();
}

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  zh: 'Chinese (Simplified)',
  ja: 'Japanese',
  es: 'Spanish',
};

function buildUserPrompt(theme: SleepcastTheme, locale: string): string {
  const langName = LANG_NAMES[locale] || 'English';
  return `Write a bedtime sleepcast story in ${langName} based on this scene:

"${theme.prompt}"

Create a soothing, immersive story titled with a poetic name that fits the scene. The story should make the listener feel safe, warm, and drowsy.`;
}

/**
 * Parse raw story text into a GeneratedSleepcast object.
 */
export function parseStoryText(text: string, theme: SleepcastTheme): GeneratedSleepcast {
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
    id: `sleepcast-${Date.now()}`,
    themeId: theme.id,
    title,
    story,
    paragraphs: finalParagraphs,
    createdAt: Date.now(),
  };
}

/**
 * Stream a sleepcast story from OpenRouter via SSE.
 * Calls `onChunk` with accumulated text as each token arrives.
 * Returns the final GeneratedSleepcast when the stream completes.
 */
export async function generateSleepcastStream(
  theme: SleepcastTheme,
  locale: string = 'en',
  onChunk: (accumulatedText: string) => void,
  signal?: AbortSignal,
): Promise<GeneratedSleepcast> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://soundpillow.app',
      'X-OpenRouter-Title': 'SoundPillow',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(theme, locale) },
      ],
      temperature: 0.85,
      max_tokens: 2048,
      top_p: 0.95,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const err = await response.text().catch(() => 'Unknown error');
    throw new Error(`OpenRouter API error (${response.status}): ${err}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue; // skip comments / keep-alive
        if (!trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') break;

        try {
          const parsed = JSON.parse(data);
          // Check for mid-stream errors
          if (parsed.error) {
            throw new Error(parsed.error.message || 'Stream error');
          }
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            accumulated += content;
            onChunk(accumulated);
          }
        } catch (e) {
          // Skip malformed JSON chunks (OpenRouter keep-alive comments)
          if (e instanceof SyntaxError) continue;
          throw e;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (!accumulated.trim()) throw new Error('Empty response from AI');

  return parseStoryText(accumulated.trim(), theme);
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
