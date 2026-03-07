import { Router } from 'express';
import { getAudioCatalog } from '../audioCatalog.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(getAudioCatalog());
});

export default router;