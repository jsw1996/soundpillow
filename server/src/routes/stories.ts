import { Router } from 'express';
import { loadStories, todayDate, listDates } from '../store.js';
import { generateDaily } from '../generate.js';
import type { GeneratedSleepcast } from '../types.js';

const router = Router();

/**
 * GET /api/stories/today?locale=en
 * Returns today's stories for the given locale (default: en).
 * Response: { date, stories: GeneratedSleepcast[] }
 */
router.get('/today', async (req, res) => {
  const locale = (req.query.locale as string) || 'en';
  const date = todayDate();

  const data = await loadStories(date);
  if (!data) {
    res.status(404).json({ error: 'No stories generated for today yet' });
    return;
  }

  const stories: GeneratedSleepcast[] = [];
  for (const themeStories of Object.values(data.stories)) {
    if (themeStories[locale]) {
      stories.push(themeStories[locale]);
    }
  }

  res.json({ date, locale, stories });
});

/**
 * GET /api/stories/:date?locale=en
 * Returns stories for a specific date.
 */
router.get('/dates', async (_req, res) => {
  const dates = await listDates(7);
  res.json({ dates });
});

/**
 * GET /api/stories/:date?locale=en
 * Returns stories for a specific date.
 */
router.get('/:date', async (req, res) => {
  const { date } = req.params;
  const locale = (req.query.locale as string) || 'en';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    return;
  }

  const data = await loadStories(date);
  if (!data) {
    res.status(404).json({ error: `No stories found for ${date}` });
    return;
  }

  const stories: GeneratedSleepcast[] = [];
  for (const themeStories of Object.values(data.stories)) {
    if (themeStories[locale]) {
      stories.push(themeStories[locale]);
    }
  }

  res.json({ date, locale, stories });
});

/**
 * POST /api/stories/generate
 * Manually trigger generation for today (or a specific date).
 * Body: { date?: "2026-03-01" }
 * Protected in production by a simple bearer token.
 */
router.post('/generate', async (req, res) => {
  const adminToken = process.env.ADMIN_TOKEN;
  if (adminToken) {
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${adminToken}`) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }

  const date = (req.body as { date?: string })?.date;
  try {
    const result = await generateDaily(date);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
