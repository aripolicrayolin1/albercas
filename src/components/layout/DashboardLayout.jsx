import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ currentPath, onNavigate, children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />
      <main className={`app-main${collapsed ? ' sidebar-collapsed' : ''}`}>
        <Header currentPath={currentPath} sidebarCollapsed={collapsed} />
        <div className="page-content animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
