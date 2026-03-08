import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { config, validateConfig } from './config.js';
import { ensureDataDir, todayDate } from './store.js';
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

// Start server
async function start() {
  validateConfig();
  await ensureDataDir();

  app.listen(config.port, () => {
    console.log(`🌙 SoundPillow server running on port ${config.port}`);
    console.log(`   Locales: ${config.locales.join(', ')}`);
  });
}

start().catch(console.error);
