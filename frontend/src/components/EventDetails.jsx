import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getEventDetails } from '../apiservice/event';
import '../styles/EventDetails.css';
// import Tasks from './Event/Tasks';
import Event from './Event/Event';
import Feedback from './Event/feedback';

// These will be actual component imports later
const ContactUs = () => <div>Contact Us Content</div>;
const Tasks = () => <div>Tasks Content</div>;

const EventDetails = () => {
  const { t } = useTranslation();
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('event');
  const [tabsReady, setTabsReady] = useState(false);

  // useEffect(() => {
  //   const fetchEventDetails = async () => {
  //     try {
  //       setLoading(true);
  //       const response = await getEventDetails(eventId);
  //       if (response.success) {
  //         setEvent(response.data.event);
  //         // Set tabs ready to true after event data is loaded
  //         setTabsReady(true);
          
  //         // Update document title with event name
  //         document.title = response.data.event.title || t('eventDetails.defaultTitle');
  //       } else {
  //         console.error("Failed to fetch event data:", response);
  //         setError(t('eventDetails.errors.fetchFailed'));
  //       }
  //     } catch (err) {
  //       console.error('Error fetching event details:', err);
  //       setError(t('eventDetails.errors.generalError'));
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   if (eventId) {
  //     fetchEventDetails();
  //   }
    
  //   // Reset document title when component unmounts
  //   return () => {
  //     document.title = t('site.title', 'Samarthanam Event Manager');
  //   };
  // }, [eventId, t]);
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const response = await getEventDetails(eventId);
        if (response.success) {
          setEvent(response.data.event);
          // Set tabs ready to true after event data is loaded
          setTabsReady(true);
          
          // Get the event title directly from the event object
          const eventTitle = response.data.event.title || response.data.event.event_name || 'Event Details';
          
          // Set document title directly to event name without translation
          document.title = eventTitle;
          console.log("Setting document title to:", eventTitle);
        } else {
          console.error("Failed to fetch event data:", response);
          setError(t('eventDetails.errors.fetchFailed'));
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError(t('eventDetails.errors.generalError'));
      } finally {
        setLoading(false);
      }
    };
  
    if (eventId) {
      fetchEventDetails();
    }
    
    // Reset document title when component unmounts
    return () => {
      document.title = 'Samarthanam Event Manager';
    };
  }, [eventId, t]);

  const tabs = [
    { id: 'event', label: t('eventDetails.tabs.event'), component: tabsReady ? <Event eventData={event} /> : <Event eventData ={null} /> },
    { id: 'contact', label: t('eventDetails.tabs.contact'), component: <ContactUs /> },
    { id: 'feedback', label: t('eventDetails.tabs.feedback'), component: <Feedback /> },
    // { id: 'tasks', label: t('eventDetails.tabs.tasks'), component: <Tasks /> },
  ];


  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleJoinEvent = () => {
    // Logic for joining the event will be implemented later
    console.log('Join event clicked for event ID:', eventId);
  };

  const handleShareEvent = () => {
    
    if (navigator.share) {
      navigator.share({
        title: event?.title || t('eventDetails.share.defaultTitle'),
        text: t('eventDetails.share.text', { title: event?.title }),
        url: window.location.href,
      })
      .catch(err => console.error('Error sharing:', err));
    } else {
      alert(t('eventDetails.share.copyMessage'));
    }
  };

  // Loading placeholder for tab content
  const TabLoadingPlaceholder = () => (
    <div className="tab-loading-placeholder">
      <p>{t('eventDetails.loading.tabContent')}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="event-details-loading" aria-live="polite">
        <p>{t('eventDetails.loading.main')}</p>
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
        <p>{t('eventDetails.errors.notFound')}</p>
      </div>
    );
  }

  return (
    <main className="event-details-container">
      
      <header className="event-details-header">
        <h1 className="event-name">
          {event?.title || event?.event_name || t('eventDetails.defaultTitle')}
        </h1>
        
      </header>

      <section className="event-details-tabs-container">
        <div className="tabs-actions-container">
          <div className="tabs-header" role="tablist" aria-label={t('eventDetails.tablist.label')}>
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
              aria-label={t('eventDetails.actions.join.ariaLabel')}
            >
              {t('eventDetails.actions.join.label')}
            </button>
            <button 
              className="event-action-btn share-btn"
              onClick={handleShareEvent}
              aria-label={t('eventDetails.actions.share.ariaLabel')}
            >
              {t('eventDetails.actions.share.label')}
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