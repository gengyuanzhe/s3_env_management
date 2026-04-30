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
