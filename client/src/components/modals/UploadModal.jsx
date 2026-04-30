import React, { useState, useEffect } from 'react';
import { Modal, Input, Upload, Radio, Select, Progress, message } from 'antd';
import { useApp } from '../../context/AppContext';
import { uploadObject, uploadFromLocal, listLocalFiles, getSettings, getEnvironment } from '../../services/api';

export default function UploadModal({ open, envId, bucket, onClose, onSuccess }) {
  const { addLog } = useApp();
  const [file, setFile] = useState(null);
  const [key, setKey] = useState('');
  const [mode, setMode] = useState('normal');
  const [partSize, setPartSize] = useState('8');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const [localFiles, setLocalFiles] = useState([]);
  const [selectedLocalFile, setSelectedLocalFile] = useState(null);
  const [uploadDir, setUploadDir] = useState('');

  useEffect(() => {
    if (open && envId) {
      setFile(null);
      setKey('');
      setSelectedLocalFile(null);
      determineUploadDir();
    }
  }, [open, envId]);

  async function determineUploadDir() {
    try {
      const env = await getEnvironment(envId);
      if (env.uploadDir) {
        setUploadDir(env.uploadDir);
        loadLocalFiles(env.uploadDir);
        return;
      }
      const settings = await getSettings();
      if (settings.defaultUploadDir) {
        setUploadDir(settings.defaultUploadDir);
        loadLocalFiles(settings.defaultUploadDir);
      }
    } catch {
      // fallback to browser file picker
    }
  }

  async function loadLocalFiles(dir) {
    try {
      const result = await listLocalFiles(dir);
      setLocalFiles(result.files || []);
    } catch {
      setLocalFiles([]);
    }
  }

  const handleUpload = async () => {
    setLoading(true);
    try {
      if (selectedLocalFile && uploadDir) {
        const localFilePath = `${uploadDir.replace(/[/\\]+$/, '')}/${selectedLocalFile}`;
        const s3Key = key || selectedLocalFile;
        await uploadFromLocal(envId, { bucket, key: s3Key, localFilePath, mode, partSize });
        addLog('SUCCESS', 'S3 Upload', `${bucket}/${s3Key} (from ${localFilePath})`);
      } else if (file) {
        await uploadObject(envId, { bucket, key: key || file.name, file, mode, partSize }, setProgress);
        addLog('SUCCESS', 'S3 Upload', `${bucket}/${key || file.name}, ${mode === 'multipart' ? `multipart(${partSize}MB)` : 'normal'}`);
      } else {
        message.warning('Please select a file');
        setLoading(false);
        return;
      }
      message.success('Upload successful');
      onSuccess();
      onClose();
    } catch (err) {
      addLog('FAILED', 'S3 Upload', err.message);
      message.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal title={`Upload to ${bucket}`} open={open} onCancel={onClose} onOk={handleUpload} confirmLoading={loading} okText="Upload" width={480}>
      {uploadDir && localFiles.length > 0 ? (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>Select from: {uploadDir}</div>
          <Select
            style={{ width: '100%' }}
            placeholder="Select a file"
            onChange={(val) => { setSelectedLocalFile(val); if (!key) setKey(val); }}
            options={localFiles.map(f => ({ value: f.name, label: `${f.name} (${(f.size / 1024).toFixed(1)} KB)` }))}
          />
        </div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <Upload beforeUpload={(f) => { setFile(f); if (!key) setKey(f.name); return false; }} maxCount={1}>
            <div style={{ border: '2px dashed #d0d5dd', borderRadius: 8, padding: 16, textAlign: 'center', cursor: 'pointer' }}>
              {file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)` : 'Click to select file'}
            </div>
          </Upload>
        </div>
      )}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>S3 Key</div>
        <Input value={key} onChange={(e) => setKey(e.target.value)} style={{ fontFamily: 'monospace' }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>Upload Mode</div>
        <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
          <Radio value="normal">Normal</Radio>
          <Radio value="multipart">Multipart</Radio>
        </Radio.Group>
      </div>
      {mode === 'multipart' && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>Part Size</div>
          <Select value={partSize} onChange={setPartSize} style={{ width: '100%' }} options={[
            { value: '5', label: '5 MB' },
            { value: '8', label: '8 MB' },
            { value: '16', label: '16 MB' },
            { value: '32', label: '32 MB' },
          ]} />
        </div>
      )}
      {loading && <Progress percent={progress} size="small" />}
    </Modal>
  );
}
