import { Router } from 'express';
import { getStoryAudioCatalog } from '../audioCatalog.js';

const router = Router();

/**
 * GET /api/stories
 * Returns the curated story catalog (static content with resolved asset URLs).
 */
router.get('/', (_req, res) => {
  res.json(getStoryAudioCatalog());
});

export default router;
