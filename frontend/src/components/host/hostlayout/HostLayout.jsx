import React from 'react';
import Sidebar from './Sidebar';
import '../../../styles/hostlayout/HostLayout.css';

const HostLayout = ({ children }) => {
  return (
    <div className="host-layout">
      <Sidebar />
      <main className="host-main-content">
        {children}
      </main>
    </div>
  );
};

export default HostLayout;