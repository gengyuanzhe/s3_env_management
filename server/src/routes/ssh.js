import { Router } from 'express';
import { exec } from 'child_process';
import { readSettings } from '../services/storage.js';

const router = Router();

router.post('/launch', async (req, res) => {
  try {
    const { externalIp, credentials } = req.body;
    if (!externalIp || !credentials) {
      return res.status(400).json({ error: 'externalIp and credentials required' });
    }

    const settings = await readSettings();
    if (!settings.xshellPath) {
      return res.status(400).json({ error: 'Xshell path not configured. Please set it in Global Settings.' });
    }

    const [user, pass] = credentials.includes('/') ? credentials.split('/') : [credentials, ''];
    const url = pass ? `ssh://${user}:${pass}@${externalIp}` : `ssh://${user}@${externalIp}`;
    const cmd = `"${settings.xshellPath}" ${url}`;

    exec(cmd, (err) => {
      if (err) {
        console.error('Xshell launch failed:', err.message);
      }
    });

    res.json({ success: true, message: 'Xshell launch command sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
