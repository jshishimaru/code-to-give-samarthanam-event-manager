import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import EventVolunteers from '../volunteertab/EventVolunteers';
import EventTasks from '../hosttask/EventTasks';
import EventInfo from '../hostevents/EventInfo';
import CommunityChat from '../../Event/CommunityChat'; // Import CommunityChat component
import { getEventDetails } from '../../../apiservice/event'; // Import to get event title
import '../../../styles/host/hostlayout/HostLayout.css';

const HostLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [componentError, setComponentError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [eventTitle, setEventTitle] = useState(''); // Add state for event title
  const { eventId } = useParams();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setComponentError(null); // Reset error when changing tabs
  };

  // Fetch event details to get the title
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;
      
      try {
        setIsLoading(true);
        const response = await getEventDetails(eventId);
        
        if (response.success) {
          // Store the event title for use in Community Chat
          setEventTitle(response.data.event.title || response.data.event.event_name || '');
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventDetails();
  }, [eventId]);

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

  // Modify the renderContent function to handle when there's no eventId
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
      // We only need eventId for these tabs
      switch (activeTab) {
        case 'volunteers':
          return eventId ? <EventVolunteers eventId={eventId} /> : null;
        case 'tasks':
          return eventId ? <EventTasks eventId={eventId} /> : null;
        case 'info':
          return eventId ? <EventInfo eventId={eventId} /> : null;
        case 'communitychat':
          return eventId ? <CommunityChat eventId={eventId} eventTitle={eventTitle} /> : null;
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