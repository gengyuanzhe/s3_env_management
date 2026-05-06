import React, { useState, useEffect } from 'react';
import { Tag, Button, Popconfirm, message, Input, Empty } from 'antd';
import { EditOutlined, LinkOutlined, DeleteOutlined, PlusOutlined, DeleteFilled } from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import { deleteEnvironment, getEnvironments, updateEnvironment } from '../services/api';
import NodeCard from './NodeCard';
import S3ConfigView from './S3ConfigView';
import EditEnvModal from './modals/EditEnvModal';

export default function EnvDetailView({ envId }) {
  const { environments, setEnvironments, setActiveView, addLog } = useApp();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const env = environments.find(e => e.id === envId);
  const [customVariables, setCustomVariables] = useState(env?.customVariables || []);
  useEffect(() => { setCustomVariables(env?.customVariables || []); }, [envId]);
  if (!env) return <div>Environment not found</div>;

  const handleDelete = async () => {
    try {
      await deleteEnvironment(env.id);
      addLog('SUCCESS', 'Delete Env', env.name);
      setEnvironments(await getEnvironments());
      setActiveView({ type: 'empty' });
      message.success('Environment deleted');
    } catch (err) {
      addLog('FAILED', 'Delete Env', err.message);
      message.error(err.message);
    }
  };

  const handleSaveCustomVariables = async (newVars) => {
    try {
      setCustomVariables(newVars);
      await updateEnvironment(env.id, { ...env, customVariables: newVars });
      const updated = await getEnvironments();
      setEnvironments(updated);
    } catch (err) {
      message.error(err.message);
    }
  };

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
          <Popconfirm title="Delete this environment?" onConfirm={handleDelete}>
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, #3a7bd5, #00d2ff)', borderRadius: 2 }} />
          <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 13 }}>Node Info</span>
          <Tag style={{ marginLeft: 4 }}>{env.nodes?.length || 0} Nodes</Tag>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {(env.nodes || []).map((node, i) => <NodeCard key={node.name + i} node={node} env={env} />)}
        </div>
      </div>

      <S3ConfigView s3Config={env.s3Config} />

      <div style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, #52c41a, #13c2c2)', borderRadius: 2 }} />
          <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 13 }}>Custom Variables</span>
          <Tag style={{ marginLeft: 4 }}>{customVariables.length}</Tag>
        </div>
        {customVariables.length === 0 ? (
          <div style={{ background: '#f8f9fb', borderRadius: 8, padding: 20, textAlign: 'center' }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No custom variables" />
            <Button type="dashed" size="small" icon={<PlusOutlined />} style={{ marginTop: 8 }}
              onClick={() => handleSaveCustomVariables([...customVariables, { key: '', value: '' }])}>
              Add Variable
            </Button>
          </div>
        ) : (
          <div>
            {customVariables.map((cv, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                <Input
                  size="small" placeholder="Key" value={cv.key}
                  style={{ width: 150, fontFamily: 'monospace' }}
                  onChange={(e) => {
                    const newVars = [...customVariables];
                    newVars[idx] = { ...newVars[idx], key: e.target.value };
                    setCustomVariables(newVars);
                  }}
                  onBlur={() => handleSaveCustomVariables(customVariables)}
                />
                <span style={{ color: '#8c939d' }}>=</span>
                <Input
                  size="small" placeholder="Value" value={cv.value}
                  style={{ flex: 1, fontFamily: 'monospace' }}
                  onChange={(e) => {
                    const newVars = [...customVariables];
                    newVars[idx] = { ...newVars[idx], value: e.target.value };
                    setCustomVariables(newVars);
                  }}
                  onBlur={() => handleSaveCustomVariables(customVariables)}
                />
                <Button
                  size="small" type="text" danger icon={<DeleteFilled />}
                  onClick={() => handleSaveCustomVariables(customVariables.filter((_, i) => i !== idx))}
                />
              </div>
            ))}
            <Button type="dashed" size="small" icon={<PlusOutlined />}
              onClick={() => setCustomVariables([...customVariables, { key: '', value: '' }])}>
              Add Variable
            </Button>
          </div>
        )}
      </div>

      <EditEnvModal env={env} open={editModalOpen} onClose={() => setEditModalOpen(false)} />
    </div>
  );
}
