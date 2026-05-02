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
