import React, { useState, useEffect } from 'react';
import { Modal, Input, message } from 'antd';
import { getSettings, updateSettings } from '../../services/api';

export default function SettingsModal({ open, onClose }) {
  const [xshellPath, setXshellPath] = useState('');
  const [uploadDir, setUploadDir] = useState('');
  const [downloadDir, setDownloadDir] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      getSettings().then(s => {
        setXshellPath(s.xshellPath || '');
        setUploadDir(s.defaultUploadDir || '');
        setDownloadDir(s.defaultDownloadDir || '');
      });
    }
  }, [open]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateSettings({ xshellPath, defaultUploadDir: uploadDir, defaultDownloadDir: downloadDir });
      message.success('Settings saved');
      onClose();
    } catch (err) {
      message.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal title="Global Settings" open={open} onCancel={onClose} onOk={handleSave} confirmLoading={loading} okText="Save" width={520}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: '#8c939d', marginBottom: 4 }}>Xshell Path</div>
        <Input value={xshellPath} onChange={(e) => setXshellPath(e.target.value)} placeholder='e.g. C:\Program Files\Xshell.exe' style={{ fontFamily: 'monospace' }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: '#8c939d', marginBottom: 4 }}>Default Upload Directory</div>
        <Input value={uploadDir} onChange={(e) => setUploadDir(e.target.value)} placeholder='e.g. D:\uploads' style={{ fontFamily: 'monospace' }} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#8c939d', marginBottom: 4 }}>Default Download Directory</div>
        <Input value={downloadDir} onChange={(e) => setDownloadDir(e.target.value)} placeholder='e.g. D:\downloads' style={{ fontFamily: 'monospace' }} />
      </div>
    </Modal>
  );
}
