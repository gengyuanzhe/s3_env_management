import React, { useState } from 'react';
import { Modal, Input, message } from 'antd';
import { useApp } from '../../context/AppContext';
import { createBucket, listBuckets } from '../../services/api';

export default function CreateBucketModal({ envId, onClose }) {
  const { addLog, setBuckets } = useApp();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createBucket(envId, name);
      addLog('SUCCESS', '创建桶', name);
      const result = await listBuckets(envId);
      setBuckets(prev => ({ ...prev, [envId]: result }));
      message.success('创建成功');
      onClose();
    } catch (err) {
      addLog('FAILED', '创建桶', err.message);
      message.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal title="创建桶" open={!!envId} onCancel={onClose} onOk={handleCreate} confirmLoading={loading} okText="创建">
      <Input placeholder="桶名称" value={name} onChange={(e) => setName(e.target.value)} />
    </Modal>
  );
}
