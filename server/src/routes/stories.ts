import { Router } from 'express';
import { loadStories, todayDate, listDates } from '../store.js';
import { generateDaily } from '../generate.js';
import type { GeneratedSleepcast } from '../types.js';

const router = Router();

async function loadStoriesForLocale(date: string, locale: string): Promise<GeneratedSleepcast[] | null> {
  const data = await loadStories(date);
  if (!data) return null;

  const stories: GeneratedSleepcast[] = [];
  for (const themeStories of Object.values(data.stories)) {
    if (themeStories[locale]) {
      stories.push(themeStories[locale]);
    }
  }

  return stories;
}

/**
 * GET /api/stories/today?locale=en
 * Returns today's stories for the given locale (default: en).
 * Response: { date, stories: GeneratedSleepcast[] }
 */
router.get('/today', async (req, res) => {
  const locale = (req.query.locale as string) || 'en';
  const date = todayDate();

  const todayStories = await loadStoriesForLocale(date, locale);
  if (todayStories?.length) {
    res.json({ date, locale, stories: todayStories, stale: false });
    return;
  }

  const [latestDate] = await listDates(1);
  if (latestDate && latestDate !== date) {
    const latestStories = await loadStoriesForLocale(latestDate, locale);
    if (latestStories?.length) {
      res.json({
        date: latestDate,
        locale,
        stories: latestStories,
        stale: true,
        requestedDate: date,
      });
      return;
    }
  }

  res.status(404).json({ error: 'No stories generated for today yet', date, locale });
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

  const stories = await loadStoriesForLocale(date, locale);
  if (!stories) {
    res.status(404).json({ error: `No stories found for ${date}` });
    return;
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
