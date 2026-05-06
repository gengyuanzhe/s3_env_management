# S3 EnvOps — 环境运维平台

## 项目概述

Web端S3环境运维管理平台，支持一键解析环境信息文本、多环境管理、S3存储运维操作、节点Xshell连接、快捷命令管理和操作日志。

## 技术栈

- **前端**: React 18 + Vite + Ant Design 5
- **后端**: Node.js + Express 4 (ESM)
- **S3 SDK**: AWS SDK v3 (@aws-sdk/client-s3)
- **数据存储**: JSON文件 (`data/environments.json`, `data/commands.json`, `data/settings.json`)

## 项目结构

```
client/                 # React前端 (Vite dev server, port 5173)
  src/
    components/         # UI组件 (Layout, Sidebar, TopNav, LogPanel, 视图组件)
    components/modals/  # 7个弹窗 (AddEnv, EditEnv, Upload, Download, CreateBucket, EditCommand, Settings)
    context/            # React Context全局状态 (AppContext, logReducer)
    services/           # API调用层 (api.js)
    utils/              # 工具函数 (format.js)
server/                 # Express后端 (port 34567)
  src/
    routes/             # API路由 (environments, commands, s3, settings, ssh, files)
    services/           # 业务逻辑 (parser, storage, s3Client)
data/                   # JSON数据存储 (gitignored)
```

## 开发命令

```bash
npm run dev          # 同时启动前后端
npm run dev:server   # 仅启动后端 (localhost:34567)
npm run dev:client   # 仅启动前端 (localhost:5173)
npm run build        # 构建前端生产版本
```

Vite配置了proxy，前端 `/api/*` 请求自动代理到后端 `localhost:34567`。

## API路由

- `POST /api/environments/parse` — 解析环境信息文本并保存
- `GET/PUT/DELETE /api/environments[/:id]` — 环境CRUD
- `GET/POST/PUT/DELETE /api/commands[/:id]` — 快捷命令CRUD
- `GET /api/s3/:envId/buckets` — 列举桶
- `POST /api/s3/:envId/buckets` — 创建桶
- `DELETE /api/s3/:envId/buckets/:bucket` — 删除桶
- `GET /api/s3/:envId/buckets/:bucket/objects` — 列举对象
- `POST /api/s3/:envId/upload` — 上传对象 (multipart, 支持普通/多段模式, 可选 `localFilePath` 从本地路径上传)
- `GET /api/s3/:envId/download` — 下载对象 (流式返回, 可选 `saveToDir` 直接保存到本地目录)
- `DELETE /api/s3/:envId/buckets/:bucket/objects` — 删除对象
- `GET/PUT /api/settings` — 全局设置读写
- `POST /api/ssh/launch` — 通过后端启动 Xshell
- `GET /api/files/list?dir=<path>` — 列出本地目录文件

## 数据模型

### Environment
字段: id, name, envId, instanceId, model, cpuArch, form, disk, managementUrl, account, password, sdeName, uploadDir, downloadDir, nodes[{name, internalIp, externalIp, credentials}], s3Config{endpoint, ak, sk}, customVariables[{key, value}], createdAt

### QuickCommand
字段: id, name, template (支持变量 {internalIp} {externalIp} {credentials} {nodeName} 及环境自定义变量), description

## 文本解析格式

```
--------<环境名称>环境信息--------
环境名称:<名称>
环境ID:<id>
CPU架构:<架构>
管理界面:<url>
节点:
  <名称> <内网IP> <外网IP> <凭证>
S3配置:
  Endpoint: <url>
  AK: <ak>
  SK: <sk>
```

## 约定

- 后端使用 ESM (`"type": "module"`)
- 前端状态管理用 React Context + useReducer
- S3客户端按环境ID缓存，环境更新时自动失效
- S3客户端自动识别AWS S3与S3兼容服务（如MinIO）：AWS S3从endpoint提取region并使用virtual-hosted-style；S3兼容服务使用path-style + 显式endpoint
- 日志仅存前端内存，不持久化
- 上传支持普通模式和多段模式，分段大小可选 5/8/16/32 MB
- 上传/下载目录优先级：环境级配置 > 全局设置 > 浏览器默认
- 下载优先使用 `showSaveFilePicker` API，不支持时回退标准下载；配置目录后由后端直接保存
- Xshell通过后端 `child_process` 启动，路径从全局设置读取
- 界面文本全部为英文
- 解析器支持无缩进节点行、无密码凭据格式、灵活空白容错
- 快捷命令变量解析为纯前端逻辑（`resolveCommand` in `utils/format.js`），支持内置节点变量和环境级自定义变量
- 命令解析入口：环境详情页节点卡片"Command"下拉 + 命令管理页全局环境/节点选择器
- 环境自定义变量存储在 `customVariables` 字段，通过现有环境CRUD接口保存，环境详情页独立区域管理
