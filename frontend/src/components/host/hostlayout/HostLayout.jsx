import React,  { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import '../../../styles/hostlayout/HostLayout.css';

const HostLayout = ({ children }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  
  // Handle sidebar state changes
  const handleSidebarToggle = (expanded) => {
    setSidebarExpanded(expanded);
  };

  return (
    <div className={`host-layout ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      <Sidebar onToggle={handleSidebarToggle} />
      <main className="host-main-content">
        {children}
      </main>
    </div>
  );
};

export default HostLayout;