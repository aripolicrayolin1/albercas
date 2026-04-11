import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ 
  currentPath, 
  onNavigate, 
  children,
  mobileSidebarOpen,
  toggleMobileSidebar 
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`app-layout ${mobileSidebarOpen ? 'show-sidebar' : ''}`}>
      {/* Mobile backdrop */}
      <div 
        className="sidebar-backdrop" 
        onClick={toggleMobileSidebar} 
      />
      
      <Sidebar
        currentPath={currentPath}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={toggleMobileSidebar}
      />
      
      <main className={`app-main${collapsed ? ' sidebar-collapsed' : ''}`}>
        <Header 
          currentPath={currentPath} 
          sidebarCollapsed={collapsed} 
          onToggleMobileMenu={toggleMobileSidebar} 
          onNavigate={onNavigate}
        />
        <div className="page-content animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
