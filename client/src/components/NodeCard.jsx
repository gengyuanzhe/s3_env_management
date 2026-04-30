import React from 'react';
import { Tag, Button, message } from 'antd';
import { CodeOutlined } from '@ant-design/icons';
import { launchSsh } from '../services/api';

function getNodeRole(name) {
  if (name.startsWith('FSM')) return { label: 'Master', color: 'blue' };
  if (name.startsWith('FSA')) return { label: 'Slave', color: 'default' };
  if (name.startsWith('CLIENT')) return { label: 'Client', color: 'orange' };
  return { label: 'Node', color: 'default' };
}

export default function NodeCard({ node }) {
  const role = getNodeRole(node.name);

  const handleXshell = async () => {
    try {
      await launchSsh({ externalIp: node.externalIp, credentials: node.credentials });
      message.success('Xshell launch command sent');
    } catch (err) {
      message.error(err.message);
    }
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: 14,
      border: '1px solid #e8ecf1', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 13 }}>{node.name}</span>
        <Tag color={role.color} style={{ margin: 0, fontSize: 9 }}>{role.label}</Tag>
      </div>
      <div style={{ fontSize: 10, color: '#5a6377', marginBottom: 10 }}>
        External IP: <span style={{ color: '#1a1a2e', fontWeight: 500 }}>{node.externalIp}</span>
      </div>
      <div style={{ fontSize: 10, color: '#5a6377', marginBottom: 10 }}>
        Credentials: <span style={{ fontFamily: 'monospace' }}>{node.credentials}</span>
      </div>
      <Button
        size="small"
        icon={<CodeOutlined />}
        onClick={handleXshell}
        style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', color: '#fff', border: 'none', borderRadius: 6 }}
      >
        Xshell
      </Button>
    </div>
  );
}
