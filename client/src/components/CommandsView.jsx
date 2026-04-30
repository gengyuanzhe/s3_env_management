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
