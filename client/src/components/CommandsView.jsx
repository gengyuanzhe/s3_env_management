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
      title: selectedNode ? 'Resolved Command' : 'Command Template',
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
