# Command Variable Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable quick commands to resolve template variables (`{internalIp}`, `{externalIp}`, `{nodeName}`, `{credentials}`, and custom env variables) against a specific node and copy the result to clipboard.

**Architecture:** Pure frontend feature — a `resolveCommand` utility function does string replacement, two UI entry points (NodeCard dropdown + CommandsView global selector), and an editable custom variables section on EnvDetailView. No backend changes.

**Tech Stack:** React 18, Ant Design 5, existing AppContext

---

## File Structure

| File | Change | Responsibility |
|------|--------|---------------|
| `client/src/utils/format.js` | Modify | Add `resolveCommand(template, node, customVariables)` |
| `client/src/components/EnvDetailView.jsx` | Modify | Add custom variables section below S3 Config |
| `client/src/components/NodeCard.jsx` | Modify | Add command dropdown, accept `env` prop |
| `client/src/components/CommandsView.jsx` | Modify | Add global env+node selector, conditional template display |

---

### Task 1: Add resolveCommand utility function

**Files:**
- Modify: `client/src/utils/format.js`

- [ ] **Step 1: Add the resolveCommand function to format.js**

Append the following function after the existing `formatDate` function in `client/src/utils/format.js`:

```js
export function resolveCommand(template, node, customVariables = []) {
  if (!template) return '';
  let result = template;
  const builtInVars = {
    internalIp: node?.internalIp,
    externalIp: node?.externalIp,
    nodeName: node?.name,
    credentials: node?.credentials,
  };
  for (const [key, value] of Object.entries(builtInVars)) {
    if (value) {
      result = result.replaceAll(`{${key}}`, value);
    }
  }
  for (const { key, value } of customVariables) {
    if (key && value) {
      result = result.replaceAll(`{${key}}`, value);
    }
  }
  return result;
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `cd /Users/gengyuanzhe/code/AI/s3_env_management && npx -y acorn --ecma2022 --module client/src/utils/format.js`
Expected: No parse errors

- [ ] **Step 3: Commit**

```bash
git add client/src/utils/format.js
git commit -m "feat: add resolveCommand utility for template variable resolution"
```

---

### Task 2: Add custom variables section to EnvDetailView

**Files:**
- Modify: `client/src/components/EnvDetailView.jsx`

- [ ] **Step 1: Add custom variables section below S3ConfigView**

In `client/src/components/EnvDetailView.jsx`, make the following changes:

1. Add imports at the top (modify the existing import line from antd):
```js
import { Tag, Button, Popconfirm, message, Input, Empty } from 'antd';
import { EditOutlined, LinkOutlined, DeleteOutlined, PlusOutlined, DeleteFilled } from '@ant-design/icons';
```

2. Add `updateEnvironment` to the api import:
```js
import { deleteEnvironment, getEnvironments, updateEnvironment } from '../services/api';
```

3. Add `customVariables` local state after `editModalOpen` state (~line 12):
```js
const [customVariables, setCustomVariables] = useState(env.customVariables || []);
```

4. Add the save handler after `handleDelete` (~after line 28):
```js
const handleSaveCustomVariables = async (newVars) => {
  try {
    setCustomVariables(newVars);
    await updateEnvironment(env.id, { ...env, customVariables: newVars });
    const updated = await getEnvironments();
    setEnvironments(updated);
  } catch (err) {
    message.error(err.message);
  }
};
```

5. Add the custom variables section in the JSX, after `<S3ConfigView s3Config={env.s3Config} />` and before `<EditEnvModal`:

```jsx
<div style={{ marginTop: 20 }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
    <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, #52c41a, #13c2c2)', borderRadius: 2 }} />
    <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 13 }}>Custom Variables</span>
    <Tag style={{ marginLeft: 4 }}>{customVariables.length}</Tag>
  </div>
  {customVariables.length === 0 ? (
    <div style={{ background: '#f8f9fb', borderRadius: 8, padding: 20, textAlign: 'center' }}>
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No custom variables" />
      <Button type="dashed" size="small" icon={<PlusOutlined />} style={{ marginTop: 8 }}
        onClick={() => handleSaveCustomVariables([...customVariables, { key: '', value: '' }])}>
        Add Variable
      </Button>
    </div>
  ) : (
    <div>
      {customVariables.map((cv, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
          <Input
            size="small" placeholder="Key" value={cv.key}
            style={{ width: 150, fontFamily: 'monospace' }}
            onChange={(e) => {
              const newVars = [...customVariables];
              newVars[idx] = { ...newVars[idx], key: e.target.value };
              setCustomVariables(newVars);
            }}
            onBlur={() => handleSaveCustomVariables(customVariables)}
          />
          <span style={{ color: '#8c939d' }}>=</span>
          <Input
            size="small" placeholder="Value" value={cv.value}
            style={{ flex: 1, fontFamily: 'monospace' }}
            onChange={(e) => {
              const newVars = [...customVariables];
              newVars[idx] = { ...newVars[idx], value: e.target.value };
              setCustomVariables(newVars);
            }}
            onBlur={() => handleSaveCustomVariables(customVariables)}
          />
          <Button
            size="small" type="text" danger icon={<DeleteFilled />}
            onClick={() => handleSaveCustomVariables(customVariables.filter((_, i) => i !== idx))}
          />
        </div>
      ))}
      <Button type="dashed" size="small" icon={<PlusOutlined />}
        onClick={() => setCustomVariables([...customVariables, { key: '', value: '' }])}>
        Add Variable
      </Button>
    </div>
  )}
