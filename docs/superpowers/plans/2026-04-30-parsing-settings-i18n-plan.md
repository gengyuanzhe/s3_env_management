# 解析容错、设置系统、Xshell 启动与界面英文化 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 提升 S3 EnvOps 平台的解析容错性，新增设置系统支持 Xshell 启动和默认上传/下载目录，并将界面全面英文化。

**Architecture:** 后端新增 settings 存储层和三个路由（settings、ssh、files），修改现有 s3 路由支持本地文件操作。前端新增 SettingsModal，修改 NodeCard/UploadModal/DownloadModal，所有组件中文替换为英文。

**Tech Stack:** Node.js + Express 4 (ESM), React 18 + Ant Design 5, child_process, fs/promises

---

## 文件结构

### 新增文件
- `server/src/routes/settings.js` — 全局设置 CRUD 路由
- `server/src/routes/ssh.js` — Xshell 启动路由
- `server/src/routes/files.js` — 本地文件列表路由
- `client/src/components/modals/SettingsModal.jsx` — 全局设置弹窗

### 修改文件
- `server/src/services/parser.js` — 解析容错改进
- `server/src/services/storage.js` — 新增 settings 读写函数
- `server/src/routes/s3.js` — 下载支持本地保存，上传支持本地文件
- `server/src/index.js` — 注册新路由
- `client/src/services/api.js` — 新增 API 调用函数
- `client/src/components/NodeCard.jsx` — 移除内网 IP，Xshell 改 API
- `client/src/components/TopNav.jsx` — 增加设置齿轮图标
- `client/src/components/modals/UploadModal.jsx` — 支持后端文件列表
- `client/src/components/modals/DownloadModal.jsx` — 支持直接保存
- `client/src/components/modals/EditEnvModal.jsx` — 增加 uploadDir/downloadDir
- `client/src/components/Sidebar.jsx` — 英文化
- `client/src/components/LogPanel.jsx` — 英文化
- `client/src/components/EnvDetailView.jsx` — 英文化
- `client/src/components/BucketObjectsView.jsx` — 英文化
- `client/src/components/S3ConfigView.jsx` — 英文化
- `client/src/components/CommandsView.jsx` — 英文化
- `client/src/components/modals/AddEnvModal.jsx` — 英文化
- `client/src/components/modals/CreateBucketModal.jsx` — 英文化
- `client/src/components/modals/EditCommandModal.jsx` — 英文化

---

### Task 1: 解析容错

**Files:**
- Modify: `server/src/services/parser.js`

- [ ] **Step 1: 修改 parser.js — 节点区域检测和正则改进**

将整个 `parseEnvironmentText` 函数替换为：

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
    uploadDir: '',
    downloadDir: '',
    nodes: [],
    s3Config: { endpoint: '', ak: '', sk: '' },
    createdAt: new Date().toISOString(),
  };

  const lines = text.split('\n').map(l => l.trimEnd());

  function match(line, pattern) {
    const m = line.trim().match(pattern);
    return m ? m[1].trim() : null;
  }

  let inNodeZone = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('---')) continue;

    // Detect section markers
    if (/^节点\s*:?\s*$/.test(trimmed)) { inNodeZone = true; continue; }
    if (/^S3配置\s*:?\s*$/.test(trimmed)) { inNodeZone = false; }

    // Key-value fields
    let v;
    if ((v = match(line, /^环境名称\s*:?\s*(.+)/))) { env.name = v; continue; }
    if ((v = match(line, /^环境ID\s*:?\s*(.+)/))) { env.envId = v; continue; }
    if ((v = match(line, /^实例ID\s*:?\s*(.+)/))) { env.instanceId = v; continue; }
    if ((v = match(line, /^型号\s*:?\s*(.+)/))) { env.model = v; continue; }
    if ((v = match(line, /^CPU架构\s*:?\s*(.+)/))) { env.cpuArch = v; continue; }
    if ((v = match(line, /^形态\s*:?\s*(.+)/))) { env.form = v; continue; }
    if ((v = match(line, /^盘\s*:?\s*(.+)/))) { env.disk = v; continue; }
    if ((v = match(line, /^管理界面\s*:?\s*(.+)/))) { env.managementUrl = v; continue; }
    if ((v = match(line, /^账号\s*:?\s*(.+)/))) { env.account = v; continue; }
    if ((v = match(line, /^密码\s*:?\s*(.+)/))) { env.password = v; continue; }
    if ((v = match(line, /^SDE Name\s*:?\s*(.+)/))) { env.sdeName = v; continue; }
    if ((v = match(line, /^Endpoint\s*:?\s*(.+)/))) { env.s3Config.endpoint = v; continue; }
    if ((v = match(line, /^AK\s*:?\s*(.+)/))) { env.s3Config.ak = v; continue; }
    if ((v = match(line, /^SK\s*:?\s*(.+)/))) { env.s3Config.sk = v; continue; }

    // Node parsing: support both indented and non-indented, with or without password
    if (inNodeZone) {
      const nodeWithCreds = trimmed.match(/^(\S+)\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)\s+(\S+\/\S+)/);
      const nodeNoPass = trimmed.match(/^(\S+)\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)\s+(\S+)/);
      const m = nodeWithCreds || nodeNoPass;
      if (m) {
        env.nodes.push({
          name: m[1],
          internalIp: m[2],
          externalIp: m[3],
          credentials: m[4],
        });
        continue;
      }
    }
  }

  if (!env.name) errors.push('环境名称未解析到');
  if (env.nodes.length === 0) errors.push('未解析到节点信息');

  return { data: env, errors };
}
```

- [ ] **Step 2: 手动测试解析**

启动后端 `npm run dev:server`，用 curl 测试用户提供的问题文本：

```bash
curl -X POST http://localhost:34567/api/environments/parse \
  -H 'Content-Type: application/json' \
  -d '{"text":"环境名称:单FSM_modngoyp\n环境ID:163e00f3-90eb-42cc-9f6f-a427785cafe1\n实例ID:54cf5e23-9e8d-4453-8134-413841f06813\n型号:pacific\nCPU架构:arm\n形态:虚机\n盘:SATA_SSD: 960GB\n管理界面:https://7.197.106.190:8088\n账号:admin\n密码:Admi\nSDE Name:SIMUSERVICE_prod_g00471473_163e00f3-90eb-42cc-9f6f-a427785cafe1\n节点:\nFSM 192.168.22.45 7.197.106.000 root/Emulat\nFSA_0 192.168.13.8 7.241.133.00 root/Emulati\nFSA_1 192.168.27.244 7.242.242.00 root/Emulat\nCLIENT 192.168.24.164 7.236.202.00 root/Emul\n\nS3配置:\nEndpoint: http://7.243.69.151:5080\nAK: 7D440DC8B4040A6D2B65\nSK: dEOYg8t8srGoHebDtclhSzCp"}'
