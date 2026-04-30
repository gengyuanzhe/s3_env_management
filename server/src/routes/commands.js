import { Router } from 'express';
import { readJson, addItem, updateItem, deleteItem } from '../services/storage.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', async (req, res) => {
  const cmds = await readJson('commands.json');
  res.json(cmds);
});

router.post('/', async (req, res) => {
  const { name, template, description } = req.body;
  if (!name || !template) return res.status(400).json({ error: 'name and template required' });
  const cmd = { id: uuidv4(), name, template, description: description || '' };
  await addItem('commands.json', cmd);
  res.json(cmd);
});

router.put('/:id', async (req, res) => {
  const updated = await updateItem('commands.json', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Command not found' });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const ok = await deleteItem('commands.json', req.params.id);
  if (!ok) return res.status(404).json({ error: 'Command not found' });
  res.json({ success: true });
});

export default router;
