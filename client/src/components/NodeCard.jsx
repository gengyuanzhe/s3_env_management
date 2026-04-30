import React from 'react';
import { Tag, Button } from 'antd';
import { CodeOutlined } from '@ant-design/icons';

function getNodeRole(name) {
  if (name.startsWith('FSM')) return { label: '主节点', color: 'blue' };
  if (name.startsWith('FSA')) return { label: '从节点', color: 'default' };
  if (name.startsWith('CLIENT')) return { label: '客户端', color: 'orange' };
  return { label: '节点', color: 'default' };
}

export default function NodeCard({ node }) {
  const role = getNodeRole(node.name);
  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: 14,
      border: '1px solid #e8ecf1', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 13 }}>{node.name}</span>
        <Tag color={role.color} style={{ margin: 0, fontSize: 9 }}>{role.label}</Tag>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 10, color: '#5a6377', marginBottom: 10 }}>
        <div>内网 <span style={{ color: '#1a1a2e', fontWeight: 500 }}>{node.internalIp}</span></div>
        <div>外网 <span style={{ color: '#1a1a2e', fontWeight: 500 }}>{node.externalIp}</span></div>
      </div>
      <div style={{ fontSize: 10, color: '#5a6377', marginBottom: 10 }}>
        凭证: <span style={{ fontFamily: 'monospace' }}>{node.credentials}</span>
      </div>
      <Button
        size="small"
        icon={<CodeOutlined />}
        onClick={() => window.open(`ssh://${node.credentials.replace('/', ':')}@${node.externalIp}`, '_self')}
        style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', color: '#fff', border: 'none', borderRadius: 6 }}
      >
        Xshell
      </Button>
    </div>
  );
}
