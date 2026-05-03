import React, { useState, useEffect } from 'react';
import { Modal, Input, message } from 'antd';
import { useApp } from '../../context/AppContext';
import { downloadObject, downloadToLocal, getSettings, getEnvironment } from '../../services/api';
import { formatBytes } from '../../utils/format';

export default function DownloadModal({ open, envId, bucket, target, onClose }) {
  const { addLog } = useApp();
  const isManualKey = !target?.key;
  const [manualKey, setManualKey] = useState('');
  const key = isManualKey ? manualKey : target.key;
  const [filename, setFilename] = useState(!isManualKey ? (target?.key?.split('/').pop() || '') : '');
  const [loading, setLoading] = useState(false);
  const [downloadDir, setDownloadDir] = useState('');

  useEffect(() => {
    if (open && envId) {
      setManualKey('');
      setFilename(!isManualKey ? (target?.key?.split('/').pop() || '') : '');
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
    if (!key) return message.warning('Please enter an object key');
    setLoading(true);
    try {
      if (downloadDir) {
        const result = await downloadToLocal(envId, bucket, key, downloadDir);
        addLog('SUCCESS', 'S3 Download', `Saved to ${result.savedPath}`);
        message.success(`Saved to ${result.savedPath}`);
      } else {
        const res = await downloadObject(envId, bucket, key);
        const blob = await res.blob();
        const saveName = filename || key.split('/').pop();
        if (window.showSaveFilePicker) {
          const handle = await window.showSaveFilePicker({ suggestedName: saveName });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = saveName; a.click();
          URL.revokeObjectURL(url);
        }
        addLog('SUCCESS', 'S3 Download', `${bucket}/${key}`);
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
      {isManualKey ? (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>Object Key</div>
          <Input value={manualKey} onChange={(e) => setManualKey(e.target.value)} placeholder="e.g. path/to/file.txt" style={{ fontFamily: 'monospace' }} />
          <div style={{ fontSize: 9, color: '#8c939d', marginTop: 4 }}>Bucket: {bucket}</div>
        </div>
      ) : (
        <div style={{ background: '#f8f9fb', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: '#8c939d' }}>S3 Path</div>
          <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'monospace', wordBreak: 'break-all' }}>{bucket} / {target?.key}</div>
          <div style={{ fontSize: 9, color: '#8c939d', marginTop: 4 }}>Size: {formatBytes(target?.size)}</div>
        </div>
      )}
      {downloadDir ? (
        <div style={{ background: '#eef5ff', borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 9, color: '#8c939d' }}>Save To</div>
          <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'monospace' }}>{downloadDir}/{filename || (isManualKey ? '(key basename)' : '')}</div>
        </div>
      ) : (
        !isManualKey && (
          <div>
            <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>Filename</div>
            <Input value={filename} onChange={(e) => setFilename(e.target.value)} />
          </div>
        )
      )}
    </Modal>
  );
}
