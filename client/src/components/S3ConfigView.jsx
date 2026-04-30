import React, { useState } from 'react';

export default function S3ConfigView({ s3Config }) {
  const [showSk, setShowSk] = useState(false);
  if (!s3Config) return null;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, #ff9800, #ff5722)', borderRadius: 2 }} />
        <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 13 }}>S3 配置</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div style={{ background: '#f8f9fb', borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 9, color: '#8c939d', marginBottom: 4 }}>Endpoint</div>
          <div style={{ fontSize: 11, color: '#1a1a2e', fontWeight: 500, fontFamily: 'monospace', wordBreak: 'break-all' }}>{s3Config.endpoint}</div>
        </div>
        <div style={{ background: '#f8f9fb', borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: 9, color: '#8c939d', marginBottom: 4 }}>Access Key</div>
          <div style={{ fontSize: 11, color: '#1a1a2e', fontWeight: 500, fontFamily: 'monospace' }}>{s3Config.ak}</div>
        </div>
        <div style={{ background: '#f8f9fb', borderRadius: 8, padding: 10, cursor: 'pointer' }} onClick={() => setShowSk(!showSk)}>
          <div style={{ fontSize: 9, color: '#8c939d', marginBottom: 4 }}>Secret Key <span style={{ fontSize: 8 }}>(点击{showSk ? '隐藏' : '显示'})</span></div>
          <div style={{ fontSize: 11, color: '#1a1a2e', fontWeight: 500, fontFamily: 'monospace' }}>
            {showSk ? s3Config.sk : '••••••••••••'}
          </div>
        </div>
      </div>
    </div>
  );
}
