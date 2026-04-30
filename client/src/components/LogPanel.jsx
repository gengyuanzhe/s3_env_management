import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

const LEVEL_COLOR = { SUCCESS: '#22c55e', FAILED: '#ef4444', INFO: '#f59e0b' };

export default function LogPanel() {
  const { logs, clearLogs } = useApp();
  const [expanded, setExpanded] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [logs]);

  const copyAll = () => {
    const text = logs.map(l => `${l.time} [${l.level}] ${l.operation} — ${l.detail}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={{ flexShrink: 0, background: '#1e1e2e', borderTop: '2px solid #3a7bd5' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '5px 14px', background: '#2d2d3f',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, background: '#22c55e', borderRadius: '50%' }} />
          <span style={{ color: '#e2e8f0', fontSize: 10, fontWeight: 600 }}>操作日志</span>
          <span style={{ background: '#3a3a4e', color: '#94a3b8', padding: '0 6px', borderRadius: 8, fontSize: 8 }}>{logs.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ color: '#64748b', fontSize: 8, cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
            {expanded ? '收起' : '展开'}
          </span>
          <span style={{ color: '#64748b', fontSize: 8, cursor: 'pointer' }} onClick={copyAll}>复制</span>
          <span style={{ color: '#64748b', fontSize: 8, cursor: 'pointer' }} onClick={clearLogs}>清空</span>
        </div>
      </div>
      {expanded && (
        <div ref={containerRef} style={{
          padding: '6px 14px', fontFamily: 'monospace', fontSize: 9, lineHeight: 1.7,
          maxHeight: 100, overflowY: 'auto',
        }}>
          {logs.length === 0 ? (
            <div style={{ color: '#64748b' }}>暂无日志</div>
          ) : logs.map(l => (
            <div key={l.id}>
              <span style={{ color: '#4a6a9a' }}>{l.time}</span>{' '}
              <span style={{ color: LEVEL_COLOR[l.level] || '#94a3b8' }}>[{l.level}]</span>{' '}
              <span style={{ color: '#94a3b8' }}>{l.operation}</span>{' '}
              <span style={{ color: '#64748b' }}>— {l.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