</div>
```

- [ ] **Step 2: Verify the page loads**

Run: `cd /Users/gengyuanzhe/code/AI/s3_env_management && npm run dev:client`
Expected: Client starts on localhost:5173, navigate to an environment detail page and see the "Custom Variables" section below S3 Config

- [ ] **Step 3: Commit**

```bash
git add client/src/components/EnvDetailView.jsx
git commit -m "feat: add custom variables section to environment detail page"
```

---

### Task 3: Add command dropdown to NodeCard

**Files:**
- Modify: `client/src/components/NodeCard.jsx`

- [ ] **Step 1: Add Dropdown import and command resolution to NodeCard**

Replace the entire content of `client/src/components/NodeCard.jsx` with:

```jsx
import React from 'react';
import { Tag, Button, Dropdown, message } from 'antd';
import { CodeOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { launchSsh } from '../services/api';
import { useApp } from '../context/AppContext';
import { resolveCommand } from '../utils/format';

function getNodeRole(name) {
  if (name.startsWith('FSM')) return { label: 'Master', color: 'blue' };
  if (name.startsWith('FSA')) return { label: 'Slave', color: 'default' };
  if (name.startsWith('CLIENT')) return { label: 'Client', color: 'orange' };
  return { label: 'Node', color: 'default' };
}

export default function NodeCard({ node, env }) {
  const role = getNodeRole(node.name);
  const { commands } = useApp();

  const handleXshell = async () => {
    try {
      await launchSsh({ externalIp: node.externalIp, credentials: node.credentials });
      message.success('Xshell launch command sent');
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleCommandSelect = (cmd) => {
    const resolved = resolveCommand(cmd.template, node, env?.customVariables);
    navigator.clipboard.writeText(resolved).then(() => {
      const preview = resolved.length > 50 ? resolved.substring(0, 50) + '...' : resolved;
      message.success(`Copied: ${preview}`);
    }).catch(() => {
      message.error('Failed to copy');
    });
  };

  const commandMenuItems = commands.length === 0
    ? [{ key: 'empty', label: 'No commands', disabled: true }]
    : commands.map((cmd) => ({
        key: cmd.id,
        label: cmd.name,
        onClick: () => handleCommandSelect(cmd),
      }));

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
      <div style={{ display: 'flex', gap: 6 }}>
        <Dropdown menu={{ items: commandMenuItems }} trigger={['click']}>
          <Button
            size="small"
            icon={<ThunderboltOutlined />}
            style={{ background: 'linear-gradient(135deg, #3a7bd5, #00d2ff)', color: '#fff', border: 'none', borderRadius: 6 }}
          >
            Command
          </Button>
        </Dropdown>
        <Button
          size="small"
          icon={<CodeOutlined />}
          onClick={handleXshell}
          style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', color: '#fff', border: 'none', borderRadius: 6 }}
        >
          Xshell
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Pass env prop to NodeCard in EnvDetailView**

In `client/src/components/EnvDetailView.jsx`, change the NodeCard render (line ~62) from:
```jsx
<NodeCard key={node.name + i} node={node} />
```
to:
```jsx
<NodeCard key={node.name + i} node={node} env={env} />
```

- [ ] **Step 3: Verify dropdown works**

Run: `cd /Users/gengyuanzhe/code/AI/s3_env_management && npm run dev`
Expected: Navigate to an environment detail page, click "Command" button on a node card, select a command, see resolved text copied and displayed in message toast

- [ ] **Step 4: Commit**

```bash
git add client/src/components/NodeCard.jsx client/src/components/EnvDetailView.jsx
git commit -m "feat: add command dropdown to node cards with variable resolution"
```

---

### Task 4: Add global env+node selector to CommandsView

**Files:**
- Modify: `client/src/components/CommandsView.jsx`

- [ ] **Step 1: Replace CommandsView with selector-enabled version**

Replace the entire content of `client/src/components/CommandsView.jsx` with:

```jsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import { getCommands, deleteCommand } from '../services/api';
import { resolveCommand } from '../utils/format';
import EditCommandModal from './modals/EditCommandModal';

export default function CommandsView() {
  const { environments, commands, setCommands, addLog } = useApp();
  const [editTarget, setEditTarget] = useState(null);
  const [selectedEnvId, setSelectedEnvId] = useState(null);
  const [selectedNodeIdx, setSelectedNodeIdx] = useState(null);

  useEffect(() => { loadCommands(); }, []);

  async function loadCommands() {
    const cmds = await getCommands();
    setCommands(cmds);
  }

  const selectedEnv = environments.find(e => e.id === selectedEnvId) || null;
  const selectedNode = selectedEnv && selectedNodeIdx !== null ? selectedEnv.nodes?.[selectedNodeIdx] : null;

  const getResolved = (template) => {
    if (!selectedEnv || !selectedNode) return template;
    return resolveCommand(template, selectedNode, selectedEnv.customVariables);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('Copied to clipboard');
      addLog('SUCCESS', 'Quick Command', `Copy: ${text.substring(0, 40)}`);
    }).catch(() => {
      message.error('Failed to copy');
    });
  };

  const handleDelete = async (id) => {
    await deleteCommand(id);
    addLog('SUCCESS', 'Quick Command', 'Deleted');
    loadCommands();
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', width: 120 },
    {
      title: 'Command Template',
      dataIndex: 'template',
      key: 'template',
      render: (t) => {
        const resolved = getResolved(t);
        return <code>{resolved}</code>;
      },
    },
    { title: 'Description', dataIndex: 'description', key: 'desc', width: 150 },
    {
      title: 'Actions', key: 'actions', width: 120,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(getResolved(record.template))}>Copy</Button>
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
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#5a6377' }}>Resolve for:</span>
        <Select
          placeholder="Select environment"
          value={selectedEnvId}
          onChange={(val) => { setSelectedEnvId(val); setSelectedNodeIdx(null); }}
          style={{ width: 200 }}
          options={environments.map(e => ({ label: e.name, value: e.id }))}
          allowClear
        />
        {selectedEnv && (
          <Select
            placeholder="Select node"
            value={selectedNodeIdx}
            onChange={setSelectedNodeIdx}
            style={{ width: 180 }}
            options={(selectedEnv.nodes || []).map((n, i) => ({ label: `${n.name} (${n.externalIp})`, value: i }))}
            allowClear
          />
        )}
      </div>
      <Table dataSource={commands} columns={columns} rowKey="id" size="small" />
      {editTarget !== null && (
        <EditCommandModal command={editTarget} onClose={() => { setEditTarget(null); loadCommands(); }} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the full flow**

Run: `cd /Users/gengyuanzhe/code/AI/s3_env_management && npm run dev`
Expected:
1. Navigate to Quick Commands page — see "Resolve for:" selector row below title
2. Select an environment — node selector appears
3. Select a node — command templates in the table update to show resolved values
4. Click Copy — resolved command is copied to clipboard
5. Clear selectors — table reverts to raw templates

- [ ] **Step 3: Commit**

```bash
git add client/src/components/CommandsView.jsx
git commit -m "feat: add global env+node selector to commands page for variable resolution"
```

---

## Verification Checklist

After all tasks are complete, verify end-to-end:

1. Navigate to an environment detail page
2. Add custom variables (e.g. key=`projectName`, value=`test-project`)
3. Click "Command" dropdown on a node card, select a command with `{internalIp}` — verify resolved value is correct
4. Navigate to Quick Commands page
5. Select environment + node — verify template column shows resolved values including custom variables
6. Copy a resolved command — verify clipboard has the correct value
7. Clear selectors — verify templates revert to raw form
