# 设计文档：解析容错、设置系统、Xshell 启动与界面英文化

日期：2026-04-30

## 概述

S3 EnvOps 平台三项改进：

1. **解析容错** — 支持无缩进、灵活格式的环境信息文本解析
2. **设置系统与 Xshell** — 可配置 Xshell 路径、上传/下载目录（全局 + 单环境），后端执行 Xshell 启动
3. **界面英文化与布局** — 所有界面文本改为英文，移除内网 IP 展示

## 第 1 部分：解析容错

**改动文件**：`server/src/services/parser.js`

**改动内容**：

1. 节点正则：将 `^\s+` 改为 `^\s*`（缩进改为可选）
2. 增加"节点区域"判断：`节点:` 行之后、`S3配置:` 行之前的非空行，都作为节点行解析（不再依赖缩进）
3. 凭据匹配：支持 `用户名/密码` 格式（现有）和纯用户名格式如 `root`（新增）

**容错规则汇总**：
- 跳过空行和纯空白行（已有）
- 跳过 `---` 分隔线（已有）
- 字段名、冒号、值之间的空格灵活匹配（已有）
- 节点行无需缩进（新增）
- 节点区域由 `节点:` 和 `S3配置:` 显式界定（新增）
- 凭据支持无密码格式（新增）

## 第 2 部分：数据模型与设置存储

**新增文件**：`data/settings.json`

```json
{
  "xshellPath": "C:\\Program Files (x86)\\NetSarang\\Xshell 8\\Xshell.exe",
  "defaultUploadDir": "",
  "defaultDownloadDir": ""
}
```

**Environment 模型新增字段**：
```json
{
  "uploadDir": "",
  "downloadDir": ""
}
```

**优先级**：环境 `uploadDir/downloadDir` > 全局 `defaultUploadDir/defaultDownloadDir` > 浏览器默认行为

**新增 API 路由**：
- `GET /api/settings` — 读取全局设置
- `PUT /api/settings` — 更新全局设置
- `POST /api/ssh/launch` — 启动 Xshell（body: `{ externalIp, credentials }`）
- `GET /api/files/list?dir=<path>` — 列出本地目录下的文件

## 第 3 部分：Xshell 启动

**新增文件**：`server/src/routes/ssh.js`

**后端**：
- `POST /api/ssh/launch` 从 settings 读取 `xshellPath`
- 通过 `child_process.exec` 执行：`"<xshellPath>" ssh://<用户名>:<密码>@<外网IP>`
- Windows 路径含空格时加引号处理
- 若 `xshellPath` 未配置，返回错误并引导用户去全局设置配置

**前端**（`client/src/components/NodeCard.jsx`）：
- Xshell 按钮改为调用 `POST /api/ssh/launch` API（替代 `window.open('ssh://...')`）
- 通过 Ant Design `message` 显示成功/失败提示
- 移除内网 IP 展示，只展示外网 IP

## 第 4 部分：上传/下载目录流程

### 下载流程

**有配置目录时**：
1. 用户点击下载 -> 打开 DownloadModal
2. Modal 检测已配置的下载目录（环境级 > 全局级）
3. 显示目标路径预览（如 `D:\s3-downloads\file.txt`）
4. 用户确认 -> 后端直接保存到配置路径
5. 前端显示成功提示

**无配置目录时**：
- 走现有浏览器 `showSaveFilePicker` / 回退下载流程（不变）

**API 改动**：`GET /api/s3/:envId/download` 增加可选 query 参数 `saveToDir=<本地路径>`
- 有 `saveToDir`：后端将 S3 对象写入本地文件，返回 JSON 成功
- 无 `saveToDir`：现有流式下载行为

### 上传流程

**有配置目录时**：
1. 用户点击上传 -> 打开 UploadModal
2. Modal 检测已配置的上传目录（环境级 > 全局级）
3. 调用 `GET /api/files/list?dir=<路径>` 获取文件列表
4. 在下拉框中展示文件供选择
5. 用户选择文件 -> 后端从本地磁盘读取并上传到 S3

**无配置目录时**：
- 走现有浏览器文件选择器（不变）

**API 改动**：`POST /api/s3/:envId/upload` 增加可选 body 字段 `localFilePath`
- 有 `localFilePath`：后端从本地路径读取文件上传到 S3
- 无 `localFilePath`：现有 multer multipart 上传

### 文件列表 API

`GET /api/files/list?dir=<路径>` 返回：
```json
{
  "files": [
    { "name": "report.pdf", "size": 1024000, "modified": "2026-04-30T10:00:00Z" }
  ]
}
```

## 第 5 部分：界面英文化与布局

### 英文对照表（核心词汇）

| 中文 | 英文 |
|------|------|
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

所有前端组件中的中文文本替换为对应英文。

### NodeCard 布局改动
- 移除内网 IP 展示行
- 保留：节点名称、External IP、Credentials、Xshell 按钮

### 全局设置入口
- TopNav 右侧增加齿轮图标（SettingOutlined）
- 点击弹出 `SettingsModal`，包含三个配置项：
  - Xshell Path（文本输入）
  - Default Upload Dir（文本输入）
  - Default Download Dir（文本输入）
- 保存按钮调用 `PUT /api/settings` 持久化

### EditEnvModal 扩展
- 底部增加可折叠"Advanced Settings"面板
- 包含 Upload Dir 和 Download Dir 字段
- 留空表示使用全局设置

### 新增组件
- `SettingsModal.jsx` — 全局设置弹窗

### 改动组件（英文化 + 功能变更）
- `NodeCard.jsx` — 移除内网 IP，Xshell 改为调用后端 API
- `UploadModal.jsx` — 有配置目录时展示后端文件列表
- `DownloadModal.jsx` — 有配置目录时直接保存
- `EditEnvModal.jsx` — 增加上传/下载目录字段
- `AddEnvModal.jsx` — 英文化
- `TopNav.jsx` — 增加设置齿轮图标
- `Sidebar.jsx` — 英文化
- `LogPanel.jsx` — 英文化
- `EnvDetailView.jsx` — 英文化
- `BucketObjectsView.jsx` — 英文化
- `CreateBucketModal.jsx` — 英文化
- `EditCommandModal.jsx` — 英文化
- 其他所有包含中文的组件
