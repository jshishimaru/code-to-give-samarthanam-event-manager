import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import EventVolunteers from '../volunteertab/EventVolunteers';
import EventTasks from '../hosttask/EventTasks';
import EventInfo from '../hostevents/EventInfo';
import '../../../styles/host/hostlayout/HostLayout.css';

const HostLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const { eventId } = useParams();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Listen for navbar scroll state
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled) {
        document.body.classList.add('scrolled');
      } else {
        document.body.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Initial check
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'volunteers':
        return <EventVolunteers eventId={eventId} />;
      case 'tasks':
        return <EventTasks eventId={eventId} />;
      case 'info':
        return <EventInfo eventId={eventId} />;
      default:
        return <div className="event-info-placeholder">Event information will be implemented later</div>;
    }
  };

  return (
    <div className={`host-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      
      <div className="host-main-content" id="host-main-content">
        <div className="host-main-content-inner">
          <div className="event-details-container">
            {/* Content area for the selected tab - removed top tabs */}
            <div className="tab-content">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostLayout;