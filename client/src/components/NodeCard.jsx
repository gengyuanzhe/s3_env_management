import React from 'react';
import { Tag, Button, Dropdown, message } from 'antd';
import { CodeOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { launchSsh } from '../services/api';
import { useApp } from '../context/AppContext';
import { resolveCommand } from '../utils/format';

function getNodeRole(name) {
  if (name.startsWith('FSM')) return { label: 'Master', color: 'blue' };
  if (name.startsWith('FSA')) return { label: 'Slave', color: 'default' };
  if (name.startsWith('CLIENT')) return { label: 'Client', color: 'orange' };
  return { label: 'Node', color: 'default' };
}

export default function NodeCard({ node, env }) {
  const role = getNodeRole(node.name);
  const { commands } = useApp();

  const handleXshell = async () => {
    try {
      await launchSsh({ externalIp: node.externalIp, credentials: node.credentials });
      message.success('Xshell launch command sent');
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleCommandSelect = (cmd) => {
    const resolved = resolveCommand(cmd.template, node, env?.customVariables);
    navigator.clipboard.writeText(resolved).then(() => {
      const preview = resolved.length > 50 ? resolved.substring(0, 50) + '...' : resolved;
      message.success(`Copied: ${preview}`);
    }).catch(() => {
      message.error('Failed to copy');
    });
  };

  const commandMenuItems = commands.length === 0
    ? [{ key: 'empty', label: 'No commands', disabled: true }]
    : commands.map((cmd) => ({
        key: cmd.id,
        label: cmd.name,
        onClick: () => handleCommandSelect(cmd),
      }));

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
      <div style={{ display: 'flex', gap: 6 }}>
        <Dropdown menu={{ items: commandMenuItems }} trigger={['click']}>
          <Button
            size="small"
            icon={<ThunderboltOutlined />}
            style={{ background: 'linear-gradient(135deg, #3a7bd5, #00d2ff)', color: '#fff', border: 'none', borderRadius: 6 }}
          >
            Command
          </Button>
        </Dropdown>
        <Button
          size="small"
          icon={<CodeOutlined />}
          onClick={handleXshell}
          style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', color: '#fff', border: 'none', borderRadius: 6 }}
        >
          Xshell
        </Button>
      </div>
    </div>
  );
}
