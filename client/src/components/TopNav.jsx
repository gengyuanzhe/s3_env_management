import React, { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined, SettingOutlined } from '@ant-design/icons';
import AddEnvModal from './modals/AddEnvModal';
import SettingsModal from './modals/SettingsModal';

export default function TopNav() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

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
            <div style={{ color: '#64748b', fontSize: 9, letterSpacing: 0.5 }}>Environment Operations Platform</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button
            icon={<SettingOutlined />}
            onClick={() => setSettingsModalOpen(true)}
            style={{ borderRadius: 20, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddModalOpen(true)}
            style={{ borderRadius: 20, background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)', border: 'none' }}
          >
            Add Environment
          </Button>
        </div>
      </div>
      <AddEnvModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
      <SettingsModal open={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} />
    </>
  );
}
