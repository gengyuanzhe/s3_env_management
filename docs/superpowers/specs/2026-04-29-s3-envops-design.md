# S3 环境运维平台设计文档

## 概述

Web端S3环境运维管理平台，支持一键解析环境信息文本、多环境管理、S3存储运维操作、节点Xshell连接、快捷命令管理。

## 技术栈

- **前端**: React + Vite + Ant Design
- **后端**: Node.js + Express
- **S3 SDK**: AWS SDK for JavaScript v3 (S3 Client)
- **数据存储**: JSON文件 (`data/environments.json`, `data/commands.json`)

## 系统架构

```
┌─────────────────────┐      HTTP/REST      ┌──────────────────────┐
│   React Frontend    │ ◄──────────────────► │   Express Backend    │
│   (Vite dev server) │                      │                      │
│                     │                      │  • REST API          │
│  • 环境信息面板      │                      │  • S3 SDK Proxy      │
│  • S3桶浏览器       │                      │  • 文件上传/下载      │
│  • 快捷命令管理      │                      │  • 文本解析          │
│  • 操作日志面板      │                      │  • JSON持久化        │
└─────────────────────┘                      └──────────┬───────────┘
                                                        │
                                               ┌────────┴────────┐
                                               │                 │
                                          ┌────┴────┐     ┌─────┴─────┐
                                          │ JSON文件 │     │ S3 兼容存储 │
                                          │ 本地存储  │     │ (各环境)   │
                                          └─────────┘     └───────────┘
```

## 页面布局

### 整体结构

```
┌──────────────────────────────────────────────────┐
│  顶部导航栏 (S3 EnvOps Logo + 添加环境按钮)       │
├──────────┬───────────────────────────────────────┤
│          │                                       │
│  左侧栏   │  右侧内容区 (可滚动)                   │
│  260px   │                                       │
│          │  根据左侧选择切换:                       │
│  • 环境列表│    - 环境信息详情                      │
│  • S3桶   │    - 桶内对象列表                      │
│  • 快捷命令│                                       │
│          │───────────────────────────────────────│
│          │  操作日志面板 (固定底部, 不占左侧)        │
├──────────┴───────────────────────────────────────┤
```

### 顶栏

- Logo + 标题 "S3 EnvOps"
- 右侧 "添加环境" 按钮 (渐变蓝色)

### 左侧栏

#### 环境列表 (可折叠)

每个环境项显示：
- 环境名称 + 展开/折叠箭头
- 标签: CPU架构 + 节点数

展开后显示子项：
- "📋 环境信息" 链接 — 点击右侧显示环境详情
- S3桶列表 — 点击桶名右侧显示对象列表
- 桶区标题栏有 🔄刷新 和 +创建桶 按钮

#### 工具区 (底部)

- "⚡ 快捷命令" 链接

### 右侧内容区

根据左侧选择显示不同内容：

#### 视图1: 环境信息详情

