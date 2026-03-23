import { Router } from 'express';
import { getMixCatalog } from '../audioCatalog.js';

const router = Router();

/**
 * GET /api/mixes?locale=en
 * Returns the default mix presets with names in the requested locale.
 */
router.get('/', (req, res) => {
  const locale = (req.query.locale as string) || 'en';
  res.json(getMixCatalog(locale as 'en' | 'zh' | 'ja' | 'es'));
});

export default router;
