import React, { useState } from 'react';
import { Modal, Input, Upload, Radio, Select, Progress, message } from 'antd';
import { useApp } from '../../context/AppContext';
import { uploadObject } from '../../services/api';

export default function UploadModal({ open, envId, bucket, onClose, onSuccess }) {
  const { addLog } = useApp();
  const [file, setFile] = useState(null);
  const [key, setKey] = useState('');
  const [mode, setMode] = useState('normal');
  const [partSize, setPartSize] = useState('8');
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file || !key) return message.warning('请选择文件并填写Key');
    setLoading(true);
    try {
      await uploadObject(envId, { bucket, key, file, mode, partSize }, setProgress);
      addLog('SUCCESS', 'S3 上传', `${bucket}/${key}, ${mode === 'multipart' ? `多段(${partSize}MB)` : '普通'}`);
      message.success('上传成功');
      onSuccess();
      onClose();
    } catch (err) {
      addLog('FAILED', 'S3 上传', err.message);
      message.error(err.message);
    }
    setLoading(false);
  };

  return (
    <Modal title={`上传对象到 ${bucket}`} open={open} onCancel={onClose} onOk={handleUpload} confirmLoading={loading} okText="开始上传" width={480}>
      <div style={{ marginBottom: 12 }}>
        <Upload beforeUpload={(f) => { setFile(f); setKey(f.name); return false; }} maxCount={1}>
          <div style={{ border: '2px dashed #d0d5dd', borderRadius: 8, padding: 16, textAlign: 'center', cursor: 'pointer' }}>
            {file ? `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)` : '点击选择文件'}
          </div>
        </Upload>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>S3 Key</div>
        <Input value={key} onChange={(e) => setKey(e.target.value)} style={{ fontFamily: 'monospace' }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>上传模式</div>
        <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
          <Radio value="normal">普通上传</Radio>
          <Radio value="multipart">多段上传</Radio>
        </Radio.Group>
      </div>
      {mode === 'multipart' && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: '#8c939d', marginBottom: 4 }}>分段大小</div>
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
