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
      addLog('SUCCESS', '环境解析', `成功添加: ${result.data.name}`);
      setEnvironments(await getEnvironments());
      message.success('环境添加成功');
      setText('');
      onClose();
    } catch (err) {
      addLog('FAILED', '环境解析', err.message);
      message.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal title="导入环境配置" open={open} onCancel={onClose} onOk={handleImport} confirmLoading={loading} okText="确认导入" width={640}>
      <Input.TextArea
        value={text} onChange={(e) => setText(e.target.value)}
        rows={15} placeholder="粘贴环境信息文本..."
        style={{ fontFamily: 'monospace', fontSize: 12 }}
      />
    </Modal>
  );
}
