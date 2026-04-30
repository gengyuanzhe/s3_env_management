import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import environmentsRouter from './routes/environments.js';
import commandsRouter from './routes/commands.js';
import s3Router from './routes/s3.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/environments', environmentsRouter);
app.use('/api/commands', commandsRouter);
app.use('/api/s3', s3Router);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDist, 'index.html'));
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
