import { Router } from 'express';
import { readdir, stat } from 'fs/promises';
import path from 'path';

const router = Router();

router.get('/list', async (req, res) => {
  try {
    const dir = req.query.dir;
    if (!dir) return res.status(400).json({ error: 'dir query parameter required' });

    const entries = await readdir(dir);
    const files = [];
    for (const name of entries) {
      const fullPath = path.join(dir, name);
      try {
        const info = await stat(fullPath);
        if (info.isFile()) {
          files.push({ name, size: info.size, modified: info.mtime.toISOString() });
        }
      } catch {
        // skip inaccessible files
      }
    }
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
