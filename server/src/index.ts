import express from 'express';
import cors from 'cors';
import path from 'node:path';
import cron from 'node-cron';
import { config, validateConfig } from './config.js';
import { ensureDataDir, loadStories, todayDate, tomorrowDate } from './store.js';
import { generateDaily } from './generate.js';
import audiosRouter from './routes/audios.js';
import storiesRouter from './routes/stories.js';
import ttsRouter from './routes/tts.js';
import moodRouter from './routes/mood.js';

const app = express();

// Middleware
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());

// Serve pre-generated TTS audio files
app.use('/api/audio', express.static(
  path.join(config.dataDir, '..', 'audio'),
  { maxAge: '7d', immutable: true },
));

// Routes
app.use('/api/audios', audiosRouter);
app.use('/api/stories', storiesRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/mood', moodRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, date: todayDate() });
});

function countStoriesByLocale(stories: NonNullable<Awaited<ReturnType<typeof loadStories>>>): number {
  return Object.values(stories.stories)
    .reduce((acc, themes) => acc + Object.keys(themes).length, 0);
}

async function ensureStoriesForDate(date: string, reason: string): Promise<void> {
  const existing = await loadStories(date);
  if (!existing) {
    console.log(`📖 No stories for ${reason} (${date}). Generating now...`);
    await generateDaily(date);
    return;
  }

  console.log(`📖 ${reason} stories already generated (${countStoriesByLocale(existing)} stories for ${date})`);
}

// Start server
async function start() {
  validateConfig();
  await ensureDataDir();

  app.listen(config.port, () => {
    console.log(`🌙 SoundPillow server running on port ${config.port}`);
    console.log(`   Cron schedule: ${config.cronSchedule}`);
    console.log(`   Locales: ${config.locales.join(', ')}`);
  });

  // Schedule next-day generation ahead of the UTC date boundary.
  cron.schedule(config.cronSchedule, async () => {
    const targetDate = tomorrowDate();
    console.log(`⏰ Cron triggered at ${new Date().toISOString()} — pre-generating ${targetDate}`);
    try {
      await generateDaily(targetDate);
    } catch (err) {
      console.error('Cron generation failed:', err);
    }
  });

  // On startup, backfill both today's and tomorrow's UTC stories.
  for (const [date, reason] of [
    [todayDate(), 'today'],
    [tomorrowDate(), 'tomorrow'],
  ] as const) {
    try {
      await ensureStoriesForDate(date, reason);
    } catch (err) {
      console.error(`Startup generation failed for ${reason} (${date}):`, err);
    }
  }
}

start().catch(console.error);