```

Expected: 返回包含 4 个节点和 S3 配置的 JSON，无 errors。

- [ ] **Step 3: 提交**

```bash
git add server/src/services/parser.js
git commit -m "feat: improve parser tolerance for unindented nodes and no-password credentials"
```

---

### Task 2: 设置存储后端

**Files:**
- Modify: `server/src/services/storage.js`
- Create: `server/src/routes/settings.js`
- Modify: `server/src/index.js`

- [ ] **Step 1: 在 storage.js 新增 settings 读写函数**

在 `server/src/services/storage.js` 末尾添加：

```js
export async function readSettings() {
  try {
    const content = await fs.readFile(filePath('settings.json'), 'utf-8');
    return JSON.parse(content);
  } catch {
    return { xshellPath: '', defaultUploadDir: '', defaultDownloadDir: '' };
  }
}

export async function writeSettings(data) {
  await ensureDataDir();
  await fs.writeFile(filePath('settings.json'), JSON.stringify(data, null, 2), 'utf-8');
  return data;
}
```

- [ ] **Step 2: 创建 settings 路由**

创建 `server/src/routes/settings.js`：

```js
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
```

- [ ] **Step 3: 在 index.js 注册 settings 路由**

在 `server/src/index.js` 中添加 import 和路由注册：

在 import 区域添加：
```js
import settingsRouter from './routes/settings.js';
```

在路由注册区域添加：
```js
app.use('/api/settings', settingsRouter);
```

- [ ] **Step 4: 测试 settings API**

```bash
# 读取（首次应返回默认值）
curl http://localhost:34567/api/settings

# 更新
curl -X PUT http://localhost:34567/api/settings \
  -H 'Content-Type: application/json' \
  -d '{"xshellPath":"C:\\Program Files (x86)\\NetSarang\\Xshell 8\\Xshell.exe","defaultUploadDir":"","defaultDownloadDir":""}'
