# S3 环境运维平台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个Web端S3环境运维平台，支持环境信息解析、多环境管理、S3桶/对象操作、节点Xshell连接、快捷命令管理和操作日志。

**Architecture:** 前后端分离 — React + Vite 前端通过REST API与Express后端通信。后端负责文本解析、JSON数据持久化、S3 SDK代理操作。前端Ant Design组件化，React Context管理状态。

**Tech Stack:** React 18, Vite, Ant Design 5, Express 4, AWS SDK v3 (@aws-sdk/client-s3), multer, uuid

---

## File Structure

```
s3_env_management/
├── package.json                    # Root workspace config
├── client/                         # React前端
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx                # 入口
│       ├── App.jsx                 # 根组件
│       ├── App.css                 # 全局样式
│       ├── context/
│       │   ├── AppContext.jsx       # 全局状态 (环境/命令/日志/选中状态)
│       │   └── logReducer.js       # 日志reducer
│       ├── services/
│       │   └── api.js              # 所有API调用函数
│       ├── components/
│       │   ├── Layout.jsx          # 整体布局 (顶栏+侧栏+内容区+日志)
│       │   ├── TopNav.jsx          # 顶部导航栏
│       │   ├── Sidebar.jsx         # 左侧栏 (环境列表+桶列表+工具)
│       │   ├── LogPanel.jsx        # 固定底部操作日志面板
│       │   ├── EnvDetailView.jsx   # 环境信息详情视图
│       │   ├── NodeCard.jsx        # 节点卡片
│       │   ├── S3ConfigView.jsx    # S3配置展示
│       │   ├── BucketObjectsView.jsx # 桶内对象列表视图
│       │   ├── CommandsView.jsx    # 快捷命令管理视图
│       │   └── modals/
│       │       ├── AddEnvModal.jsx       # 添加环境 (文本解析)
│       │       ├── EditEnvModal.jsx      # 编辑环境信息
│       │       ├── CreateBucketModal.jsx # 创建桶
│       │       ├── UploadModal.jsx       # 上传对象
│       │       ├── DownloadModal.jsx     # 下载对象
│       │       └── EditCommandModal.jsx  # 编辑快捷命令
│       └── utils/
│           └── format.js           # 格式化工具 (文件大小/时间等)
├── server/                         # Express后端
│   ├── package.json
│   └── src/
│       ├── index.js                # Express入口
│       ├── routes/
│       │   ├── environments.js     # 环境CRUD + 文本解析
│       │   ├── commands.js         # 快捷命令CRUD
│       │   └── s3.js               # S3操作代理
│       └── services/
│           ├── parser.js           # 环境信息文本解析器
│           ├── storage.js          # JSON文件读写
│           └── s3Client.js         # S3客户端工厂
├── data/                           # JSON数据存储 (gitignored)
│   ├── environments.json
│   └── commands.json
└── docs/
```

---

### Task 1: Project Scaffolding — Monorepo Setup

**Files:**
- Create: `package.json` (root)
- Create: `server/package.json`
- Create: `client/package.json`
- Create: `client/index.html`
- Create: `client/vite.config.js`
- Create: `client/src/main.jsx`
- Create: `client/src/App.jsx`
- Create: `client/src/App.css`
- Create: `server/src/index.js`
- Create: `data/environments.json`
- Create: `data/commands.json`

- [ ] **Step 1: Create root package.json with workspace scripts**

```json
{
  "name": "s3-env-management",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "npm run dev --workspace=server",
    "dev:client": "npm run dev --workspace=client",
    "build": "npm run build --workspace=client"
  },
  "workspaces": ["client", "server"],
  "devDependencies": {
    "concurrently": "^9.1.2"
  }
}
```

- [ ] **Step 2: Create server/package.json**

```json
{
  "name": "server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch src/index.js"
  },
  "dependencies": {
    "express": "^4.21.2",
    "multer": "^1.4.5-lts.2",
    "uuid": "^11.1.0",
    "@aws-sdk/client-s3": "^3.739.0"
  }
}
```

- [ ] **Step 3: Create client/package.json**

```json
{
  "name": "client",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "antd": "^5.24.2",
    "@ant-design/icons": "^5.6.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.2.0"
  }
}
```

- [ ] **Step 4: Create client/vite.config.js with API proxy**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
```

- [ ] **Step 5: Create client/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>S3 EnvOps - 环境运维平台</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 6: Create client/src/main.jsx**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ConfigProvider locale={zhCN}>
    <App />
  </ConfigProvider>
);
```

- [ ] **Step 7: Create client/src/App.jsx (placeholder)**

```jsx
import React from 'react';

export default function App() {
  return <div style={{ padding: 40, textAlign: 'center' }}>S3 EnvOps Loading...</div>;
}
```

- [ ] **Step 8: Create client/src/App.css (base styles)**

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; }
```

- [ ] **Step 9: Create server/src/index.js (minimal Express)**

```js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes placeholder
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve static frontend in production
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDist, 'index.html'));
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
```

- [ ] **Step 10: Create data directory with empty JSON files**

`data/environments.json`:
```json
[]
```

`data/commands.json`:
```json
[]
```

- [ ] **Step 11: Install all dependencies**

Run: `npm install`

- [ ] **Step 12: Verify both servers start**

Run: `npm run dev`
Expected: Express on :3000, Vite on :5173, proxy working. Visit http://localhost:5173 shows "S3 EnvOps Loading..."

- [ ] **Step 13: Commit**

```bash
git add package.json package-lock.json client/ server/ data/ .gitignore
git commit -m "feat: project scaffolding with React + Express monorepo"
```

---

### Task 2: Backend — Storage Service

**Files:**
- Create: `server/src/services/storage.js`

- [ ] **Step 1: Create storage.js — JSON file read/write service**

```js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../../data');

function filePath(filename) {
  return path.join(DATA_DIR, filename);
}

