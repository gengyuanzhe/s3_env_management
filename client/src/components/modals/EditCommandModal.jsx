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
      addLog('SUCCESS', 'Quick Command', `${isEdit ? 'Update' : 'Create'}: ${name}`);
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