```

Expected: GET 返回默认空值；PUT 返回更新后的 JSON。

- [ ] **Step 5: 提交**

```bash
git add server/src/services/storage.js server/src/routes/settings.js server/src/index.js
git commit -m "feat: add settings storage and CRUD API"
```

---

### Task 3: Xshell 启动后端

**Files:**
- Create: `server/src/routes/ssh.js`
- Modify: `server/src/index.js`

- [ ] **Step 1: 创建 ssh 路由**

创建 `server/src/routes/ssh.js`：

```js
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
```

- [ ] **Step 2: 在 index.js 注册 ssh 路由**

在 `server/src/index.js` 中添加 import 和路由注册：

```js
import sshRouter from './routes/ssh.js';
```

```js
app.use('/api/ssh', sshRouter);
```

- [ ] **Step 3: 提交**

```bash
git add server/src/routes/ssh.js server/src/index.js
git commit -m "feat: add Xshell launch API via child_process"
```

---

### Task 4: 文件列表后端

**Files:**
- Create: `server/src/routes/files.js`
- Modify: `server/src/index.js`

- [ ] **Step 1: 创建 files 路由**

创建 `server/src/routes/files.js`：

```js
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
```

- [ ] **Step 2: 在 index.js 注册 files 路由**

在 `server/src/index.js` 中添加 import 和路由注册：

```js
import filesRouter from './routes/files.js';
```

```js
app.use('/api/files', filesRouter);
```

- [ ] **Step 3: 提交**

```bash
git add server/src/routes/files.js server/src/index.js
git commit -m "feat: add file listing API for local directories"
```

---

### Task 5: 上传/下载后端改动

**Files:**
- Modify: `server/src/routes/s3.js`

- [ ] **Step 1: 修改下载路由支持本地保存**

在 `server/src/routes/s3.js` 顶部添加 import：

```js
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
```

替换整个 download 路由处理器（`router.get('/:envId/download', ...)`）：

```js
router.get('/:envId/download', async (req, res) => {
  try {
    const { bucket, key, saveToDir } = req.query;
    if (!bucket || !key) return res.status(400).json({ error: 'bucket and key required' });

    const client = await getS3Client(req.params.envId);
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));

    if (saveToDir) {
      const chunks = [];
      for await (const chunk of result.Body) { chunks.push(chunk); }
      const buffer = Buffer.concat(chunks);
      const filename = key.split('/').pop();
      await mkdir(saveToDir, { recursive: true });
      await writeFile(path.join(saveToDir, filename), buffer);
      return res.json({ success: true, savedPath: path.join(saveToDir, filename) });
    }

    const filename = key.split('/').pop();
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', result.ContentType || 'application/octet-stream');
    if (result.ContentLength) res.setHeader('Content-Length', result.ContentLength);
    for await (const chunk of result.Body) { res.write(chunk); }
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

- [ ] **Step 2: 修改上传路由支持本地文件**

在 `server/src/routes/s3.js` 顶部添加 import：

```js
import { readFile as readFileFs } from 'fs/promises';
```

替换整个 upload 路由处理器（`router.post('/:envId/upload', ...)`）：

```js
router.post('/:envId/upload', upload.single('file'), async (req, res) => {
  try {
    const { bucket, key, mode, partSize, localFilePath } = req.body;
    if (!bucket || !key) return res.status(400).json({ error: 'bucket and key required' });

    const client = await getS3Client(req.params.envId);

    let buffer;
    let fileSize;
    if (localFilePath) {
      buffer = await readFileFs(localFilePath);
      fileSize = buffer.length;
    } else {
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'file or localFilePath required' });
      buffer = file.buffer;
      fileSize = file.size;
    }

    if (mode === 'multipart' && fileSize > 5 * 1024 * 1024) {
      const partBytes = (parseInt(partSize) || 5) * 1024 * 1024;
      const mpu = await client.send(new CreateMultipartUploadCommand({ Bucket: bucket, Key: key }));
      const parts = [];
      let partNum = 1;
      for (let offset = 0; offset < buffer.length; offset += partBytes) {
        const chunk = buffer.slice(offset, Math.min(offset + partBytes, buffer.length));
        const result = await client.send(new UploadPartCommand({
          Bucket: bucket, Key: key, UploadId: mpu.UploadId,
          PartNumber: partNum, Body: chunk,
        }));
        parts.push({ PartNumber: partNum, ETag: result.ETag });
        partNum++;
      }
      await client.send(new CompleteMultipartUploadCommand({
        Bucket: bucket, Key: key, UploadId: mpu.UploadId,
        MultipartUpload: { Parts: parts },
      }));
    } else {
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer }));
    }

    res.json({ success: true, key, size: fileSize });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

- [ ] **Step 3: 提交**

```bash
git add server/src/routes/s3.js
git commit -m "feat: support local file save on download and local file upload"
```

---

### Task 6: 前端 API 层

**Files:**
- Modify: `client/src/services/api.js`

- [ ] **Step 1: 添加 settings、ssh、files、上传/下载新 API 函数**

在 `client/src/services/api.js` 末尾添加：

```js
// Settings
export async function getSettings() {
  const res = await request('/settings');
  return res.json();
}

export async function updateSettings(data) {
  const res = await request('/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

// SSH
export async function launchSsh({ externalIp, credentials }) {
  const res = await request('/ssh/launch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ externalIp, credentials }),
  });
  return res.json();
}

// Files
export async function listLocalFiles(dir) {
  const res = await request(`/files/list?dir=${encodeURIComponent(dir)}`);
  return res.json();
}

// Upload from local path
export async function uploadFromLocal(envId, { bucket, key, localFilePath, mode, partSize }) {
  const res = await request(`/s3/${envId}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, key, localFilePath, mode: mode || 'normal', partSize: partSize || '5' }),
  });
  return res.json();
}

// Download to local dir
export async function downloadToLocal(envId, bucket, key, saveToDir) {
  const res = await request(`/s3/${envId}/download?bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}&saveToDir=${encodeURIComponent(saveToDir)}`);
  return res.json();
}
```

- [ ] **Step 2: 提交**

```bash
git add client/src/services/api.js
git commit -m "feat: add frontend API functions for settings, ssh, files, local upload/download"
```

---

### Task 7: SettingsModal + TopNav

**Files:**
- Create: `client/src/components/modals/SettingsModal.jsx`
- Modify: `client/src/components/TopNav.jsx`

- [ ] **Step 1: 创建 SettingsModal**

创建 `client/src/components/modals/SettingsModal.jsx`：

```jsx
import React, { useState, useEffect } from 'react';
import { Modal, Input, message } from 'antd';
import { getSettings, updateSettings } from '../../services/api';

export default function SettingsModal({ open, onClose }) {
  const [xshellPath, setXshellPath] = useState('');
  const [uploadDir, setUploadDir] = useState('');
  const [downloadDir, setDownloadDir] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      getSettings().then(s => {
        setXshellPath(s.xshellPath || '');
        setUploadDir(s.defaultUploadDir || '');
        setDownloadDir(s.defaultDownloadDir || '');
      });
    }
  }, [open]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateSettings({ xshellPath, defaultUploadDir: uploadDir, defaultDownloadDir: downloadDir });
      message.success('Settings saved');
      onClose();
    } catch (err) {
      message.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal title="Global Settings" open={open} onCancel={onClose} onOk={handleSave} confirmLoading={loading} okText="Save" width={520}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: '#8c939d', marginBottom: 4 }}>Xshell Path</div>
        <Input value={xshellPath} onChange={(e) => setXshellPath(e.target.value)} placeholder='e.g. C:\Program Files\Xshell.exe' style={{ fontFamily: 'monospace' }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: '#8c939d', marginBottom: 4 }}>Default Upload Directory</div>
        <Input value={uploadDir} onChange={(e) => setUploadDir(e.target.value)} placeholder='e.g. D:\uploads' style={{ fontFamily: 'monospace' }} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#8c939d', marginBottom: 4 }}>Default Download Directory</div>
        <Input value={downloadDir} onChange={(e) => setDownloadDir(e.target.value)} placeholder='e.g. D:\downloads' style={{ fontFamily: 'monospace' }} />
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: 修改 TopNav — 添加设置齿轮图标 + 英文化**

替换 `client/src/components/TopNav.jsx` 全部内容：

```jsx
import React, { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined, SettingOutlined } from '@ant-design/icons';
import AddEnvModal from './modals/AddEnvModal';
import SettingsModal from './modals/SettingsModal';

export default function TopNav() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  return (
    <>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
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
            <div style={{ color: '#64748b', fontSize: 9, letterSpacing: 0.5 }}>Environment Operations Platform</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button
            icon={<SettingOutlined />}
            onClick={() => setSettingsModalOpen(true)}
            style={{ borderRadius: 20, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddModalOpen(true)}
            style={{ borderRadius: 20, background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', border: 'none' }}
          >
            Add Environment
          </Button>
        </div>
      </div>
      <AddEnvModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
      <SettingsModal open={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
    </>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add client/src/components/modals/SettingsModal.jsx client/src/components/TopNav.jsx
git commit -m "feat: add SettingsModal and settings gear icon in TopNav"
```

---

### Task 8: NodeCard — 移除内网 IP + Xshell 改 API

**Files:**
- Modify: `client/src/components/NodeCard.jsx`

- [ ] **Step 1: 重写 NodeCard**

替换 `client/src/components/NodeCard.jsx` 全部内容：

```jsx
import React from 'react';
import { Tag, Button, message } from 'antd';
import { CodeOutlined } from '@ant-design/icons';
import { launchSsh } from '../services/api';

function getNodeRole(name) {
  if (name.startsWith('FSM')) return { label: 'Master', color: 'blue' };
  if (name.startsWith('FSA')) return { label: 'Slave', color: 'default' };
  if (name.startsWith('CLIENT')) return { label: 'Client', color: 'orange' };
  return { label: 'Node', color: 'default' };
}

export default function NodeCard({ node }) {
  const role = getNodeRole(node.name);

  const handleXshell = async () => {
    try {
      await launchSsh({ externalIp: node.externalIp, credentials: node.credentials });
      message.success('Xshell launch command sent');
    } catch (err) {
      message.error(err.message);
    }
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: 14,
      border: '1px solid #e8ecf1', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 13 }}>{node.name}</span>
        <Tag color={role.color} style={{ margin: 0, fontSize: 9 }}>{role.label}</Tag>
      </div>
      <div style={{ fontSize: 10, color: '#5a6377', marginBottom: 10 }}>
        External IP: <span style={{ color: '#1a1a2e', fontWeight: 500 }}>{node.externalIp}</span>
      </div>
      <div style={{ fontSize: 10, color: '#5a6377', marginBottom: 10 }}>
        Credentials: <span style={{ fontFamily: 'monospace' }}>{node.credentials}</span>
      </div>
      <Button
        size="small"
        icon={<CodeOutlined />}
        onClick={handleXshell}
        style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', color: '#fff', border: 'none', borderRadius: 6 }}
      >
        Xshell
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add client/src/components/NodeCard.jsx
git commit -m "feat: remove internal IP display, Xshell via backend API"
```

---

### Task 9: EditEnvModal 扩展

**Files:**
- Modify: `client/src/components/modals/EditEnvModal.jsx`

- [ ] **Step 1: 重写 EditEnvModal — 增加上传/下载目录 + 英文化**

替换 `client/src/components/modals/EditEnvModal.jsx` 全部内容：

```jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Collapse, message } from 'antd';
import { useApp } from '../../context/AppContext';
import { updateEnvironment, getEnvironments } from '../../services/api';

export default function EditEnvModal({ env, open, onClose }) {
  const { setEnvironments, addLog } = useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    if (env && open) {
      form.setFieldsValue({
        ...env,
        s3Endpoint: env.s3Config?.endpoint,
        s3Ak: env.s3Config?.ak,
        s3Sk: env.s3Config?.sk,
      });
      setNodes([...(env.nodes || [])]);
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
      addLog('SUCCESS', 'Update Env', env.name);
      setEnvironments(await getEnvironments());
      message.success('Saved');
      onClose();
    } catch (err) {
      message.error(err.message);
    }
    setLoading(false);
  };

  const addNode = () => setNodes([...nodes, { name: '', internalIp: '', externalIp: '', credentials: '' }]);
  const removeNode = (i) => setNodes(nodes.filter((_, idx) => idx !== i));
  const updateNode = (i, field, val) => {
    const next = [...nodes]; next[i] = { ...next[i], [field]: val }; setNodes(next);
  };

  return (
    <Modal title="Edit Environment" open={open} onCancel={onClose} onOk={handleSave} confirmLoading={loading} okText="Save" width={700}>
      <Form form={form} layout="vertical" size="small">
        <Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Form.Item label="CPU Arch" name="cpuArch"><Input /></Form.Item>
          <Form.Item label="Model" name="model"><Input /></Form.Item>
          <Form.Item label="Form" name="form"><Input /></Form.Item>
          <Form.Item label="Disk" name="disk"><Input /></Form.Item>
          <Form.Item label="Management URL" name="managementUrl"><Input /></Form.Item>
          <Form.Item label="Account" name="account"><Input /></Form.Item>
        </div>
        <div style={{ fontWeight: 600, marginBottom: 8, marginTop: 12 }}>Nodes <Button size="small" onClick={addNode}>+ Add Node</Button></div>
        {nodes.map((n, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
            <Input placeholder="Name" value={n.name} onChange={(e) => updateNode(i, 'name', e.target.value)} style={{ width: 80 }} />
            <Input placeholder="Internal IP" value={n.internalIp} onChange={(e) => updateNode(i, 'internalIp', e.target.value)} />
            <Input placeholder="External IP" value={n.externalIp} onChange={(e) => updateNode(i, 'externalIp', e.target.value)} />
            <Input placeholder="Credentials" value={n.credentials} onChange={(e) => updateNode(i, 'credentials', e.target.value)} style={{ width: 120 }} />
            <Button danger size="small" onClick={() => removeNode(i)}>-</Button>
          </div>
        ))}
        <div style={{ fontWeight: 600, marginBottom: 8, marginTop: 12 }}>S3 Config</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <Form.Item label="Endpoint" name="s3Endpoint"><Input /></Form.Item>
          <Form.Item label="AK" name="s3Ak"><Input /></Form.Item>
          <Form.Item label="SK" name="s3Sk"><Input /></Form.Item>
        </div>
        <Collapse ghost items={[{
          key: 'advanced',
          label: 'Advanced Settings',
          children: (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Form.Item label="Upload Directory" name="uploadDir"><Input placeholder="Leave empty to use global setting" /></Form.Item>
              <Form.Item label="Download Directory" name="downloadDir"><Input placeholder="Leave empty to use global setting" /></Form.Item>
            </div>
          ),
        }]} />
      </Form>
    </Modal>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add client/src/components/modals/EditEnvModal.jsx
git commit -m "feat: add upload/download dir fields to EditEnvModal, English UI"
```

---

### Task 10: UploadModal — 支持后端文件列表

**Files:**
- Modify: `client/src/components/modals/UploadModal.jsx`

- [ ] **Step 1: 重写 UploadModal**

替换 `client/src/components/modals/UploadModal.jsx` 全部内容：

```jsx
import React, { useState, useEffect } from 'react';
import { Modal, Input, Upload, Radio, Select, Progress, message } from 'antd';
import { useApp } from '../../context/AppContext';
import { uploadObject, uploadFromLocal, listLocalFiles, getSettings, getEnvironment } from '../../services/api';

export default function UploadModal({ open, envId, bucket, onClose, onSuccess }) {
  const { addLog } = useApp();
  const [file, setFile] = useState(null);
  const [key, setKey] = useState('');
  const [mode, setMode] = useState('normal');
  const [partSize, setPartSize] = useState('8');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const [localFiles, setLocalFiles] = useState([]);
  const [selectedLocalFile, setSelectedLocalFile] = useState(null);
  const [uploadDir, setUploadDir] = useState('');

  useEffect(() => {
    if (open && envId) {
      determineUploadDir();
    }
  }, [open, envId]);

  async function determineUploadDir() {
    try {
      const env = await getEnvironment(envId);
      if (env.uploadDir) {
        setUploadDir(env.uploadDir);
        loadLocalFiles(env.uploadDir);
        return;
      }
      const settings = await getSettings();
      if (settings.defaultUploadDir) {
        setUploadDir(settings.defaultUploadDir);
        loadLocalFiles(settings.defaultUploadDir);
      }
    } catch {
      // fallback to browser file picker
    }
  }

  async function loadLocalFiles(dir) {
    try {
      const result = await listLocalFiles(dir);
      setLocalFiles(result.files || []);
    } catch {
      setLocalFiles([]);
    }
  }

  const handleUpload = async () => {
    setLoading(true);
    try {
      if (selectedLocalFile && uploadDir) {
        const localFilePath = `${uploadDir.replace(/[/\\]+$/, '')}/${selectedLocalFile}`;
        const s3Key = key || selectedLocalFile;
        await uploadFromLocal(envId, { bucket, key: s3Key, localFilePath, mode, partSize });
        addLog('SUCCESS', 'S3 Upload', `${bucket}/${s3Key} (from ${localFilePath})`);
      } else if (file) {
        await uploadObject(envId, { bucket, key: key || file.name, file, mode, partSize }, setProgress);
        addLog('SUCCESS', 'S3 Upload', `${bucket}/${key || file.name}, ${mode === 'multipart' ? `multipart(${partSize}MB)` : 'normal'}`);
      } else {
        message.warning('Please select a file');
        setLoading(false);
        return;
      }
      message.success('Upload successful');
      onSuccess();
      onClose();
    } catch (err) {
      addLog('FAILED', 'S3 Upload', err.message);
      message.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal title={`Upload to ${bucket}`} open={open} onCancel={onClose} onOk={handleUpload} confirmLoading={loading} okText="Upload" width={480}>
      {uploadDir && localFiles.length > 0 ? (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>Select from: {uploadDir}</div>
          <Select
            style={{ width: '100%' }}
            placeholder="Select a file"
            onChange={(val) => { setSelectedLocalFile(val); if (!key) setKey(val); }}
            options={localFiles.map(f => ({ value: f.name, label: `${f.name} (${(f.size / 1024).toFixed(1)} KB)` }))}
          />
        </div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <Upload beforeUpload={(f) => { setFile(f); if (!key) setKey(f.name); return false; }} maxCount={1}>
            <div style={{ border: '2px dashed #d0d5dd', borderRadius: 8, padding: 16, textAlign: 'center', cursor: 'pointer' }}>
              {file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)` : 'Click to select file'}
            </div>
          </Upload>
        </div>
      )}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>S3 Key</div>
        <Input value={key} onChange={(e) => setKey(e.target.value)} style={{ fontFamily: 'monospace' }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>Upload Mode</div>
        <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
          <Radio value="normal">Normal</Radio>
          <Radio value="multipart">Multipart</Radio>
        </Radio.Group>
      </div>
      {mode === 'multipart' && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>Part Size</div>
          <Select value={partSize} onChange={setPartSize} style={{ width: '100%' }} options={[
            { value: '5', label: '5 MB' },
            { value: '8', label: '8 MB' },
            { value: '16', label: '16 MB' },
            { value: '32', label: '32 MB' },
          ]} />
        </div>
      )}
      {loading && <Progress percent={progress} size="small" />}
    </Modal>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add client/src/components/modals/UploadModal.jsx
git commit -m "feat: UploadModal supports backend file list when directory configured"
```

---

### Task 11: DownloadModal — 支持直接保存

**Files:**
- Modify: `client/src/components/modals/DownloadModal.jsx`

- [ ] **Step 1: 重写 DownloadModal**

替换 `client/src/components/modals/DownloadModal.jsx` 全部内容：

```jsx
import React, { useState, useEffect } from 'react';
import { Modal, Input, message } from 'antd';
import { useApp } from '../../context/AppContext';
import { downloadObject, downloadToLocal, getSettings, getEnvironment } from '../../services/api';
import { formatBytes } from '../../utils/format';

export default function DownloadModal({ open, envId, bucket, target, onClose }) {
  const { addLog } = useApp();
  const [filename, setFilename] = useState(target?.key?.split('/').pop() || '');
  const [loading, setLoading] = useState(false);
  const [downloadDir, setDownloadDir] = useState('');

  useEffect(() => {
    if (open && envId) {
      determineDownloadDir();
    }
  }, [open, envId]);

  async function determineDownloadDir() {
    try {
      const env = await getEnvironment(envId);
      if (env.downloadDir) { setDownloadDir(env.downloadDir); return; }
      const settings = await getSettings();
      if (settings.defaultDownloadDir) setDownloadDir(settings.defaultDownloadDir);
    } catch {
      // fallback to browser download
    }
  }

  const handleDownload = async () => {
    setLoading(true);
    try {
      if (downloadDir) {
        const result = await downloadToLocal(envId, bucket, target.key, downloadDir);
        addLog('SUCCESS', 'S3 Download', `Saved to ${result.savedPath}`);
        message.success(`Saved to ${result.savedPath}`);
      } else {
        const res = await downloadObject(envId, bucket, target.key);
        const blob = await res.blob();
        if (window.showSaveFilePicker) {
          const handle = await window.showSaveFilePicker({ suggestedName: filename });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = filename; a.click();
          URL.revokeObjectURL(url);
        }
        addLog('SUCCESS', 'S3 Download', `${bucket}/${target.key}`);
        message.success('Download complete');
      }
      onClose();
    } catch (err) {
      addLog('FAILED', 'S3 Download', err.message);
      message.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal title="Download Object" open={open} onCancel={onClose} onOk={handleDownload} confirmLoading={loading} okText="Download" width={420}>
      <div style={{ background: '#f8f9fb', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: '#8c939d' }}>S3 Path</div>
        <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'monospace', wordBreak: 'break-all' }}>{bucket} / {target?.key}</div>
        <div style={{ fontSize: 9, color: '#8c939d', marginTop: 4 }}>Size: {formatBytes(target?.size)}</div>
      </div>
      {downloadDir ? (
        <div style={{ background: '#eef5ff', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 9, color: '#8c939d' }}>Save To</div>
          <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>{downloadDir}/{filename}</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>Filename</div>
          <Input value={filename} onChange={(e) => setFilename(e.target.value)} />
        </div>
      )}
    </Modal>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add client/src/components/modals/DownloadModal.jsx
git commit -m "feat: DownloadModal supports direct save when directory configured"
```

---

### Task 12: 剩余组件英文化

**Files:**
- Modify: `client/src/components/Sidebar.jsx`
- Modify: `client/src/components/LogPanel.jsx`
- Modify: `client/src/components/EnvDetailView.jsx`
- Modify: `client/src/components/BucketObjectsView.jsx`
- Modify: `client/src/components/S3ConfigView.jsx`
- Modify: `client/src/components/CommandsView.jsx`
- Modify: `client/src/components/modals/AddEnvModal.jsx`
- Modify: `client/src/components/modals/CreateBucketModal.jsx`
- Modify: `client/src/components/modals/EditCommandModal.jsx`

- [ ] **Step 1: Sidebar.jsx 英文化**

将 `client/src/components/Sidebar.jsx` 中的中文替换：
- `'加载环境'` → `'Load Envs'`
- `'列举桶'` → `'List Buckets'`
- `'返回 ${result.length} 个桶'` → `'${result.length} buckets'`
- `'节点'` → `' nodes'`（在 tag 中：`${env.nodes?.length || 0}节点` → `${env.nodes?.length || 0} Nodes`）
- `'环境信息'` → `'Env Info'`
- `'S3 桶'` → `'S3 Buckets'`
- `'暂无桶'` → `'No buckets'`
- `'暂无环境'` → `'No environments'`
- `'快捷命令'` → `'Quick Commands'`

替换后的完整文件：

```jsx
import React, { useEffect, useState } from 'react';
import { Collapse, Spin, Empty } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import { getEnvironments, listBuckets } from '../services/api';
import CreateBucketModal from './modals/CreateBucketModal';

export default function Sidebar() {
  const { environments, setEnvironments, activeView, setActiveView, buckets, setBuckets, addLog } = useApp();
  const [loading, setLoading] = useState(false);
  const [createBucketEnvId, setCreateBucketEnvId] = useState(null);

  useEffect(() => { loadEnvironments(); }, []);

  async function loadEnvironments() {
    try {
      const envs = await getEnvironments();
      setEnvironments(envs);
    } catch (err) {
      addLog('FAILED', 'Load Envs', err.message);
    }
  }

  async function loadBuckets(envId) {
    setLoading(true);
    try {
      const result = await listBuckets(envId);
      setBuckets(prev => ({ ...prev, [envId]: result }));
      addLog('SUCCESS', 'List Buckets', `${result.length} buckets`);
    } catch (err) {
      addLog('FAILED', 'List Buckets', err.message);
    }
    setLoading(false);
  }

  const handleEnvExpand = (keys) => {
    if (keys.length > 0) {
      const latestKey = keys[keys.length - 1];
      if (!buckets[latestKey]) loadBuckets(latestKey);
    }
  };

  const envItems = environments.map(env => {
    const bucketList = buckets[env.id] || [];
    return {
      key: env.id,
      label: (
        <div>
          <div style={{ fontWeight: 600, fontSize: 12, color: '#1a1a2e' }}>{env.name}</div>
          <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
            {env.cpuArch && <span style={{ background: 'rgba(59,130,246,0.12)', color: '#3a7bd5', padding: '0 5px', borderRadius: 4, fontSize: 8 }}>{env.cpuArch}</span>}
            <span style={{ background: 'rgba(34,197,94,0.12)', color: '#2e7d32', padding: '0 5px', borderRadius: 4, fontSize: 8 }}>{env.nodes?.length || 0} Nodes</span>
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
              color: '#3a7bd5', marginBottom: 4,
            }}
          >
            Env Info
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px 2px' }}>
            <span style={{ fontSize: 9, color: '#8c939d', fontWeight: 600, textTransform: 'uppercase' }}>S3 Buckets</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <ReloadOutlined style={{ fontSize: 10, color: '#3a7bd5', cursor: 'pointer' }} onClick={() => loadBuckets(env.id)} />
              <PlusOutlined style={{ fontSize: 10, color: '#3a7bd5', cursor: 'pointer' }} onClick={() => setCreateBucketEnvId(env.id)} />
            </div>
          </div>

          {loading && !buckets[env.id] ? <Spin size="small" /> : (
            bucketList.length === 0 ? <div style={{ padding: '2px 10px', fontSize: 10, color: '#8c939d' }}>No buckets</div> :
            bucketList.map(b => (
              <div
                key={b.Name}
                onClick={() => setActiveView({ type: 'bucket', envId: env.id, bucket: b.Name })}
                style={{
                  padding: '5px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 4, marginBottom: 1,
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
          <Empty description="No environments" style={{ marginTop: 40 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Collapse ghost expandIconPosition="end" items={envItems} onChange={handleEnvExpand} />
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
          Quick Commands
        </div>
      </div>
      {createBucketEnvId && (
        <CreateBucketModal envId={createBucketEnvId} onClose={() => setCreateBucketEnvId(null)} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: LogPanel.jsx 英文化**

将 `client/src/components/LogPanel.jsx` 中的中文替换：
- `'操作日志'` → `'Operation Logs'`
- `'收起'` → `'Collapse'`
- `'展开'` → `'Expand'`
- `'复制'` → `'Copy'`
- `'清空'` → `'Clear'`
- `'暂无日志'` → `'No logs yet'`

替换后的完整文件：

```jsx
import React, { useRef, useEffect, useState } from 'react';
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
          <span style={{ color: '#e2e8f0', fontSize: 10, fontWeight: 600 }}>Operation Logs</span>
          <span style={{ background: '#3a3a4e', color: '#94a3b8', padding: '0 6px', borderRadius: 8, fontSize: 8 }}>{logs.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ color: '#64748b', fontSize: 8, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Collapse' : 'Expand'}
          </span>
          <span style={{ color: '#64748b', fontSize: 8, cursor: 'pointer' }} onClick={copyAll}>Copy</span>
          <span style={{ color: '#64748b', fontSize: 8, cursor: 'pointer' }} onClick={clearLogs}>Clear</span>
        </div>
      </div>
      {expanded && (
        <div ref={containerRef} style={{
          padding: '6px 14px', fontFamily: 'monospace', fontSize: 9, lineHeight: 1.7,
          maxHeight: 100, overflowY: 'auto',
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#64748b' }}>No logs yet</div>
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

- [ ] **Step 3: EnvDetailView.jsx 英文化**

将 `client/src/components/EnvDetailView.jsx` 中的中文替换：
- `'环境不存在'` → `'Environment not found'`
- `'管理界面'` → `'Management'`
- `'编辑'` → `'Edit'`
- `'节点信息'` → `'Node Info'`
- `'节点'` → `'Nodes'`
- `'S3 配置'` → `'S3 Config'`

替换后的完整文件：

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
  if (!env) return <div>Environment not found</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#1a1a2e' }}>{env.name}</h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
              Management
            </Button>
          )}
          <Button icon={<EditOutlined />} onClick={() => setEditModalOpen(true)}>Edit</Button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, #3a7bd5, #00d2ff)', borderRadius: 2 }} />
          <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 13 }}>Node Info</span>
          <Tag style={{ marginLeft: 4 }}>{env.nodes?.length || 0} Nodes</Tag>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {(env.nodes || []).map((node, i) => <NodeCard key={node.name + i} node={node} />)}
        </div>
      </div>

      <S3ConfigView s3Config={env.s3Config} />

      <EditEnvModal env={env} open={editModalOpen} onClose={() => setEditModalOpen(false)} />
    </div>
  );
}
```

- [ ] **Step 4: BucketObjectsView.jsx 英文化**

将 `client/src/components/BucketObjectsView.jsx` 中的中文替换：
- `'列举对象'` → `'List Objects'`
- `'删除对象'` → `'Delete Object'`
- `'删除成功'` → `'Deleted'`
- `'确定删除 ${record.Key}?'` → `'Delete ${record.Key}?'`
- `'对象 Key'` → `'Object Key'`
- `'大小'` → `'Size'`
- `'修改时间'` → `'Modified'`
- `'操作'` → `'Actions'`
- `'个对象'` → `' objects'`
- `'刷新'` → `'Refresh'`
- `'上传对象'` → `'Upload Object'`

替换后的完整文件：

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
  const { addLog } = useApp();
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState(null);

  const loadObjects = async () => {
    setLoading(true);
    try {
      const result = await listObjects(envId, bucket);
      setObjects(result);
      addLog('SUCCESS', 'List Objects', `${bucket}, ${result.length} objects`);
    } catch (err) {
      addLog('FAILED', 'List Objects', `${bucket}, ${err.message}`);
    }
    setLoading(false);
  };

  useEffect(() => { loadObjects(); }, [envId, bucket]);

  const handleDelete = async (key) => {
    try {
      await deleteObject(envId, bucket, key);
      addLog('SUCCESS', 'Delete Object', `${bucket}/${key}`);
      message.success('Deleted');
      loadObjects();
    } catch (err) {
      addLog('FAILED', 'Delete Object', err.message);
      message.error(err.message);
    }
  };

  const columns = [
    { title: 'Object Key', dataIndex: 'Key', key: 'key', render: (t) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{t}</span> },
    { title: 'Size', dataIndex: 'Size', key: 'size', width: 80, render: (v) => formatBytes(v) },
    { title: 'Modified', dataIndex: 'LastModified', key: 'time', width: 100, render: (v) => formatDate(v) },
    {
      title: 'Actions', key: 'actions', width: 70,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <DownloadOutlined style={{ color: '#e65100', cursor: 'pointer' }} onClick={() => setDownloadTarget({ key: record.Key, size: record.Size })} />
          <Popconfirm title={`Delete ${record.Key}?`} onConfirm={() => handleDelete(record.Key)}>
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
          <span style={{ background: '#eef5ff', color: '#3a7bd5', padding: '2px 8px', borderRadius: 8, fontSize: 9 }}>{objects.length} objects</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button icon={<ReloadOutlined />} onClick={loadObjects} loading={loading}>Refresh</Button>
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalOpen(true)}
            style={{ background: 'linear-gradient(135deg, #2e7d32, #4caf50)', border: 'none', borderRadius: 6 }}>
            Upload Object
          </Button>
        </div>
      </div>

      <Table dataSource={objects} columns={columns} rowKey="Key" size="small" loading={loading} pagination={false}
        style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8ecf1' }} />

      <UploadModal open={uploadModalOpen} envId={envId} bucket={bucket} onClose={() => setUploadModalOpen(false)} onSuccess={loadObjects} />
      {downloadTarget && (
        <DownloadModal open={true} envId={envId} bucket={bucket} target={downloadTarget} onClose={() => setDownloadTarget(null)} />
      )}
    </div>
  );
}
```

- [ ] **Step 5: S3ConfigView.jsx 英文化**

将 `client/src/components/S3ConfigView.jsx` 中的中文替换：
- `'S3 配置'` → `'S3 Config'`
- `'点击{showSk ? '隐藏' : '显示'}'` → `'click to ${showSk ? 'hide' : 'show'}'`

替换后的完整文件：

```jsx
import React, { useState } from 'react';

export default function S3ConfigView({ s3Config }) {
  const [showSk, setShowSk] = useState(false);
  if (!s3Config) return null;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, #ff9800, #ff5722)', borderRadius: 2 }} />
        <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 13 }}>S3 Config</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div style={{ background: '#f8f9fb', borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 9, color: '#8c939d', marginBottom: 4 }}>Endpoint</div>
          <div style={{ fontSize: 11, color: '#1a1a2e', fontWeight: 500, fontFamily: 'monospace', wordBreak: 'break-all' }}>{s3Config.endpoint}</div>
        </div>
        <div style={{ background: '#f8f9fb', borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 9, color: '#8c939d', marginBottom: 4 }}>Access Key</div>
          <div style={{ fontSize: 11, color: '#1a1a2e', fontWeight: 500, fontFamily: 'monospace' }}>{s3Config.ak}</div>
        </div>
        <div style={{ background: '#f8f9fb', borderRadius: 8, padding: 10, cursor: 'pointer' }} onClick={() => setShowSk(!showSk)}>
          <div style={{ fontSize: 9, color: '#8c939d', marginBottom: 4 }}>Secret Key <span style={{ fontSize: 8 }}>(click to {showSk ? 'hide' : 'show'})</span></div>
          <div style={{ fontSize: 11, color: '#1a1a2e', fontWeight: 500, fontFamily: 'monospace' }}>
            {showSk ? s3Config.sk : '••••••••••••'}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: CommandsView.jsx 英文化**

将 `client/src/components/CommandsView.jsx` 中的中文替换：
- `'快捷命令'` → `'Quick Commands'`
- `'添加命令'` → `'Add Command'`
- `'名称'` → `'Name'`
- `'命令模板'` → `'Command Template'`
- `'描述'` → `'Description'`
- `'操作'` → `'Actions'`
- `'复制'` → `'Copy'`
- `'已复制到剪贴板'` → `'Copied to clipboard'`
- `'复制: ${text...}'` → `'Copy: ${text...}'`
- `'确定删除?'` → `'Delete?'`
- `'已删除'` → `'Deleted'`
- `'快捷命令'` (in log) → `'Quick Command'`

替换后的完整文件：

```jsx
import React, { useEffect, useState } from 'react';
import { Table, Button, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import { getCommands, deleteCommand } from '../services/api';
import EditCommandModal from './modals/EditCommandModal';

export default function CommandsView() {
  const { commands, setCommands, addLog } = useApp();
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => { loadCommands(); }, []);

  async function loadCommands() {
    const cmds = await getCommands();
    setCommands(cmds);
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard');
    addLog('SUCCESS', 'Quick Command', `Copy: ${text.substring(0, 40)}`);
  };

  const handleDelete = async (id) => {
    await deleteCommand(id);
    addLog('SUCCESS', 'Quick Command', 'Deleted');
    loadCommands();
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 120 },
    { title: 'Command Template', dataIndex: 'template', key: 'template', render: (t) => <code>{t}</code> },
    { title: 'Description', dataIndex: 'description', key: 'desc', width: 150 },
    {
      title: 'Actions', key: 'actions', width: 120,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(record.template)}>Copy</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => setEditTarget(record)} />
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0 }}>Quick Commands</h3>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditTarget({})}>Add Command</Button>
      </div>
      <Table dataSource={commands} columns={columns} rowKey="id" size="small" />
      {editTarget !== null && (
        <EditCommandModal command={editTarget} onClose={() => { setEditTarget(null); loadCommands(); }} />
      )}
    </div>
  );
}
```

- [ ] **Step 7: AddEnvModal.jsx 英文化**

将 `client/src/components/modals/AddEnvModal.jsx` 中的中文替换：
- `'导入环境配置'` → `'Import Environment Config'`
- `'确认导入'` → `'Import'`
- `'粘贴环境信息文本...'` → `'Paste environment info text...'`
- `'环境解析'` → `'Parse Env'`
- `'成功添加: ${result.data.name}'` → `'Added: ${result.data.name}'`
- `'环境添加成功'` → `'Environment added'`

替换后的完整文件：

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
      addLog('SUCCESS', 'Parse Env', `Added: ${result.data.name}`);
      setEnvironments(await getEnvironments());
      message.success('Environment added');
      setText('');
      onClose();
    } catch (err) {
      addLog('FAILED', 'Parse Env', err.message);
      message.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal title="Import Environment Config" open={open} onCancel={onClose} onOk={handleImport} confirmLoading={loading} okText="Import" width={640}>
      <Input.TextArea
        value={text} onChange={(e) => setText(e.target.value)}
        rows={15} placeholder="Paste environment info text..."
        style={{ fontFamily: 'monospace', fontSize: 12 }}
      />
    </Modal>
  );
}
```

- [ ] **Step 8: CreateBucketModal.jsx 英文化**

将 `client/src/components/modals/CreateBucketModal.jsx` 中的中文替换：
- `'创建桶'` → `'Create Bucket'`
- `'创建'` → `'Create'`
- `'桶名称'` → `'Bucket Name'`
- `'创建桶'` (log) → `'Create Bucket'`
- `'创建成功'` → `'Created'`

替换后的完整文件：

```jsx
import React, { useState } from 'react';
import { Modal, Input, message } from 'antd';
import { useApp } from '../../context/AppContext';
import { createBucket, listBuckets } from '../../services/api';

export default function CreateBucketModal({ envId, onClose }) {
  const { addLog, setBuckets } = useApp();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createBucket(envId, name);
      addLog('SUCCESS', 'Create Bucket', name);
      const result = await listBuckets(envId);
      setBuckets(prev => ({ ...prev, [envId]: result }));
      message.success('Created');
      onClose();
    } catch (err) {
      addLog('FAILED', 'Create Bucket', err.message);
      message.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal title="Create Bucket" open={!!envId} onCancel={onClose} onOk={handleCreate} confirmLoading={loading} okText="Create">
      <Input placeholder="Bucket Name" value={name} onChange={(e) => setName(e.target.value)} />
    </Modal>
  );
}
```

- [ ] **Step 9: EditCommandModal.jsx 英文化**

将 `client/src/components/modals/EditCommandModal.jsx` 中的中文替换：
- `'编辑命令'` → `'Edit Command'`
- `'添加命令'` → `'Add Command'`
- `'保存'` → `'Save'`
- `'名称和模板必填'` → `'Name and template are required'`
- `'命令名称'` → `'Command Name'`
- `'命令模板'` → `'Command Template'`
- `'描述'` → `'Description'`
- `'保存成功'` → `'Saved'`
- `'快捷命令'` (log) → `'Quick Command'`
- `'更新'` → `'Updated'`
- `'创建'` → `'Created'`
- placeholder `'如: Ping外网IP'` → `'e.g. Ping External IP'`

替换后的完整文件：

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
    if (!name || !template) return message.warning('Name and template are required');
    setLoading(true);
    try {
      if (isEdit) {
        await updateCommand(command.id, { name, template, description });
      } else {
        await createCommand({ name, template, description });
      }
      addLog('SUCCESS', 'Quick Command', `${isEdit ? 'Updated' : 'Created'}: ${name}`);
      message.success('Saved');
      onClose();
    } catch (err) {
      message.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal title={isEdit ? 'Edit Command' : 'Add Command'} open={true} onCancel={onClose} onOk={handleSave} confirmLoading={loading} okText="Save">
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>Command Name</div>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ping External IP" />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>Command Template</div>
        <Input.TextArea value={template} onChange={(e) => setTemplate(e.target.value)} rows={3} style={{ fontFamily: 'monospace' }}
          placeholder="Variables: {internalIp} {externalIp} {credentials} {nodeName}" />
      </div>
      <div>
        <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>Description</div>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
    </Modal>
  );
}
```

- [ ] **Step 10: 提交所有英文化改动**

```bash
git add client/src/components/Sidebar.jsx client/src/components/LogPanel.jsx client/src/components/EnvDetailView.jsx client/src/components/BucketObjectsView.jsx client/src/components/S3ConfigView.jsx client/src/components/CommandsView.jsx client/src/components/modals/AddEnvModal.jsx client/src/components/modals/CreateBucketModal.jsx client/src/components/modals/EditCommandModal.jsx
git commit -m "feat: translate all UI text from Chinese to English"
```

---

### Task 13: 最终验证

- [ ] **Step 1: 启动前后端 `npm run dev`，验证以下功能：**

1. 点击 TopNav 齿轮图标 -> SettingsModal 打开，能保存 Xshell 路径
2. 导入环境信息（用用户提供的无缩进格式）-> 解析成功，显示 4 个节点
3. 环境详情页只显示 External IP，不显示 Internal IP
4. 点击 Xshell 按钮 -> 调用后端 API 启动
5. 编辑环境 -> Advanced Settings 面板有 Upload Dir / Download Dir
6. 所有界面文字为英文

- [ ] **Step 2: 最终提交**

如有修复，提交后确认所有改动完成。
