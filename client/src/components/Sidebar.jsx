import React, { useEffect, useState } from 'react';
import { Collapse, Spin, Empty } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import { getEnvironments, listBuckets } from '../services/api';
import CreateBucketModal from './modals/CreateBucketModal';

export default function Sidebar() {
  const { environments, setEnvironments, activeView, setActiveView, buckets, setBuckets, addLog } = useApp();
  const [loading, setLoading] = useState(false);
  const [createBucketEnvId, setCreateBucketEnvId] = useState(null);

  useEffect(() => { loadEnvironments(); }, []);

  async function loadEnvironments() {
    try {
      const envs = await getEnvironments();
      setEnvironments(envs);
    } catch (err) {
      addLog('FAILED', 'Load Envs', err.message);
    }
  }

  async function loadBuckets(envId) {
    setLoading(true);
    try {
      const result = await listBuckets(envId);
      setBuckets(prev => ({ ...prev, [envId]: result }));
      addLog('SUCCESS', 'List Buckets', `${result.length} buckets`);
    } catch (err) {
      addLog('FAILED', 'List Buckets', err.message);
    }
    setLoading(false);
  }

  const handleEnvExpand = (keys) => {
    if (keys.length > 0) {
      const latestKey = keys[keys.length - 1];
      if (!buckets[latestKey]) loadBuckets(latestKey);
    }
  };

  const envItems = environments.map(env => {
    const bucketList = buckets[env.id] || [];
    return {
      key: env.id,
      label: (
        <div>
          <div style={{ fontWeight: 600, fontSize: 12, color: '#1a1a2e' }}>{env.name}</div>
          <div style={{ display: 'flex', gap: 3, marginTop: 2 }}>
            {env.cpuArch && <span style={{ background: 'rgba(59,130,246,0.12)', color: '#3a7bd5', padding: '0 5px', borderRadius: 4, fontSize: 8 }}>{env.cpuArch}</span>}
            <span style={{ background: 'rgba(34,197,94,0.12)', color: '#2e7d32', padding: '0 5px', borderRadius: 4, fontSize: 8 }}>{env.nodes?.length || 0} Nodes</span>
          </div>
        </div>
      ),
      children: (
        <div>
          <div
            onClick={() => setActiveView({ type: 'envInfo', envId: env.id })}
            style={{
              padding: '4px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 4,
              background: activeView.type === 'envInfo' && activeView.envId === env.id ? '#f0f7ff' : 'transparent',
              color: '#3a7bd5', marginBottom: 4,
            }}
          >
            Env Info
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px 2px' }}>
            <span style={{ fontSize: 9, color: '#8c939d', fontWeight: 600, textTransform: 'uppercase' }}>S3 Buckets</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <ReloadOutlined style={{ fontSize: 10, color: '#3a7bd5', cursor: 'pointer' }} onClick={() => loadBuckets(env.id)} />
              <PlusOutlined style={{ fontSize: 10, color: '#3a7bd5', cursor: 'pointer' }} onClick={() => setCreateBucketEnvId(env.id)} />
            </div>
          </div>

          {loading && !buckets[env.id] ? <Spin size="small" /> : (
            bucketList.length === 0 ? <div style={{ padding: '2px 10px', fontSize: 10, color: '#8c939d' }}>No buckets</div> :
            bucketList.map(b => (
              <div
                key={b.Name}
                onClick={() => setActiveView({ type: 'bucket', envId: env.id, bucket: b.Name })}
                style={{
                  padding: '5px 10px', fontSize: 11, cursor: 'pointer', borderRadius: 4, marginBottom: 1,
                  background: activeView.type === 'bucket' && activeView.bucket === b.Name ? '#f0f7ff' : 'transparent',
                  borderLeft: activeView.type === 'bucket' && activeView.bucket === b.Name ? '2px solid #3a7bd5' : '2px solid transparent',
                }}
              >
                &#128230; {b.Name}
              </div>
            ))
          )}
        </div>
      ),
    };
  });

  return (
    <div style={{ width: 260, background: '#fff', borderRight: '1px solid #e8ecf1', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {environments.length === 0 ? (
          <Empty description="No environments" style={{ marginTop: 40 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Collapse ghost expandIconPosition="end" items={envItems} onChange={handleEnvExpand} />
        )}
      </div>
      <div style={{ borderTop: '1px solid #e8ecf1', padding: '8px 12px' }}>
        <div
          onClick={() => setActiveView({ type: 'commands' })}
          style={{
            padding: '8px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 6,
            background: activeView.type === 'commands' ? '#eef5ff' : 'transparent',
            color: activeView.type === 'commands' ? '#3a7bd5' : '#5a6377',
          }}
        >
          Quick Commands
        </div>
      </div>
      {createBucketEnvId && (
        <CreateBucketModal envId={createBucketEnvId} onClose={() => setCreateBucketEnvId(null)} />
      )}
    </div>
  );
}