export async function readJson(filename) {
  const full = filePath(filename);
  try {
    const content = await fs.readFile(full, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function writeJson(filename, data) {
  const full = filePath(filename);
  await fs.writeFile(full, JSON.stringify(data, null, 2), 'utf-8');
  return data;
}

export async function getById(filename, id) {
  const items = await readJson(filename);
  return items.find(item => item.id === id) || null;
}

export async function addItem(filename, item) {
  const items = await readJson(filename);
  items.push(item);
  await writeJson(filename, items);
  return item;
}

export async function updateItem(filename, id, updates) {
  const items = await readJson(filename);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  await writeJson(filename, items);
  return items[index];
}

export async function deleteItem(filename, id) {
  const items = await readJson(filename);
  const filtered = items.filter(item => item.id !== id);
  if (filtered.length === items.length) return false;
  await writeJson(filename, filtered);
  return true;
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/services/storage.js
git commit -m "feat: add JSON file storage service"
```

---

### Task 3: Backend — Text Parser Service

**Files:**
- Create: `server/src/services/parser.js`

- [ ] **Step 1: Create parser.js — environment info text parser**

```js
import { v4 as uuidv4 } from 'uuid';

export function parseEnvironmentText(text) {
  const errors = [];
  const env = {
    id: uuidv4(),
    name: '',
    envId: '',
    instanceId: '',
    model: '',
    cpuArch: '',
    form: '',
    disk: '',
    managementUrl: '',
    account: '',
    password: '',
    sdeName: '',
    nodes: [],
    s3Config: { endpoint: '', ak: '', sk: '' },
    createdAt: new Date().toISOString(),
  };

  const lines = text.split('\n').map(l => l.trimEnd());

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('---')) continue;

    const match = (pattern) => {
      const m = trimmed.match(pattern);
      return m ? m[1].trim() : null;
    };

    const value = match(/^(?:环境名称|环境名称:)\s*:?\s*(.+)/)
      || match(/^环境ID\s*:?\s*(.+)/) && null;
    if (match(/^环境名称\s*:?\s*(.+)/)) { env.name = match(/^环境名称\s*:?\s*(.+)/); continue; }
    if (match(/^环境ID\s*:?\s*(.+)/)) { env.envId = match(/^环境ID\s*:?\s*(.+)/); continue; }
    if (match(/^实例ID\s*:?\s*(.+)/)) { env.instanceId = match(/^实例ID\s*:?\s*(.+)/); continue; }
    if (match(/^型号\s*:?\s*(.+)/)) { env.model = match(/^型号\s*:?\s*(.+)/); continue; }
    if (match(/^CPU架构\s*:?\s*(.+)/)) { env.cpuArch = match(/^CPU架构\s*:?\s*(.+)/); continue; }
    if (match(/^形态\s*:?\s*(.+)/)) { env.form = match(/^形态\s*:?\s*(.+)/); continue; }
    if (match(/^盘\s*:?\s*(.+)/)) { env.disk = match(/^盘\s*:?\s*(.+)/); continue; }
    if (match(/^管理界面\s*:?\s*(.+)/)) { env.managementUrl = match(/^管理界面\s*:?\s*(.+)/); continue; }
    if (match(/^账号\s*:?\s*(.+)/)) { env.account = match(/^账号\s*:?\s*(.+)/); continue; }
    if (match(/^密码\s*:?\s*(.+)/)) { env.password = match(/^密码\s*:?\s*(.+)/); continue; }
    if (match(/^SDE Name\s*:?\s*(.+)/)) { env.sdeName = match(/^SDE Name\s*:?\s*(.+)/); continue; }

    // S3 config fields (indented)
    if (match(/^Endpoint\s*:?\s*(.+)/)) { env.s3Config.endpoint = match(/^Endpoint\s*:?\s*(.+)/); continue; }
    if (match(/^AK\s*:?\s*(.+)/)) { env.s3Config.ak = match(/^AK\s*:?\s*(.+)/); continue; }
    if (match(/^SK\s*:?\s*(.+)/)) { env.s3Config.sk = match(/^SK\s*:?\s*(.+)/); continue; }
  }

  // Parse nodes: lines with format "NAME INTERNAL_IP EXTERNAL_IP USER/PWD"
  const nodePattern = /^\s+(\S+)\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)\s+(\S+\/\S+)/;
  for (const line of lines) {
    const m = line.match(nodePattern);
    if (m) {
      env.nodes.push({
        name: m[1],
        internalIp: m[2],
        externalIp: m[3],
        credentials: m[4],
      });
    }
  }

  if (!env.name) errors.push('环境名称未解析到');
  if (env.nodes.length === 0) errors.push('未解析到节点信息');

  return { data: env, errors };
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/services/parser.js
git commit -m "feat: add environment text parser service"
```

---

### Task 4: Backend — S3 Client Service

**Files:**
- Create: `server/src/services/s3Client.js`

- [ ] **Step 1: Create s3Client.js — S3 client factory per environment**

```js
import { S3Client } from '@aws-sdk/client-s3';
import { getById } from './storage.js';

const clientCache = new Map();

export async function getS3Client(envId) {
  if (clientCache.has(envId)) return clientCache.get(envId);

  const env = await getById('environments.json', envId);
  if (!env || !env.s3Config) throw new Error(`Environment ${envId} not found or missing S3 config`);

  const { endpoint, ak, sk } = env.s3Config;
  if (!endpoint || !ak || !sk) throw new Error('S3 config incomplete: missing endpoint, ak, or sk');

  const client = new S3Client({
    endpoint,
    region: 'us-east-1',
    credentials: { accessKeyId: ak, secretAccessKey: sk },
    forcePathStyle: true,
  });

  clientCache.set(envId, client);
  return client;
}

export function invalidateS3Client(envId) {
  clientCache.delete(envId);
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/services/s3Client.js
git commit -m "feat: add S3 client factory with caching"
```

---

### Task 5: Backend — Environments API Routes

**Files:**
- Create: `server/src/routes/environments.js`
- Modify: `server/src/index.js`

- [ ] **Step 1: Create environments.js route**

```js
import { Router } from 'express';
import { readJson, getById, updateItem, deleteItem, addItem } from '../services/storage.js';
import { parseEnvironmentText } from '../services/parser.js';
import { invalidateS3Client } from '../services/s3Client.js';

const router = Router();

// GET all environments
router.get('/', async (req, res) => {
  const envs = await readJson('environments.json');
  res.json(envs);
});

// GET single environment
router.get('/:id', async (req, res) => {
  const env = await getById('environments.json', req.params.id);
  if (!env) return res.status(404).json({ error: 'Environment not found' });
  res.json(env);
});

// POST parse text and save
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

// PUT update environment
router.put('/:id', async (req, res) => {
  const updated = await updateItem('environments.json', req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Environment not found' });
  invalidateS3Client(req.params.id);
  res.json(updated);
});

// DELETE environment
router.delete('/:id', async (req, res) => {
  const ok = await deleteItem('environments.json', req.params.id);
  if (!ok) return res.status(404).json({ error: 'Environment not found' });
  invalidateS3Client(req.params.id);
  res.json({ success: true });
});

export default router;
```

- [ ] **Step 2: Update server/src/index.js to mount environments route**

Add after `app.use(express.urlencoded({ extended: true }));`:

```js
import environmentsRouter from './routes/environments.js';
app.use('/api/environments', environmentsRouter);
```

- [ ] **Step 3: Test parse API**

Run: `npm run dev:server`
Then: `curl -X POST http://localhost:3000/api/environments/parse -H 'Content-Type: application/json' -d '{"text":"--------单FSM_test环境信息--------\n    环境名称:单FSM_test\n    CPU架构:arm\n    管理界面:https://1.2.3.4:8088\n    节点:\n      FSM 192.168.1.1 1.2.3.4 root/pass\n    S3配置:\n      Endpoint: http://1.2.3.4:5080\n      AK: testak\n      SK: testsk"}'`
Expected: JSON response with parsed environment data

- [ ] **Step 4: Commit**

```bash
git add server/src/routes/environments.js server/src/index.js
git commit -m "feat: add environments CRUD API routes"
```

---

### Task 6: Backend — Commands API Routes

**Files:**
- Create: `server/src/routes/commands.js`
- Modify: `server/src/index.js`

- [ ] **Step 1: Create commands.js route**

```js
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
```

- [ ] **Step 2: Update server/src/index.js to mount commands route**

Add below environments router:

```js
import commandsRouter from './routes/commands.js';
app.use('/api/commands', commandsRouter);
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/commands.js server/src/index.js
git commit -m "feat: add commands CRUD API routes"
```

---

### Task 7: Backend — S3 API Routes

**Files:**
- Create: `server/src/routes/s3.js`
- Modify: `server/src/index.js`

- [ ] **Step 1: Create s3.js route**

```js
import { Router } from 'express';
import multer from 'multer';
import {
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getS3Client } from '../services/s3Client.js';
import { Readable } from 'stream';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// List buckets
router.get('/:envId/buckets', async (req, res) => {
  try {
    const client = await getS3Client(req.params.envId);
    const result = await client.send(new ListBucketsCommand({}));
    res.json(result.Buckets || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create bucket
router.post('/:envId/buckets', async (req, res) => {
  try {
    const client = await getS3Client(req.params.envId);
    await client.send(new CreateBucketCommand({ Bucket: req.body.name }));
    res.json({ success: true, name: req.body.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete bucket
router.delete('/:envId/buckets/:bucket', async (req, res) => {
  try {
    const client = await getS3Client(req.params.envId);
    await client.send(new DeleteBucketCommand({ Bucket: req.params.bucket }));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List objects
router.get('/:envId/buckets/:bucket/objects', async (req, res) => {
  try {
    const client = await getS3Client(req.params.envId);
    const result = await client.send(new ListObjectsV2Command({
      Bucket: req.params.bucket,
      Prefix: req.query.prefix || '',
    }));
    res.json(result.Contents || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload object
router.post('/:envId/upload', upload.single('file'), async (req, res) => {
  try {
    const { bucket, key, mode, partSize } = req.body;
    const file = req.file;
    if (!file || !bucket || !key) return res.status(400).json({ error: 'bucket, key, file required' });

    const client = await getS3Client(req.params.envId);

    if (mode === 'multipart' && file.size > 5 * 1024 * 1024) {
      const partBytes = (parseInt(partSize) || 5) * 1024 * 1024;
      const mpu = await client.send(new CreateMultipartUploadCommand({ Bucket: bucket, Key: key }));
      const parts = [];
      let partNum = 1;
      for (let offset = 0; offset < file.buffer.length; offset += partBytes) {
        const chunk = file.buffer.slice(offset, Math.min(offset + partBytes, file.buffer.length));
        const result = await client.send(new UploadPartCommand({
          Bucket: bucket, Key: key, UploadId: mpu.UploadId,
          PartNumber: partNum, Body: chunk,
        }));
        parts.push({ PartNumber: partNum, ETag: result.ETag });
        partNum++;
      }
      await client.send(new CompleteMultipartUploadCommand({
        Bucket: bucket, Key: key, UploadId: mpu.UploadId, MultipartUpload: { Parts: parts },
      }));
    } else {
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: file.buffer }));
    }

    res.json({ success: true, key, size: file.size });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download object
router.get('/:envId/download', async (req, res) => {
  try {
    const { bucket, key } = req.query;
    if (!bucket || !key) return res.status(400).json({ error: 'bucket and key required' });

    const client = await getS3Client(req.params.envId);
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

    const filename = key.split('/').pop();
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', result.ContentType || 'application/octet-stream');
    if (result.ContentLength) res.setHeader('Content-Length', result.ContentLength);

    const stream = Readable.toWeb(result.Body);
    for await (const chunk of stream) {
      res.write(chunk);
    }
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete object
router.delete('/:envId/buckets/:bucket/objects', async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'key required' });
    const client = await getS3Client(req.params.envId);
    await client.send(new DeleteObjectCommand({ Bucket: req.params.bucket, Key: key }));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

- [ ] **Step 2: Update server/src/index.js to mount s3 route**

```js
import s3Router from './routes/s3.js';
app.use('/api/s3', s3Router);
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/s3.js server/src/index.js
git commit -m "feat: add S3 proxy API routes (list/create/delete buckets, upload/download/delete objects)"
```

---

### Task 8: Frontend — API Service Layer

**Files:**
- Create: `client/src/services/api.js`

- [ ] **Step 1: Create api.js — all backend API calls**

```js
const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || err.details || 'Request failed');
  }
  return res;
}

// Environments
export async function getEnvironments() {
  const res = await request('/environments');
  return res.json();
}

export async function getEnvironment(id) {
  const res = await request(`/environments/${id}`);
  return res.json();
}

export async function parseAndAddEnvironment(text) {
  const res = await request('/environments/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

export async function updateEnvironment(id, data) {
  const res = await request(`/environments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteEnvironment(id) {
  const res = await request(`/environments/${id}`, { method: 'DELETE' });
  return res.json();
}

// Commands
export async function getCommands() {
  const res = await request('/commands');
  return res.json();
}

export async function createCommand(data) {
  const res = await request('/commands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateCommand(id, data) {
  const res = await request(`/commands/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteCommand(id) {
  const res = await request(`/commands/${id}`, { method: 'DELETE' });
  return res.json();
}

// S3
export async function listBuckets(envId) {
  const res = await request(`/s3/${envId}/buckets`);
  return res.json();
}

export async function createBucket(envId, name) {
  const res = await request(`/s3/${envId}/buckets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function deleteBucket(envId, bucket) {
  const res = await request(`/s3/${envId}/buckets/${encodeURIComponent(bucket)}`, { method: 'DELETE' });
  return res.json();
}

export async function listObjects(envId, bucket, prefix = '') {
  const res = await request(`/s3/${envId}/buckets/${encodeURIComponent(bucket)}/objects?prefix=${encodeURIComponent(prefix)}`);
  return res.json();
}

export async function uploadObject(envId, { bucket, key, file, mode, partSize }, onProgress) {
  const form = new FormData();
  form.append('bucket', bucket);
  form.append('key', key);
  form.append('file', file);
  form.append('mode', mode || 'normal');
  form.append('partSize', partSize || '5');

  const xhr = new XMLHttpRequest();
  return new Promise((resolve, reject) => {
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(JSON.parse(xhr.responseText).error || 'Upload failed'));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.open('POST', `${BASE}/s3/${envId}/upload`);
    xhr.send(form);
  });
}

export async function deleteObject(envId, bucket, key) {
  const res = await request(`/s3/${envId}/buckets/${encodeURIComponent(bucket)}/objects`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key }),
  });
  return res.json();
}

export async function downloadObject(envId, bucket, key) {
  const res = await request(`/s3/${envId}/download?bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}`);
  return res;
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/services/api.js
git commit -m "feat: add frontend API service layer"
```

---

### Task 9: Frontend — Global State (React Context)

**Files:**
- Create: `client/src/context/logReducer.js`
- Create: `client/src/context/AppContext.jsx`

- [ ] **Step 1: Create logReducer.js**

```js
export function logReducer(state, action) {
  switch (action.type) {
    case 'ADD_LOG':
      return [action.payload, ...state];
    case 'CLEAR_LOGS':
      return [];
    default:
      return state;
  }
}

export function createLog(level, operation, detail) {
  const now = new Date();
  const time = now.toTimeString().slice(0, 8);
  return { time, level, operation, detail, id: Date.now() + Math.random() };
}
```

- [ ] **Step 2: Create AppContext.jsx**

```jsx
import React, { createContext, useContext, useReducer, useState, useCallback } from 'react';
import { logReducer, createLog } from './logReducer';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [environments, setEnvironments] = useState([]);
  const [commands, setCommands] = useState([]);
  const [logs, dispatchLog] = useReducer(logReducer, []);
  const [activeView, setActiveView] = useState({ type: 'empty' }); // { type, envId, bucket? }
  const [buckets, setBuckets] = useState({}); // { envId: [buckets] }

  const addLog = useCallback((level, operation, detail) => {
    dispatchLog({ type: 'ADD_LOG', payload: createLog(level, operation, detail) });
  }, []);

  const clearLogs = useCallback(() => dispatchLog({ type: 'CLEAR_LOGS' }), []);

  const value = {
    environments, setEnvironments,
    commands, setCommands,
    logs, addLog, clearLogs,
    activeView, setActiveView,
    buckets, setBuckets,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/context/
git commit -m "feat: add React Context for global state management"
```

---

### Task 10: Frontend — Layout & TopNav

**Files:**
- Modify: `client/src/App.jsx`
- Create: `client/src/components/Layout.jsx`
- Create: `client/src/components/TopNav.jsx`

- [ ] **Step 1: Update App.jsx to use context and layout**

```jsx
import React from 'react';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';

export default function App() {
  return (
    <AppProvider>
      <Layout />
    </AppProvider>
  );
}
```

- [ ] **Step 2: Create TopNav.jsx**

```jsx
import React, { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import AddEnvModal from './modals/AddEnvModal';

export default function TopNav() {
  const [addModalOpen, setAddModalOpen] = useState(false);

  return (
    <>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 'bold', fontSize: 13,
          }}>S3</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>S3 EnvOps</div>
            <div style={{ color: '#64748b', fontSize: 9, letterSpacing: 0.5 }}>环境运维平台</div>
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setAddModalOpen(true)}
          style={{ borderRadius: 20, background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', border: 'none' }}
        >
          添加环境
        </Button>
      </div>
      <AddEnvModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </>
  );
}
```

- [ ] **Step 3: Create Layout.jsx — main layout with sidebar + content + log**

```jsx
import React from 'react';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import LogPanel from './LogPanel';
import EnvDetailView from './EnvDetailView';
import BucketObjectsView from './BucketObjectsView';
import CommandsView from './CommandsView';
import { useApp } from '../context/AppContext';

export default function Layout() {
  const { activeView } = useApp();

  const renderContent = () => {
    switch (activeView.type) {
      case 'envInfo': return <EnvDetailView envId={activeView.envId} />;
      case 'bucket': return <BucketObjectsView envId={activeView.envId} bucket={activeView.bucket} />;
      case 'commands': return <CommandsView />;
      default: return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8c939d' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>&#128230;</div>
            <p>选择左侧环境或工具开始使用</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopNav />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
            {renderContent()}
          </div>
          <LogPanel />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/App.jsx client/src/components/Layout.jsx client/src/components/TopNav.jsx
git commit -m "feat: add main layout with TopNav and view routing"
```

---

### Task 11: Frontend — Sidebar (Environment List + Bucket List + Tools)

**Files:**
- Create: `client/src/components/Sidebar.jsx`

- [ ] **Step 1: Create Sidebar.jsx**

```jsx
import React, { useEffect } from 'react';
import { Collapse, Button, Spin, Empty } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import { getEnvironments, listBuckets } from '../services/api';
import CreateBucketModal from './modals/CreateBucketModal';

export default function Sidebar() {
  const { environments, setEnvironments, activeView, setActiveView, buckets, setBuckets, addLog } = useApp();
  const [loading, setLoading] = useState(false);
  const [createBucketEnvId, setCreateBucketEnvId] = React.useState(null);

  useEffect(() => { loadEnvironments(); }, []);

  async function loadEnvironments() {
    const envs = await getEnvironments();
    setEnvironments(envs);
  }

  async function loadBuckets(envId) {
    setLoading(true);
    try {
      const result = await listBuckets(envId);
      setBuckets(prev => ({ ...prev, [envId]: result }));
      addLog('SUCCESS', '列举桶', `环境 ${envId.slice(0, 8)}..., 返回 ${result.length} 个桶`);
    } catch (err) {
      addLog('FAILED', '列举桶', err.message);
    }
    setLoading(false);
  }

  const handleEnvExpand = (envId) => {
    if (!buckets[envId]) loadBuckets(envId);
  };

  const envItems = environments.map(env => {
    const bucketList = buckets[env.id] || [];
    return {
      key: env.id,
      label: (
        <div>
          <div style={{ fontWeight: 600, fontSize: 12, color: '#1a1a2e' }}>{env.name}</div>
          <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
            <span style={{ background: 'rgba(59,130,246,0.12)', color: '#3a7bd5', padding: '0 5px', borderRadius: 4, fontSize: 8 }}>{env.cpuArch}</span>
            <span style={{ background: 'rgba(34,197,94,0.12)', color: '#2e7d32', padding: '0 5px', borderRadius: 4, fontSize: 8 }}>{env.nodes.length}节点</span>
          </div>
        </div>
      ),
      children: (
        <div>
          <div
            onClick={() => setActiveView({ type: 'envInfo', envId: env.id })}
            style={{
              padding: '4px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 4,
              background: activeView.type === 'envInfo' && activeView.envId === env.id ? '#f0f7ff' : 'transparent',
              color: '#3a7bd5',
            }}
          >
            环境信息
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px 2px' }}>
            <span style={{ fontSize: 9, color: '#8c939d', fontWeight: 600 }}>S3 桶</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <ReloadOutlined style={{ fontSize: 10, color: '#3a7bd5', cursor: 'pointer' }} onClick={() => loadBuckets(env.id)} />
              <PlusOutlined style={{ fontSize: 10, color: '#3a7bd5', cursor: 'pointer' }} onClick={() => setCreateBucketEnvId(env.id)} />
            </div>
          </div>

          {loading && !buckets[env.id] ? <Spin size="small" /> : (
            bucketList.length === 0 ? <div style={{ padding: '2px 10px', fontSize: 10, color: '#8c939d' }}>暂无桶</div> :
            bucketList.map(b => (
              <div
                key={b.Name}
                onClick={() => setActiveView({ type: 'bucket', envId: env.id, bucket: b.Name })}
                style={{
                  padding: '5px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 4,
                  background: activeView.type === 'bucket' && activeView.bucket === b.Name ? '#f0f7ff' : 'transparent',
                  borderLeft: activeView.type === 'bucket' && activeView.bucket === b.Name ? '2px solid #3a7bd5' : '2px solid transparent',
                }}
              >
                &#128230; {b.Name}
              </div>
            ))
          )}
        </div>
      ),
    };
  });

  return (
    <div style={{ width: 260, background: '#fff', borderRight: '1px solid #e8ecf1', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {environments.length === 0 ? (
          <Empty description="暂无环境" style={{ marginTop: 40 }} />
        ) : (
          <Collapse
            ghost
            expandIconPosition="end"
            items={envItems}
            onChange={(keys) => { if (keys.length > 0) handleEnvExpand(keys[keys.length - 1]); }}
          />
        )}
      </div>
      <div style={{ borderTop: '1px solid #e8ecf1', padding: '8px 12px' }}>
        <div
          onClick={() => setActiveView({ type: 'commands' })}
          style={{
            padding: '8px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 6,
            background: activeView.type === 'commands' ? '#eef5ff' : 'transparent',
            color: activeView.type === 'commands' ? '#3a7bd5' : '#5a6377',
          }}
        >
          快捷命令
        </div>
      </div>
      {createBucketEnvId && (
        <CreateBucketModal envId={createBucketEnvId} onClose={() => setCreateBucketEnvId(null)} />
      )}
    </div>
  );
}

import { useState } from 'react';
```

Note: Move the `import { useState }` to the top of the file with other imports in actual implementation.

- [ ] **Step 2: Commit**

```bash
git add client/src/components/Sidebar.jsx
git commit -m "feat: add sidebar with env list, bucket list, and tools section"
```

---

### Task 12: Frontend — Log Panel

**Files:**
- Create: `client/src/components/LogPanel.jsx`

- [ ] **Step 1: Create LogPanel.jsx**

```jsx
import React, { useRef, useEffect, useState } from 'react';
import { Button } from 'antd';
import { useApp } from '../context/AppContext';

const LEVEL_COLOR = { SUCCESS: '#22c55e', FAILED: '#ef4444', INFO: '#f59e0b' };

export default function LogPanel() {
  const { logs, clearLogs } = useApp();
  const [expanded, setExpanded] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [logs]);

  const copyAll = () => {
    const text = logs.map(l => `${l.time} [${l.level}] ${l.operation} — ${l.detail}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={{ flexShrink: 0, background: '#1e1e2e', borderTop: '2px solid #3a7bd5' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '5px 14px', background: '#2d2d3f',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, background: '#22c55e', borderRadius: '50%' }} />
          <span style={{ color: '#e2e8f0', fontSize: 10, fontWeight: 600 }}>操作日志</span>
          <span style={{ background: '#3a3a4e', color: '#94a3b8', padding: '0 6px', borderRadius: 8, fontSize: 8 }}>{logs.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ color: '#64748b', fontSize: 8, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
            {expanded ? '收起' : '展开'}
          </span>
          <span style={{ color: '#64748b', fontSize: 8, cursor: 'pointer' }} onClick={copyAll}>复制</span>
          <span style={{ color: '#64748b', fontSize: 8, cursor: 'pointer' }} onClick={clearLogs}>清空</span>
        </div>
      </div>
      {expanded && (
        <div ref={containerRef} style={{
          padding: '6px 14px', fontFamily: 'monospace', fontSize: 9, lineHeight: 1.7,
          maxHeight: 100, overflowY: 'auto',
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#64748b' }}>暂无日志</div>
          ) : logs.map(l => (
            <div key={l.id}>
              <span style={{ color: '#4a6a9a' }}>{l.time}</span>{' '}
              <span style={{ color: LEVEL_COLOR[l.level] || '#94a3b8' }}>[{l.level}]</span>{' '}
              <span style={{ color: '#94a3b8' }}>{l.operation}</span>{' '}
              <span style={{ color: '#64748b' }}>— {l.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/LogPanel.jsx
git commit -m "feat: add fixed bottom log panel with copy/clear/expand"
```

---

### Task 13: Frontend — Environment Detail View

**Files:**
- Create: `client/src/components/EnvDetailView.jsx`
- Create: `client/src/components/NodeCard.jsx`
- Create: `client/src/components/S3ConfigView.jsx`
- Create: `client/src/utils/format.js`

- [ ] **Step 1: Create utils/format.js**

```js
export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}
```

- [ ] **Step 2: Create NodeCard.jsx**

```jsx
import React from 'react';
import { Tag, Button } from 'antd';
import { CodeOutlined } from '@ant-design/icons';

const ROLE_MAP = {
  FSM: { label: '主节点', color: '#3a7bd5' },
};
function getNodeRole(name) {
  if (name.startsWith('FSM')) return { label: '主节点', color: 'blue' };
  if (name.startsWith('FSA')) return { label: '从节点', color: 'default' };
  if (name.startsWith('CLIENT')) return { label: '客户端', color: 'orange' };
  return { label: '节点', color: 'default' };
}

export default function NodeCard({ node }) {
  const role = getNodeRole(node.name);
  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: 14,
      border: '1px solid #e8ecf1', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 13 }}>{node.name}</span>
        <Tag color={role.color} style={{ margin: 0, fontSize: 9 }}>{role.label}</Tag>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 10, color: '#5a6377', marginBottom: 10 }}>
        <div>内网 <span style={{ color: '#1a1a2e', fontWeight: 500 }}>{node.internalIp}</span></div>
        <div>外网 <span style={{ color: '#1a1a2e', fontWeight: 500 }}>{node.externalIp}</span></div>
      </div>
      <div style={{ fontSize: 10, color: '#5a6377', marginBottom: 10 }}>
        凭证: <span style={{ fontFamily: 'monospace' }}>{node.credentials}</span>
      </div>
      <Button
        size="small"
        icon={<CodeOutlined />}
        onClick={() => window.open(`ssh://${node.credentials.replace('/', ':')}@${node.externalIp}`, '_self')}
        style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', color: '#fff', border: 'none', borderRadius: 6 }}
      >
        Xshell
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Create S3ConfigView.jsx**

```jsx
import React, { useState } from 'react';

export default function S3ConfigView({ s3Config }) {
  const [showSk, setShowSk] = useState(false);
  if (!s3Config) return null;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, #ff9800, #ff5722)', borderRadius: 2 }} />
        <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 13 }}>S3 配置</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div style={{ background: '#f8f9fb', borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 9, color: '#8c939d', marginBottom: 4 }}>Endpoint</div>
          <div style={{ fontSize: 11, color: '#1a1a2e', fontWeight: 500, fontFamily: 'monospace' }}>{s3Config.endpoint}</div>
        </div>
        <div style={{ background: '#f8f9fb', borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 9, color: '#8c939d', marginBottom: 4 }}>Access Key</div>
          <div style={{ fontSize: 11, color: '#1a1a2e', fontWeight: 500, fontFamily: 'monospace' }}>{s3Config.ak}</div>
        </div>
        <div style={{ background: '#f8f9fb', borderRadius: 8, padding: 10, cursor: 'pointer' }} onClick={() => setShowSk(!showSk)}>
          <div style={{ fontSize: 9, color: '#8c939d', marginBottom: 4 }}>Secret Key <span style={{ fontSize: 8 }}>(点击{showSk ? '隐藏' : '显示'})</span></div>
          <div style={{ fontSize: 11, color: '#1a1a2e', fontWeight: 500, fontFamily: 'monospace' }}>
            {showSk ? s3Config.sk : '••••••••••••'}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create EnvDetailView.jsx**

```jsx
import React, { useState } from 'react';
import { Tag, Button } from 'antd';
import { EditOutlined, LinkOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import NodeCard from './NodeCard';
import S3ConfigView from './S3ConfigView';
import EditEnvModal from './modals/EditEnvModal';

export default function EnvDetailView({ envId }) {
  const { environments } = useApp();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const env = environments.find(e => e.id === envId);
  if (!env) return <div>环境不存在</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#1a1a2e' }}>{env.name}</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {env.cpuArch && <Tag color="blue">{env.cpuArch}</Tag>}
            {env.model && <Tag color="green">{env.model}</Tag>}
            {env.form && <Tag color="orange">{env.form}</Tag>}
            {env.disk && <Tag color="purple">{env.disk}</Tag>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {env.managementUrl && (
            <Button type="primary" icon={<LinkOutlined />} href={env.managementUrl} target="_blank"
              style={{ background: 'linear-gradient(135deg, #3a7bd5, #00d2ff)', border: 'none', borderRadius: 10 }}>
              管理界面
            </Button>
          )}
          <Button icon={<EditOutlined />} onClick={() => setEditModalOpen(true)}>编辑</Button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, #3a7bd5, #00d2ff)', borderRadius: 2 }} />
          <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 13 }}>节点信息</span>
          <Tag style={{ marginLeft: 4 }}>{env.nodes.length} 节点</Tag>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {env.nodes.map(node => <NodeCard key={node.name} node={node} />)}
        </div>
      </div>

      <S3ConfigView s3Config={env.s3Config} />

      <EditEnvModal env={env} open={editModalOpen} onClose={() => setEditModalOpen(false)} />
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/EnvDetailView.jsx client/src/components/NodeCard.jsx client/src/components/S3ConfigView.jsx client/src/utils/format.js
git commit -m "feat: add environment detail view with node cards and S3 config"
```

---

### Task 14: Frontend — Bucket Objects View

**Files:**
- Create: `client/src/components/BucketObjectsView.jsx`

- [ ] **Step 1: Create BucketObjectsView.jsx**

```jsx
import React, { useEffect, useState } from 'react';
import { Table, Button, message, Popconfirm } from 'antd';
import { ReloadOutlined, UploadOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import { listObjects, deleteObject } from '../services/api';
import { formatBytes, formatDate } from '../utils/format';
import UploadModal from './modals/UploadModal';
import DownloadModal from './modals/DownloadModal';

export default function BucketObjectsView({ envId, bucket }) {
  const { addLog, environments } = useApp();
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState(null);

  const envName = environments.find(e => e.id === envId)?.name || envId;

  const loadObjects = async () => {
    setLoading(true);
    try {
      const result = await listObjects(envId, bucket);
      setObjects(result);
      addLog('SUCCESS', '列举对象', `${bucket}, 返回 ${result.length} 个对象`);
    } catch (err) {
      addLog('FAILED', '列举对象', `${bucket}, ${err.message}`);
    }
    setLoading(false);
  };

  useEffect(() => { loadObjects(); }, [envId, bucket]);

  const handleDelete = async (key) => {
    try {
      await deleteObject(envId, bucket, key);
      addLog('SUCCESS', '删除对象', `${bucket}/${key}`);
      message.success('删除成功');
      loadObjects();
    } catch (err) {
      addLog('FAILED', '删除对象', err.message);
      message.error(err.message);
    }
  };

  const columns = [
    { title: '对象 Key', dataIndex: 'Key', key: 'key', render: (text) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{text}</span> },
    { title: '大小', dataIndex: 'Size', key: 'size', width: 80, render: (v) => formatBytes(v) },
    { title: '修改时间', dataIndex: 'LastModified', key: 'time', width: 100, render: (v) => formatDate(v) },
    {
      title: '操作', key: 'actions', width: 70,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <DownloadOutlined style={{ color: '#e65100', cursor: 'pointer' }} onClick={() => setDownloadTarget({ key: record.Key, size: record.Size })} />
          <Popconfirm title={`确定删除 ${record.Key}?`} onConfirm={() => handleDelete(record.Key)}>
            <DeleteOutlined style={{ color: '#ef4444', cursor: 'pointer' }} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>&#128230;</span>
          <span style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 15 }}>{bucket}</span>
          <span style={{ background: '#eef5ff', color: '#3a7bd5', padding: '2px 8px', borderRadius: 8, fontSize: 9 }}>{objects.length} 个对象</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button icon={<ReloadOutlined />} onClick={loadObjects} loading={loading}>刷新</Button>
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalOpen(true)}
            style={{ background: 'linear-gradient(135deg, #2e7d32, #4caf50)', border: 'none', borderRadius: 6 }}>
            上传对象
          </Button>
        </div>
      </div>

      <Table
        dataSource={objects}
        columns={columns}
        rowKey="Key"
        size="small"
        loading={loading}
        pagination={false}
        style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8ecf1' }}
      />

      <UploadModal open={uploadModalOpen} envId={envId} bucket={bucket} onClose={() => setUploadModalOpen(false)} onSuccess={loadObjects} />
      {downloadTarget && (
        <DownloadModal open={true} envId={envId} bucket={bucket} target={downloadTarget} onClose={() => setDownloadTarget(null)} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/BucketObjectsView.jsx
git commit -m "feat: add bucket objects view with table, upload, download, delete"
```

---

### Task 15: Frontend — Commands View

**Files:**
- Create: `client/src/components/CommandsView.jsx`

- [ ] **Step 1: Create CommandsView.jsx**

```jsx
import React, { useEffect, useState } from 'react';
import { Table, Button, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import { getCommands, deleteCommand } from '../services/api';
import EditCommandModal from './modals/EditCommandModal';

export default function CommandsView() {
  const { commands, setCommands, addLog } = useApp();
  const [editTarget, setEditTarget] = useState(null); // null = closed, {} = new, {id,...} = edit

  useEffect(() => { loadCommands(); }, []);

  async function loadCommands() {
    const cmds = await getCommands();
    setCommands(cmds);
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
    addLog('SUCCESS', '快捷命令', `复制: ${text.substring(0, 40)}`);
  };

  const handleDelete = async (id) => {
    await deleteCommand(id);
    addLog('SUCCESS', '快捷命令', '已删除');
    loadCommands();
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 120 },
    { title: '命令模板', dataIndex: 'template', key: 'template', render: (t) => <code>{t}</code> },
    { title: '描述', dataIndex: 'description', key: 'desc', width: 150 },
    {
      title: '操作', key: 'actions', width: 120,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(record.template)}>复制</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => setEditTarget(record)} />
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0 }}>快捷命令</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditTarget({})}>添加命令</Button>
      </div>
      <Table dataSource={commands} columns={columns} rowKey="id" size="small" />
      {editTarget !== null && (
        <EditCommandModal command={editTarget} onClose={() => { setEditTarget(null); loadCommands(); }} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/CommandsView.jsx
git commit -m "feat: add quick commands management view"
```

---

### Task 16: Frontend — All Modals

**Files:**
- Create: `client/src/components/modals/AddEnvModal.jsx`
- Create: `client/src/components/modals/EditEnvModal.jsx`
- Create: `client/src/components/modals/CreateBucketModal.jsx`
- Create: `client/src/components/modals/UploadModal.jsx`
- Create: `client/src/components/modals/DownloadModal.jsx`
- Create: `client/src/components/modals/EditCommandModal.jsx`

- [ ] **Step 1: Create AddEnvModal.jsx**

```jsx
import React, { useState } from 'react';
import { Modal, Input, message } from 'antd';
import { useApp } from '../../context/AppContext';
import { parseAndAddEnvironment, getEnvironments } from '../../services/api';

export default function AddEnvModal({ open, onClose }) {
  const { setEnvironments, addLog } = useApp();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const result = await parseAndAddEnvironment(text);
      addLog('SUCCESS', '环境解析', `成功添加: ${result.data.name}`);
      const envs = await getEnvironments();
      setEnvironments(envs);
      message.success('环境添加成功');
      setText('');
      onClose();
    } catch (err) {
      addLog('FAILED', '环境解析', err.message);
      message.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal title="导入环境配置" open={open} onCancel={onClose} onOk={handleImport} confirmLoading={loading} okText="确认导入" width={640}>
      <Input.TextArea
        value={text} onChange={(e) => setText(e.target.value)}
        rows={15} placeholder="粘贴环境信息文本..."
        style={{ fontFamily: 'monospace', fontSize: 12 }}
      />
    </Modal>
  );
}
```

- [ ] **Step 2: Create EditEnvModal.jsx**

```jsx
import React, { useState } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { useApp } from '../../context/AppContext';
import { updateEnvironment, getEnvironments } from '../../services/api';

export default function EditEnvModal({ env, open, onClose }) {
  const { setEnvironments, addLog } = useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState(env?.nodes || []);

  React.useEffect(() => {
    if (env && open) {
      form.setFieldsValue({ ...env, s3Endpoint: env.s3Config?.endpoint, s3Ak: env.s3Config?.ak, s3Sk: env.s3Config?.sk });
      setNodes(env.nodes || []);
    }
  }, [env, open]);

  const handleSave = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      const updated = {
        ...values,
        nodes,
        s3Config: { endpoint: values.s3Endpoint, ak: values.s3Ak, sk: values.s3Sk },
      };
      delete updated.s3Endpoint; delete updated.s3Ak; delete updated.s3Sk;
      await updateEnvironment(env.id, updated);
      addLog('SUCCESS', '环境更新', `${env.name}, 修改了 ${Object.keys(values).length} 个字段`);
      setEnvironments(await getEnvironments());
      message.success('保存成功');
      onClose();
    } catch (err) {
      message.error(err.message);
    }
    setLoading(false);
  };

  const addNode = () => setNodes([...nodes, { name: '', internalIp: '', externalIp: '', credentials: '' }]);
  const removeNode = (i) => setNodes(nodes.filter((_, idx) => idx !== i));
  const updateNode = (i, field, val) => {
    const next = [...nodes]; next[i][field] = val; setNodes(next);
  };

  return (
    <Modal title="编辑环境信息" open={open} onCancel={onClose} onOk={handleSave} confirmLoading={loading} okText="保存修改" width={700}>
      <Form form={form} layout="vertical" size="small">
        <Form.Item label="环境名称" name="name" rules={[{ required: true }]}><Input /></Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Form.Item label="CPU架构" name="cpuArch"><Input /></Form.Item>
          <Form.Item label="型号" name="model"><Input /></Form.Item>
          <Form.Item label="形态" name="form"><Input /></Form.Item>
          <Form.Item label="磁盘" name="disk"><Input /></Form.Item>
          <Form.Item label="管理界面" name="managementUrl"><Input /></Form.Item>
          <Form.Item label="账号" name="account"><Input /></Form.Item>
        </div>

        <div style={{ fontWeight: 600, marginBottom: 8, marginTop: 12 }}>节点信息 <Button size="small" onClick={addNode}>+ 添加节点</Button></div>
        {nodes.map((n, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
            <Input placeholder="名称" value={n.name} onChange={(e) => updateNode(i, 'name', e.target.value)} style={{ width: 80 }} />
            <Input placeholder="内网IP" value={n.internalIp} onChange={(e) => updateNode(i, 'internalIp', e.target.value)} />
            <Input placeholder="外网IP" value={n.externalIp} onChange={(e) => updateNode(i, 'externalIp', e.target.value)} />
            <Input placeholder="凭证" value={n.credentials} onChange={(e) => updateNode(i, 'credentials', e.target.value)} style={{ width: 120 }} />
            <Button danger size="small" onClick={() => removeNode(i)}>-</Button>
          </div>
        ))}

        <div style={{ fontWeight: 600, marginBottom: 8, marginTop: 12 }}>S3配置</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <Form.Item label="Endpoint" name="s3Endpoint"><Input /></Form.Item>
          <Form.Item label="AK" name="s3Ak"><Input /></Form.Item>
          <Form.Item label="SK" name="s3Sk"><Input /></Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
```

- [ ] **Step 3: Create CreateBucketModal.jsx**

```jsx
import React, { useState } from 'react';
import { Modal, Input, message } from 'antd';
import { useApp } from '../../context/AppContext';
import { createBucket } from '../../services/api';

export default function CreateBucketModal({ envId, onClose }) {
  const { addLog, setBuckets, buckets } = useApp();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createBucket(envId, name);
      addLog('SUCCESS', '创建桶', name);
      const { listBuckets: lb } = await import('../../services/api');
      const result = await lb(envId);
      setBuckets(prev => ({ ...prev, [envId]: result }));
      message.success('创建成功');
      onClose();
    } catch (err) {
      addLog('FAILED', '创建桶', err.message);
      message.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal title="创建桶" open={!!envId} onCancel={onClose} onOk={handleCreate} confirmLoading={loading} okText="创建">
      <Input placeholder="桶名称" value={name} onChange={(e) => setName(e.target.value)} />
    </Modal>
  );
}
```

- [ ] **Step 4: Create UploadModal.jsx**

```jsx
import React, { useState } from 'react';
import { Modal, Input, Upload, Radio, Select, Progress, message } from 'antd';
import { useApp } from '../../context/AppContext';
import { uploadObject } from '../../services/api';

export default function UploadModal({ open, envId, bucket, onClose, onSuccess }) {
  const { addLog } = useApp();
  const [file, setFile] = useState(null);
  const [key, setKey] = useState('');
  const [mode, setMode] = useState('normal');
  const [partSize, setPartSize] = useState('8');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file || !key) return message.warning('请选择文件并填写Key');
    setLoading(true);
    try {
      await uploadObject(envId, { bucket, key, file, mode, partSize }, setProgress);
      addLog('SUCCESS', 'S3 上传', `${bucket}/${key}, ${mode === 'multipart' ? `多段(${partSize}MB)` : '普通'}`);
      message.success('上传成功');
      onSuccess();
      onClose();
    } catch (err) {
      addLog('FAILED', 'S3 上传', err.message);
      message.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal title={`上传对象到 ${bucket}`} open={open} onCancel={onClose} onOk={handleUpload} confirmLoading={loading} okText="开始上传" width={480}>
      <div style={{ marginBottom: 12 }}>
        <Upload beforeUpload={(f) => { setFile(f); setKey(f.name); return false; }} maxCount={1} accept="*">
          <div style={{ border: '2px dashed #d0d5dd', borderRadius: 8, padding: 16, textAlign: 'center', cursor: 'pointer' }}>
            {file ? <span>{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</span> : '点击选择文件'}
          </div>
        </Upload>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>S3 Key</div>
        <Input value={key} onChange={(e) => setKey(e.target.value)} style={{ fontFamily: 'monospace' }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>上传模式</div>
        <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
          <Radio value="normal">普通上传</Radio>
          <Radio value="multipart">多段上传</Radio>
        </Radio.Group>
      </div>
      {mode === 'multipart' && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>分段大小</div>
          <Select value={partSize} onChange={setPartSize} style={{ width: '100%' }}>
            <Select.Option value="5">5 MB</Select.Option>
            <Select.Option value="8">8 MB</Select.Option>
            <Select.Option value="16">16 MB</Select.Option>
            <Select.Option value="32">32 MB</Select.Option>
          </Select>
        </div>
      )}
      {loading && <Progress percent={progress} size="small" />}
    </Modal>
  );
}
```

- [ ] **Step 5: Create DownloadModal.jsx**

```jsx
import React, { useState } from 'react';
import { Modal, Input, message } from 'antd';
import { useApp } from '../../context/AppContext';
import { downloadObject } from '../../services/api';
import { formatBytes } from '../../utils/format';

export default function DownloadModal({ open, envId, bucket, target, onClose }) {
  const { addLog } = useApp();
  const [filename, setFilename] = useState(target?.key?.split('/').pop() || '');
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await downloadObject(envId, bucket, target.key);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({ suggestedName: filename });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
      }
      URL.revokeObjectURL(url);
      addLog('SUCCESS', 'S3 下载', `${bucket}/${target.key}`);
      message.success('下载完成');
      onClose();
    } catch (err) {
      addLog('FAILED', 'S3 下载', err.message);
      message.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal title="下载对象" open={open} onCancel={onClose} onOk={handleDownload} confirmLoading={loading} okText="开始下载" width={420}>
      <div style={{ background: '#f8f9fb', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: '#8c939d' }}>S3 路径</div>
        <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>{bucket} / {target?.key}</div>
        <div style={{ fontSize: 9, color: '#8c939d', marginTop: 4 }}>大小: {formatBytes(target?.size)}</div>
      </div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>文件名</div>
        <Input value={filename} onChange={(e) => setFilename(e.target.value)} />
      </div>
    </Modal>
  );
}
```

- [ ] **Step 6: Create EditCommandModal.jsx**

```jsx
import React, { useState } from 'react';
import { Modal, Input, message } from 'antd';
import { useApp } from '../../context/AppContext';
import { createCommand, updateCommand } from '../../services/api';

export default function EditCommandModal({ command, onClose }) {
  const { addLog } = useApp();
  const isEdit = !!command.id;
  const [name, setName] = useState(command.name || '');
  const [template, setTemplate] = useState(command.template || '');
  const [description, setDescription] = useState(command.description || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !template) return message.warning('名称和模板必填');
    setLoading(true);
    try {
      if (isEdit) {
        await updateCommand(command.id, { name, template, description });
      } else {
        await createCommand({ name, template, description });
      }
      addLog('SUCCESS', '快捷命令', `${isEdit ? '更新' : '创建'}: ${name}`);
      message.success('保存成功');
      onClose();
    } catch (err) {
      message.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal title={isEdit ? '编辑命令' : '添加命令'} open={true} onCancel={onClose} onOk={handleSave} confirmLoading={loading} okText="保存">
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>命令名称</div>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="如: Ping外网IP" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>命令模板</div>
        <Input.TextArea value={template} onChange={(e) => setTemplate(e.target.value)} rows={3} style={{ fontFamily: 'monospace' }}
          placeholder="支持变量: {internalIp} {externalIp} {credentials} {nodeName}" />
      </div>
      <div>
        <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>描述</div>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
    </Modal>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add client/src/components/modals/
git commit -m "feat: add all modals (add/edit env, create bucket, upload, download, edit command)"
```

---

### Task 17: Integration & Verification

- [ ] **Step 1: Ensure data directory exists and start both servers**

Run: `mkdir -p data && npm run dev`

- [ ] **Step 2: Test full flow in browser at http://localhost:5173**

1. Click "添加环境", paste sample environment text, confirm import
2. Verify left sidebar shows environment with bucket list
3. Click "环境信息", verify node cards, S3 config, management URL button
4. Click a bucket, verify object list loads
5. Test upload modal: select file, choose mode, upload
6. Test download: click download icon, verify file saves
7. Click "快捷命令", add/edit/delete commands, verify copy works
8. Check log panel at bottom: all operations should be logged

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete S3 environment operations platform"
```
