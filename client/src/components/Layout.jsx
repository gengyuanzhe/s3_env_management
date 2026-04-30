import React from 'react';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import LogPanel from './LogPanel';
import EnvDetailView from './EnvDetailView';
import BucketObjectsView from './BucketObjectsView';
import CommandsView from './CommandsView';
import { useApp } from '../context/AppContext';

export default function Layout() {
  const { activeView } = useApp();

  const renderContent = () => {
    switch (activeView.type) {
      case 'envInfo': return <EnvDetailView envId={activeView.envId} />;
      case 'bucket': return <BucketObjectsView envId={activeView.envId} bucket={activeView.bucket} />;
      case 'commands': return <CommandsView />;
      default: return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8c939d' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>&#128230;</div>
            <p>选择左侧环境或工具开始使用</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopNav />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
            {renderContent()}
          </div>
          <LogPanel />
        </div>
      </div>
    </div>
  );
}
