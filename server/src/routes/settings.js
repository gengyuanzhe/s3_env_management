import { Router } from 'express';
import { readSettings, writeSettings } from '../services/storage.js';

const router = Router();

router.get('/', async (req, res) => {
  const settings = await readSettings();
  res.json(settings);
});

router.put('/', async (req, res) => {
  const settings = await writeSettings(req.body);
  res.json(settings);
});

export default router;
