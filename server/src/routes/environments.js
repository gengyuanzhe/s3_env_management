import { Router } from 'express';
import { readJson, getById, updateItem, deleteItem, addItem } from '../services/storage.js';
import { parseEnvironmentText } from '../services/parser.js';
import { invalidateS3Client } from '../services/s3Client.js';

const router = Router();

router.get('/', async (req, res) => {
  const envs = await readJson('environments.json');
  res.json(envs);
});

router.get('/:id', async (req, res) => {
  const env = await getById('environments.json', req.params.id);
  if (!env) return res.status(404).json({ error: 'Environment not found' });
  res.json(env);
});

router.post('/parse', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text field required' });

  const { data, errors } = parseEnvironmentText(text);
  if (errors.length > 0 && !data.name) {
    return res.status(400).json({ error: 'Parse failed', details: errors });
  }

  await addItem('environments.json', data);
  res.json({ data, warnings: errors });
});

router.put('/:id', async (req, res) => {
  const updated = await updateItem('environments.json', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Environment not found' });
  invalidateS3Client(req.params.id);
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const ok = await deleteItem('environments.json', req.params.id);
  if (!ok) return res.status(404).json({ error: 'Environment not found' });
  invalidateS3Client(req.params.id);
  res.json({ success: true });
});

export default router;
