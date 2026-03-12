import { Router } from 'express';
import { getStoryAudioCatalog } from '../audioCatalog.js';

const router = Router();

/**
 * GET /api/stories?locale=zh
 * Returns the curated story catalog with category labels in the requested locale.
 */
router.get('/', (req, res) => {
  const locale = (req.query.locale as string) || 'zh';
  res.json(getStoryAudioCatalog(locale as 'en' | 'zh' | 'ja' | 'es'));
});

export default router;
