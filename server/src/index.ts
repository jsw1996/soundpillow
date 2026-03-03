import express from 'express';
import cors from 'cors';
import path from 'node:path';
import cron from 'node-cron';
import { config, validateConfig } from './config.js';
import { ensureDataDir, loadStories, todayDate } from './store.js';
import { generateDaily } from './generate.js';
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
app.use('/api/stories', storiesRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/mood', moodRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, date: todayDate() });
});

// Start server
async function start() {
  validateConfig();
  await ensureDataDir();

  app.listen(config.port, () => {
    console.log(`🌙 SoundPillow server running on port ${config.port}`);
    console.log(`   Cron schedule: ${config.cronSchedule}`);
    console.log(`   Locales: ${config.locales.join(', ')}`);
  });

  // Schedule daily generation
  cron.schedule(config.cronSchedule, async () => {
    console.log(`⏰ Cron triggered at ${new Date().toISOString()}`);
    try {
      await generateDaily();
    } catch (err) {
      console.error('Cron generation failed:', err);
    }
  });

  // On startup, check if today's stories exist. If not, generate them.
  const today = todayDate();
  const existing = await loadStories(today);
  if (!existing) {
    console.log(`📖 No stories for today (${today}). Generating now...`);
    generateDaily().catch((err) => {
      console.error('Startup generation failed:', err);
    });
  } else {
    const count = Object.values(existing.stories)
      .reduce((acc, themes) => acc + Object.keys(themes).length, 0);
    console.log(`📖 Today's stories already generated (${count} stories)`);
  }
}

start().catch(console.error);
