import React, { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import AddEnvModal from './modals/AddEnvModal';

export default function TopNav() {
  const [addModalOpen, setAddModalOpen] = useState(false);

  return (
    <>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 'bold', fontSize: 13,
          }}>S3</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>S3 EnvOps</div>
            <div style={{ color: '#64748b', fontSize: 9, letterSpacing: 0.5 }}>环境运维平台</div>
          </div>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setAddModalOpen(true)}
          style={{ borderRadius: 20, background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', border: 'none' }}
        >
          添加环境
        </Button>
      </div>
      <AddEnvModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </>
  );
}
