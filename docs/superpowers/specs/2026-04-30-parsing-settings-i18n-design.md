# Design: Parser Tolerance, Settings System, Xshell Launch, and UI English

Date: 2026-04-30

## Overview

Three improvements to the S3 EnvOps platform:

1. **Parser tolerance** — handle environment info text without indentation and with flexible formatting
2. **Settings system & Xshell** — configurable Xshell path, upload/download directories (global + per-environment), backend-executed Xshell launch
3. **UI English & layout** — all UI text in English, remove internal IP from display

## Section 1: Parser Tolerance

**File**: `server/src/services/parser.js`

**Changes**:

1. Node regex: change `^\s+` to `^\s*` (indentation optional)
2. Add explicit "node zone" detection: lines after `节点:` until `S3配置:` are parsed as node lines, regardless of indentation
3. Credential matching: support `user/password` (existing) AND plain `user` without password

**Tolerance rules**:
- Skip blank lines and whitespace-only lines (already works)
- Skip `---` separator lines (already works)
- Flexible spacing between field name, colon, and value (already works)
- Node lines work without indentation (new)
- Node zone explicitly bounded by `节点:` and `S3配置:` markers (new)
- Credentials support no-password format like `root` alone (new)

## Section 2: Data Model & Settings Storage

**New file**: `data/settings.json`

```json
{
  "xshellPath": "C:\\Program Files (x86)\\NetSarang\\Xshell 8\\Xshell.exe",
  "defaultUploadDir": "",
  "defaultDownloadDir": ""
}
```

**Environment model additions**:
```json
{
  "uploadDir": "",
  "downloadDir": ""
}
```

**Priority**: environment `uploadDir/downloadDir` > global `defaultUploadDir/defaultDownloadDir` > browser fallback

**New API routes**:
- `GET /api/settings` — read global settings
- `PUT /api/settings` — update global settings
- `POST /api/ssh/launch` — launch Xshell (body: `{ externalIp, credentials }`)
- `GET /api/files/list?dir=<path>` — list files in a local directory

## Section 3: Xshell Launch

**New file**: `server/src/routes/ssh.js`

**Backend**:
- `POST /api/ssh/launch` reads `xshellPath` from settings
- Executes `child_process.exec`: `"<xshellPath>" ssh://<user>:<password>@<externalIp>`
- Handle Windows paths with spaces (quoted)
- Return error with guidance if `xshellPath` not configured

**Frontend** (`client/src/components/NodeCard.jsx`):
- Xshell button calls `POST /api/ssh/launch` instead of `window.open('ssh://...')`
- Show success/error message via Ant Design `message`
- Remove internal IP display, only show External IP

## Section 4: Upload/Download Directory Flow

### Download

**When directory configured**:
1. User clicks download -> DownloadModal opens
2. Modal detects configured download dir (env > global)
3. Shows target path preview (e.g. `D:\s3-downloads\file.txt`)
4. User confirms -> backend saves directly to configured path
5. Frontend shows success message

**When no directory configured**:
- Current browser `showSaveFilePicker` / fallback download flow (unchanged)

**API change**: `GET /api/s3/:envId/download` adds optional query param `saveToDir=<local path>`
- With `saveToDir`: backend streams S3 object to local file, returns JSON success
- Without `saveToDir`: current streaming download behavior

### Upload

**When directory configured**:
1. User clicks upload -> UploadModal opens
2. Modal detects configured upload dir (env > global)
3. Calls `GET /api/files/list?dir=<path>` to list files
4. Displays file selector dropdown (files from configured dir)
5. User selects file -> backend reads from local disk and uploads to S3

**When no directory configured**:
- Current browser file picker (unchanged)

**API change**: `POST /api/s3/:envId/upload` adds optional body field `localFilePath`
- With `localFilePath`: backend reads file from local path, uploads to S3
- Without `localFilePath`: current multer multipart upload

### File List API

`GET /api/files/list?dir=<path>` returns:
```json
{
  "files": [
    { "name": "report.pdf", "size": 1024000, "modified": "2026-04-30T10:00:00Z" }
  ]
}
```

## Section 5: UI English & Layout

### English translation (key terms)

| Chinese | English |
|---------|---------|
| 环境管理 | Environment Management |
| 添加环境 | Add Environment |
| 编辑环境 | Edit Environment |
| 删除环境 | Delete Environment |
| 解析环境信息 | Parse Environment Info |
| 节点 | Nodes |
| 外网IP | External IP |
| 凭据 | Credentials |
| 上传对象 | Upload Object |
| 下载对象 | Download Object |
| 快捷命令 | Quick Commands |
| 操作日志 | Operation Logs |
| 桶 | Buckets |
| 对象 | Objects |
| 全局设置 | Global Settings |
| 上传目录 | Upload Directory |
| 下载目录 | Download Directory |

All Chinese text across all frontend components replaced with English equivalents.

### NodeCard layout change
- Remove internal IP display row
- Keep: node name, External IP, Credentials, Xshell button

### Global Settings entry
- TopNav: add gear icon (SettingOutlined) on the right side
- Click opens `SettingsModal` with three fields:
  - Xshell Path (text input)
  - Default Upload Dir (text input)
  - Default Download Dir (text input)
- Save button persists to `PUT /api/settings`

### EditEnvModal extension
- Add collapsible "Advanced Settings" panel at bottom
- Contains Upload Dir and Download Dir fields
- Leave empty to use global settings

### New components
- `SettingsModal.jsx` — global settings modal

### Modified components (English + feature changes)
- `NodeCard.jsx` — remove internal IP, Xshell via API
- `UploadModal.jsx` — file list from backend when dir configured
- `DownloadModal.jsx` — direct save when dir configured
- `EditEnvModal.jsx` — add upload/download dir fields
- `AddEnvModal.jsx` — English text
- `TopNav.jsx` — add settings gear icon
- `Sidebar.jsx` — English text
- `LogPanel.jsx` — English text
- `EnvDetailView.jsx` — English text
- `BucketObjectsView.jsx` — English text
- `CreateBucketModal.jsx` — English text
- `EditCommandModal.jsx` — English text
- All other components with Chinese text
