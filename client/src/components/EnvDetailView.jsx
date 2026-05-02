import React, { useState } from 'react';
import { Tag, Button } from 'antd';
import { EditOutlined, LinkOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import NodeCard from './NodeCard';
import S3ConfigView from './S3ConfigView';
import EditEnvModal from './modals/EditEnvModal';

export default function EnvDetailView({ envId }) {
  const { environments } = useApp();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const env = environments.find(e => e.id === envId);
  if (!env) return <div>Environment not found</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#1a1a2e' }}>{env.name}</h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {env.cpuArch && <Tag color="blue">{env.cpuArch}</Tag>}
            {env.model && <Tag color="green">{env.model}</Tag>}
            {env.form && <Tag color="orange">{env.form}</Tag>}
            {env.disk && <Tag color="purple">{env.disk}</Tag>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {env.managementUrl && (
            <Button type="primary" icon={<LinkOutlined />} href={env.managementUrl} target="_blank"
              style={{ background: 'linear-gradient(135deg, #3a7bd5, #00d2ff)', border: 'none', borderRadius: 10 }}>
              Management
            </Button>
          )}
          <Button icon={<EditOutlined />} onClick={() => setEditModalOpen(true)}>Edit</Button>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, #3a7bd5, #00d2ff)', borderRadius: 2 }} />
          <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 13 }}>Node Info</span>
          <Tag style={{ marginLeft: 4 }}>{env.nodes?.length || 0} Nodes</Tag>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {(env.nodes || []).map((node, i) => <NodeCard key={node.name + i} node={node} />)}
        </div>
      </div>

      <S3ConfigView s3Config={env.s3Config} />

      <EditEnvModal env={env} open={editModalOpen} onClose={() => setEditModalOpen(false)} />
    </div>
  );
}