- 环境头部: 名称 + 标签(架构/型号/形态/磁盘) + 管理界面按钮 + 编辑按钮
- 节点卡片网格 (2列):
  - 节点名 + 角色标签(主节点/从节点/客户端)
  - 内网IP + 外网IP
  - 凭证信息
  - Xshell按钮 (ssh://协议唤起)
- S3配置区:
  - Endpoint / AK / SK (SK默认隐藏)
  - 不再直接放操作按钮，S3操作通过左侧桶列表进行

#### 视图2: 桶内对象列表

- 头部: 桶名 + 对象数 + 操作按钮(刷新/上传/删除桶)
- 路径面包屑
- 对象列表表格: Key / 大小 / 修改时间 / 操作(下载/删除)
- 点击对象行高亮选中

#### 视图3: 快捷命令管理

- 命令列表: 名称 + 模板 + 操作(编辑/删除/复制)
- "添加命令" 按钮

### 操作日志面板

固定在右侧内容区底部 (flex-shrink:0)，不覆盖左侧栏。

- 深色终端风格
- 每条格式: `HH:MM:SS [LEVEL] 操作类型 — 详情`
- 级别: SUCCESS(绿) / FAILED(红) / INFO(黄)
- 操作: 展开/收起 + 复制全部 + 清空
- 记录范围: 环境解析/编辑、S3操作(列举桶/创桶/列举对象/上传/下载/删除)、快捷命令复制
- 日志仅存于前端内存中，不持久化

## 数据模型

### Environment (`data/environments.json`)

```json
{
  "id": "uuid",
  "name": "单FSM_modngoyp",
  "envId": "163e00f3-90eb-42cc-9f6f-a427785cafe1",
  "instanceId": "54cf5e23-9e8d-4453-8134-413841f06813",
  "model": "pacific",
  "cpuArch": "arm",
  "form": "虚机",
  "disk": "SATA_SSD: 960GB",
  "managementUrl": "https://7.197.106.190:8088",
  "account": "admin",
  "password": "Admi",
  "sdeName": "SIMUSERVICE_prod_g00471473_...",
  "nodes": [
    {
      "name": "FSM",
      "internalIp": "192.168.22.45",
      "externalIp": "7.197.106.000",
      "credentials": "root/Emulat"
    }
  ],
  "s3Config": {
    "endpoint": "http://7.243.69.151:5080",
    "ak": "7D440DC8B4040A6D2B65",
    "sk": "dEOYg8t8srGoHebDtclhSzCp"
  },
  "createdAt": "2026-04-29T08:00:00.000Z"
}
```

### QuickCommand (`data/commands.json`)

```json
{
  "id": "uuid",
  "name": "Ping外网IP",
  "template": "ping {externalIp}",
  "description": "Ping节点外网地址"
}
```

## API设计

### 环境管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/environments/parse` | 解析环境信息文本，返回结构化数据并保存 |
| GET | `/api/environments` | 获取所有环境列表 |
| GET | `/api/environments/:id` | 获取单个环境详情 |
| PUT | `/api/environments/:id` | 更新环境完整信息 (弹窗表单编辑) |
| DELETE | `/api/environments/:id` | 删除环境 |

### 快捷命令

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/commands` | 获取快捷命令列表 |
| POST | `/api/commands` | 创建快捷命令 |
| PUT | `/api/commands/:id` | 更新快捷命令 |
| DELETE | `/api/commands/:id` | 删除快捷命令 |

### S3操作

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/s3/:envId/buckets` | 列举桶 |
| POST | `/api/s3/:envId/buckets` | 创建桶 (body: `{ name }`) |
| DELETE | `/api/s3/:envId/buckets/:bucket` | 删除桶 |
| GET | `/api/s3/:envId/buckets/:bucket/objects` | 列举对象 (query: `?prefix=xxx`) |
| POST | `/api/s3/:envId/upload` | 上传对象 (multipart form-data) |
| GET | `/api/s3/:envId/download` | 下载对象 (query: `?bucket=x&key=y`，返回流) |
| DELETE | `/api/s3/:envId/buckets/:bucket/objects` | 删除对象 (body: `{ key }`) |

### 上传参数详解

POST `/api/s3/:envId/upload` — multipart form-data:

| 字段 | 类型 | 说明 |
|------|------|------|
| bucket | string | 目标桶名 |
| key | string | S3对象完整Key |
| file | file | 上传文件 |
| mode | string | `"normal"` 或 `"multipart"` |
| partSize | number | 分段大小(MB)，仅multipart，默认5，可选 5/8/16/32 |

## 弹窗交互

### 添加环境弹窗

- 多行文本输入区，粘贴环境信息原始文本
- "解析并添加" 按钮
- 后端解析后返回结构化数据，前端弹出确认预览，确认后保存

### 编辑环境弹窗

- 完整表单，包含所有字段 (名称/架构/型号/管理界面/节点列表/S3配置)
- 节点列表支持增删
- "保存修改" / "取消"

### 上传对象弹窗

- 文件选择区 (支持拖拽)
- S3 Key输入 (自动带上当前桶名前缀，默认用本地文件名)
- 上传模式: 普通上传 / 多段上传 (单选)
- 分段大小下拉: 5/8/16/32 MB (仅多段模式)
- "开始上传" / "取消"
- 上传进度条

### 下载对象弹窗

- 显示S3完整路径 + 文件大小
- 文件名: 默认S3对象文件名，可自定义
- 点击"开始下载"后:
  - 优先使用 File System Access API (`showSaveFilePicker`) 弹出系统保存对话框，用户可选择本地保存路径 (Chrome/Edge 支持)
  - 若浏览器不支持，回退为标准下载流程，由浏览器下载管理器处理
- 后端以流方式返回文件
- "开始下载" / "取消"

### 创建桶弹窗

- 桶名输入
- "创建" / "取消"

### 快捷命令编辑弹窗

- 命令名称
- 命令模板 (支持变量: `{internalIp}`, `{externalIp}`, `{credentials}`, `{nodeName}`)
- 描述
- "保存" / "取消"

## 前端组件结构

```
App
├── Layout
│   ├── TopNav              # 顶栏
│   ├── Sidebar             # 左侧栏
│   │   ├── EnvList         # 环境列表 (可折叠)
│   │   │   ├── EnvItem     # 单个环境项
│   │   │   │   ├── EnvInfoLink    # "环境信息"链接
│   │   │   │   └── BucketList     # 桶列表
│   │   │   │       └── BucketItem # 单个桶
│   │   │   └── ...
│   │   └── ToolsSection    # 工具区
│   ├── MainContent         # 右侧内容区 (可滚动)
│   │   ├── EnvDetailView   # 环境信息详情
│   │   │   ├── EnvHeader   # 环境头部 (名称/标签/按钮)
│   │   │   ├── NodeList    # 节点卡片网格
│   │   │   └── S3ConfigView# S3配置展示
│   │   ├── BucketObjectsView # 桶内对象列表
│   │   └── CommandsView    # 快捷命令管理
│   └── LogPanel            # 操作日志 (固定底部)
├── Modals
│   ├── AddEnvModal         # 添加环境 (文本解析)
│   ├── EditEnvModal        # 编辑环境信息
│   ├── UploadModal         # 上传对象
│   ├── DownloadModal       # 下载对象
│   ├── CreateBucketModal   # 创建桶
│   └── EditCommandModal    # 编辑快捷命令
```

## 文本解析规则

解析以下格式的环境信息文本：

```
--------<环境名称>环境信息--------
环境名称:<名称>
环境ID:<id>
实例ID:<id>
型号:<型号>
CPU架构:<架构>
形态:<形态>
盘:<磁盘信息>
管理界面:<url>
账号:<账号>
密码:<密码>
SDE Name:<sde名称>
节点:
  <节点名> <内网IP> <外网IP> <凭证>
  ...
S3配置:
  Endpoint: <url>
  AK: <ak>
  SK: <sk>
```

解析策略：逐行匹配，用正则提取各字段。节点以缩进+空格分隔，每行格式为 `名称 内网IP 外网IP 凭证`。

## 错误处理

- S3操作失败: 记录日志 `[FAILED]` + 错误详情，前端显示错误提示
- 文本解析失败: 提示具体哪个字段解析失败，返回部分结果
- 文件上传/下载中断: 日志记录中断原因

## 项目结构

```
s3_env_management/
├── client/                 # React前端
│   ├── src/
│   │   ├── components/     # UI组件
│   │   ├── pages/          # 页面视图
│   │   ├── services/       # API调用
│   │   ├── store/          # 状态管理 (React Context)
│   │   └── utils/          # 工具函数
│   ├── index.html
│   └── vite.config.js
├── server/                 # Express后端
│   ├── routes/             # API路由
│   │   ├── environments.js
│   │   ├── commands.js
│   │   └── s3.js
│   ├── services/           # 业务逻辑
│   │   ├── parser.js       # 文本解析
│   │   ├── storage.js      # JSON文件读写
│   │   └── s3Client.js     # S3客户端管理
│   └── index.js            # 入口
├── data/                   # JSON数据存储
├── docs/
└── package.json
```
