import React, { useState } from 'react';
import { Modal, Input, message } from 'antd';
import { useApp } from '../../context/AppContext';
import { downloadObject } from '../../services/api';
import { formatBytes } from '../../utils/format';

export default function DownloadModal({ open, envId, bucket, target, onClose }) {
  const { addLog } = useApp();
  const [filename, setFilename] = useState(target?.key?.split('/').pop() || '');
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await downloadObject(envId, bucket, target.key);
      const blob = await res.blob();

      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({ suggestedName: filename });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
      }
      addLog('SUCCESS', 'S3 下载', `${bucket}/${target.key}`);
      message.success('下载完成');
      onClose();
    } catch (err) {
      addLog('FAILED', 'S3 下载', err.message);
      message.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal title="下载对象" open={open} onCancel={onClose} onOk={handleDownload} confirmLoading={loading} okText="开始下载" width={420}>
      <div style={{ background: '#f8f9fb', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: '#8c939d' }}>S3 路径</div>
        <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'monospace', wordBreak: 'break-all' }}>{bucket} / {target?.key}</div>
        <div style={{ fontSize: 9, color: '#8c939d', marginTop: 4 }}>大小: {formatBytes(target?.size)}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>文件名</div>
        <Input value={filename} onChange={(e) => setFilename(e.target.value)} />
      </div>
    </Modal>
  );
}
