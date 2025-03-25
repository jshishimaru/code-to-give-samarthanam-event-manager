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
  const [componentError, setComponentError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { eventId } = useParams();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setComponentError(null); // Reset error when changing tabs
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

  // Verify eventId is available
  useEffect(() => {
    if (!eventId) {
      setComponentError("Event ID is missing. Please go back to the events page and try again.");
    }
  }, [eventId]);

  // Render content based on active tab
  const renderContent = () => {
    if (componentError) {
      return (
        <div className="component-error" role="alert">
          <p>{componentError}</p>
          <button onClick={() => window.history.back()} className="back-button">
            Go Back
          </button>
        </div>
      );
    }

    try {
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
    } catch (error) {
      console.error("Error rendering content:", error);
      return (
        <div className="component-error" role="alert">
          <p>Something went wrong loading the content. Please try again.</p>
          <button onClick={() => setComponentError(null)} className="retry-button">
            Retry
          </button>
        </div>
      );
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
            {/* Content area for the selected tab */}
            <div className="tab-content">
              {isLoading ? (
                <div className="loading-indicator">
                  <div className="loading-spinner"></div>
                  <p>Loading content...</p>
                </div>
              ) : (
                renderContent()
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostLayout;