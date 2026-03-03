import { Router } from 'express';
import { config } from '../config.js';

const router = Router();

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'arcee-ai/trinity-large-preview:free';

const LANG_NAMES: Record<string, string> = {
  en: 'English',
  zh: 'Chinese (Simplified)',
  ja: 'Japanese',
  es: 'Spanish',
};

const MOOD_DESCRIPTIONS: Record<string, string> = {
  tired: 'tired and exhausted',
  meh: 'meh and so-so',
  okay: 'okay and neutral',
  good: 'good and happy',
  amazing: 'amazing and full of energy',
};

/**
 * POST /api/mood/message
 * Body: { mood: string, locale?: string }
 * Returns: { message: string }
 *
 * Generates a short, personalised uplifting message for the user's daily mood.
 */
router.post('/message', async (req, res) => {
  const { mood, locale = 'en' } = req.body as { mood?: string; locale?: string };

  if (!mood || !MOOD_DESCRIPTIONS[mood]) {
    res.status(400).json({ error: 'Invalid mood' });
    return;
  }

  const moodDesc = MOOD_DESCRIPTIONS[mood];
  const langName = LANG_NAMES[locale] || 'English';

  const systemPrompt = `You are a warm, uplifting daily mood companion for a sleep and relaxation app called SoundPillow. You write short, heartfelt messages that feel personal, genuine, and poetic — never generic or corporate.`;

  const userPrompt = `The user is feeling ${moodDesc} today. Write a single warm, uplifting message (1-2 sentences, 15-30 words) written in ${langName}. Acknowledge their mood with empathy and offer a gentle, poetic nudge of encouragement. Add exactly 1 relevant emoji at the end. Respond with ONLY the message itself — no quotes, no labels, no explanation.`;

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://soundpillow.app',
        'X-OpenRouter-Title': 'SoundPillow',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 80,
        top_p: 0.95,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const json = await response.json() as {
      choices?: { message?: { content?: string } }[];
    };

    const message = json.choices?.[0]?.message?.content?.trim();
    if (!message) throw new Error('Empty response from LLM');

    res.json({ message });
  } catch (err) {
    console.error('Mood message generation failed:', err);
    res.status(500).json({ error: 'Failed to generate message' });
  }
});

export default router;
