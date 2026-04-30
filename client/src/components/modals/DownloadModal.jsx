import React, { useState, useEffect } from 'react';
import { Modal, Input, message } from 'antd';
import { useApp } from '../../context/AppContext';
import { downloadObject, downloadToLocal, getSettings, getEnvironment } from '../../services/api';
import { formatBytes } from '../../utils/format';

export default function DownloadModal({ open, envId, bucket, target, onClose }) {
  const { addLog } = useApp();
  const [filename, setFilename] = useState(target?.key?.split('/').pop() || '');
  const [loading, setLoading] = useState(false);
  const [downloadDir, setDownloadDir] = useState('');

  useEffect(() => {
    if (open && envId) {
      setFilename(target?.key?.split('/').pop() || '');
      determineDownloadDir();
    }
  }, [open, envId]);

  async function determineDownloadDir() {
    try {
      const env = await getEnvironment(envId);
      if (env.downloadDir) { setDownloadDir(env.downloadDir); return; }
      const settings = await getSettings();
      if (settings.defaultDownloadDir) setDownloadDir(settings.defaultDownloadDir);
    } catch {
      // fallback to browser download
    }
  }

  const handleDownload = async () => {
    setLoading(true);
    try {
      if (downloadDir) {
        const result = await downloadToLocal(envId, bucket, target.key, downloadDir);
        addLog('SUCCESS', 'S3 Download', `Saved to ${result.savedPath}`);
        message.success(`Saved to ${result.savedPath}`);
      } else {
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
        addLog('SUCCESS', 'S3 Download', `${bucket}/${target.key}`);
        message.success('Download complete');
      }
      onClose();
    } catch (err) {
      addLog('FAILED', 'S3 Download', err.message);
      message.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal title="Download Object" open={open} onCancel={onClose} onOk={handleDownload} confirmLoading={loading} okText="Download" width={420}>
      <div style={{ background: '#f8f9fb', borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: '#8c939d' }}>S3 Path</div>
        <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'monospace', wordBreak: 'break-all' }}>{bucket} / {target?.key}</div>
        <div style={{ fontSize: 9, color: '#8c939d', marginTop: 4 }}>Size: {formatBytes(target?.size)}</div>
      </div>
      {downloadDir ? (
        <div style={{ background: '#eef5ff', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 9, color: '#8c939d' }}>Save To</div>
          <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>{downloadDir}/{filename}</div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>Filename</div>
          <Input value={filename} onChange={(e) => setFilename(e.target.value)} />
        </div>
      )}
    </Modal>
  );
}
