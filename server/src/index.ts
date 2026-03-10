import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config.js';
import audiosRouter from './routes/audios.js';
import storiesRouter from './routes/stories.js';
import moodRouter from './routes/mood.js';

const app = express();

// Middleware
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());

// Routes
app.use('/api/audios', audiosRouter);
app.use('/api/stories', storiesRouter);
app.use('/api/mood', moodRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Start server
function start() {
  validateConfig();

  app.listen(config.port, () => {
    console.log(`🌙 SoundPillow server running on port ${config.port}`);
  });
}

start();
