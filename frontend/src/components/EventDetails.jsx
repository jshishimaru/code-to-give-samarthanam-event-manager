import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEventDetails } from '../apiservice/event';
import '../styles/EventDetails.css';

// Make sure the import path is correct
import Event from './Event/Event';

// These will be actual component imports later
const EventLocation = () => <div>Location Content</div>;
const ContactUs = () => <div>Contact Us Content</div>;
const Feedback = () => <div>Feedback Content</div>;
const Tasks = () => <div>Tasks Content</div>;

const EventDetails = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('event');
  const [tabsReady, setTabsReady] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const response = await getEventDetails(eventId);
        if (response.success) {
          setEvent(response.data.event);
          // Set tabs ready to true after event data is loaded
          setTabsReady(true);
        } else {
          console.error("Failed to fetch event data:", response);
          setError('Failed to fetch event details');
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('An error occurred while fetching event details');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const tabs = [
    { id: 'event', label: 'Event', component: tabsReady ? <Event eventData={event} /> : <Event /> },
    { id: 'location', label: 'Location', component: <EventLocation /> },
    { id: 'contact', label: 'Contact Us', component: <ContactUs /> },
    { id: 'feedback', label: 'Feedback', component: <Feedback /> },
    { id: 'tasks', label: 'Tasks', component: <Tasks /> },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleJoinEvent = () => {
    // Logic for joining the event will be implemented later
    console.log('Join event clicked for event ID:', eventId);
  };

  const handleShareEvent = () => {
    console.log('Share event clicked for event ID:', eventId);
    
    if (navigator.share) {
      navigator.share({
        title: event?.title || 'Event Details',
        text: `Check out this event: ${event?.title}`,
        url: window.location.href,
      })
      .catch(err => console.error('Error sharing:', err));
    } else {
      alert('Share link copied to clipboard!');
    }
  };

  // Loading placeholder for tab content
  const TabLoadingPlaceholder = () => (
    <div className="tab-loading-placeholder">
      <p>Loading event information...</p>
    </div>
  );

  if (loading) {
    return (
      <div className="event-details-loading" aria-live="polite">
        <p>Loading event details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-details-error" role="alert">
        <p>{error}</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-details-error" role="alert">
        <p>Event not found</p>
      </div>
    );
  }

  return (
    <main className="event-details-container">
      <header className="event-details-header">
        <h1 className="event-name">{event.title || 'Event Details'}</h1>
      </header>

      <section className="event-details-tabs-container">
        <div className="tabs-actions-container">
          <div className="tabs-header" role="tablist" aria-label="Event information tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="event-action-buttons">
            <button 
              className="event-action-btn join-btn"
              onClick={handleJoinEvent}
              aria-label="Join this event"
            >
              Join
            </button>
            <button 
              className="event-action-btn share-btn"
              onClick={handleShareEvent}
              aria-label="Share this event"
            >
              Share
            </button>
          </div>
        </div>

        <div className="tabs-content">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              id={`tabpanel-${tab.id}`}
              className={`tab-panel ${activeTab === tab.id ? 'active' : ''}`}
              role="tabpanel"
              aria-labelledby={`tab-${tab.id}`}
              hidden={activeTab !== tab.id}
            >
              {tab.component}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default EventDetails;