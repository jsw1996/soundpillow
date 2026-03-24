import { Router } from 'express';
import { getAudioCatalog } from '../audioCatalog.js';

const router = Router();

/**
 * GET /api/audios?locale=en
 * Returns the ambient track catalog with metadata in the requested locale.
 */
router.get('/', (req, res) => {
  const locale = (req.query.locale as string) || 'en';
  res.json(getAudioCatalog(locale as 'en' | 'zh' | 'ja' | 'es'));
});

export default router;