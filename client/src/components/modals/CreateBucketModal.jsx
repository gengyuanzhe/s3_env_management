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
      addLog('SUCCESS', 'Create Bucket', name);
      const result = await listBuckets(envId);
      setBuckets(prev => ({ ...prev, [envId]: result }));
      message.success('Created');
      onClose();
    } catch (err) {
      addLog('FAILED', 'Create Bucket', err.message);
      message.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal title="Create Bucket" open={!!envId} onCancel={onClose} onOk={handleCreate} confirmLoading={loading} okText="Create">
      <Input placeholder="Bucket Name" value={name} onChange={(e) => setName(e.target.value)} />
    </Modal>
  );
}
