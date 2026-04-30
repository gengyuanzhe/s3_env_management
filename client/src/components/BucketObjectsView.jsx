import React, { useEffect, useState } from 'react';
import { Table, Button, message, Popconfirm } from 'antd';
import { ReloadOutlined, UploadOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { useApp } from '../context/AppContext';
import { listObjects, deleteObject } from '../services/api';
import { formatBytes, formatDate } from '../utils/format';
import UploadModal from './modals/UploadModal';
import DownloadModal from './modals/DownloadModal';

export default function BucketObjectsView({ envId, bucket }) {
  const { addLog } = useApp();
  const [objects, setObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [downloadTarget, setDownloadTarget] = useState(null);

  const loadObjects = async () => {
    setLoading(true);
    try {
      const result = await listObjects(envId, bucket);
      setObjects(result);
      addLog('SUCCESS', '列举对象', `${bucket}, 返回 ${result.length} 个对象`);
    } catch (err) {
      addLog('FAILED', '列举对象', `${bucket}, ${err.message}`);
    }
    setLoading(false);
  };

  useEffect(() => { loadObjects(); }, [envId, bucket]);

  const handleDelete = async (key) => {
    try {
      await deleteObject(envId, bucket, key);
      addLog('SUCCESS', '删除对象', `${bucket}/${key}`);
      message.success('删除成功');
      loadObjects();
    } catch (err) {
      addLog('FAILED', '删除对象', err.message);
      message.error(err.message);
    }
  };

  const columns = [
    { title: '对象 Key', dataIndex: 'Key', key: 'key', render: (t) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{t}</span> },
    { title: '大小', dataIndex: 'Size', key: 'size', width: 80, render: (v) => formatBytes(v) },
    { title: '修改时间', dataIndex: 'LastModified', key: 'time', width: 100, render: (v) => formatDate(v) },
    {
      title: '操作', key: 'actions', width: 70,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <DownloadOutlined style={{ color: '#e65100', cursor: 'pointer' }} onClick={() => setDownloadTarget({ key: record.Key, size: record.Size })} />
          <Popconfirm title={`确定删除 ${record.Key}?`} onConfirm={() => handleDelete(record.Key)}>
            <DeleteOutlined style={{ color: '#ef4444', cursor: 'pointer' }} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>&#128230;</span>
          <span style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 15 }}>{bucket}</span>
          <span style={{ background: '#eef5ff', color: '#3a7bd5', padding: '2px 8px', borderRadius: 8, fontSize: 9 }}>{objects.length} 个对象</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button icon={<ReloadOutlined />} onClick={loadObjects} loading={loading}>刷新</Button>
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadModalOpen(true)}
            style={{ background: 'linear-gradient(135deg, #2e7d32, #4caf50)', border: 'none', borderRadius: 6 }}>
            上传对象
          </Button>
        </div>
      </div>

      <Table dataSource={objects} columns={columns} rowKey="Key" size="small" loading={loading} pagination={false}
        style={{ background: '#fff', borderRadius: 8, border: '1px solid #e8ecf1' }} />

      <UploadModal open={uploadModalOpen} envId={envId} bucket={bucket} onClose={() => setUploadModalOpen(false)} onSuccess={loadObjects} />
      {downloadTarget && (
        <DownloadModal open={true} envId={envId} bucket={bucket} target={downloadTarget} onClose={() => setDownloadTarget(null)} />
      )}
    </div>
  );
}
