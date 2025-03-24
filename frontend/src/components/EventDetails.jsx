import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getEventDetails, enrollUserInEvent, unenrollUserFromEvent, checkUserEnrollment } from '../apiservice/event';
import { checkAuth } from '../apiservice/auth';
import '../styles/EventDetails.css';
import Event from './Event/Event';
import CommunityChat from './Event/CommunityChat';
import Tasks from './Event/tasks';

// Notification popup component
const NotificationPopup = ({ message, type, onClose }) => {
  return (
    <div className={`notification-popup ${type}`}>
      <div className="notification-content">
        {type === 'success' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        )}
        {type === 'error' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        )}
        <p>{message}</p>
        <button className="close-button" onClick={onClose} aria-label="Close notification">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

const EventDetails = () => {
  const { t } = useTranslation();
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('event');
  const [tabsReady, setTabsReady] = useState(false);
  
  // Enrollment states
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);

  // Notification state
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success' // 'success' or 'error'
  });

  // Check if user is authenticated
  useEffect(() => {
    const checkUserAuthentication = async () => {
      try {
        const response = await checkAuth();
        if (response.success && response.data.authenticated) {
          setIsAuthenticated(true);
          setUserId(response.data.user.id);
        } else {
          setIsAuthenticated(false);
          setUserId(null);
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        setIsAuthenticated(false);
      }
    };

    checkUserAuthentication();
  }, []);

  // Check enrollment status when authenticated and event ID is available
  useEffect(() => {
    const checkEnrollmentStatus = async () => {
      if (isAuthenticated && eventId) {
        try {
          const response = await checkUserEnrollment(eventId);
          if (response.success) {
            setIsEnrolled(response.data.enrolled);
          }
        } catch (err) {
          console.error('Error checking enrollment status:', err);
        }
      }
    };

    checkEnrollmentStatus();
  }, [isAuthenticated, eventId]);

  // Fetch event details
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

  // Set initial active tab based on enrollment status
  useEffect(() => {
    if (isEnrolled && tabsReady) {
      setActiveTab('tasks');
    }
  }, [isEnrolled, tabsReady]);

  // Create tabs array based on enrollment status
  const getTabs = () => {
    const baseTabs = [
      { id: 'event', label: t('eventDetails.tabs.event'), component: tabsReady ? <Event eventData={event} /> : <Event eventData={null} /> },
      { id: 'chat', label: t('eventDetails.tabs.chat'), component: <CommunityChat eventId={eventId} eventTitle={event?.title || event?.event_name} /> }
    ];
    
    // Only show tasks tab if user is enrolled
    if (isEnrolled) {
      baseTabs.splice(1, 0, { id: 'tasks', label: t('eventDetails.tabs.tasks'), component: <Tasks eventId={eventId} /> });
    }
    
    return baseTabs;
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });
    
    // Automatically close notification after 5 seconds
    setTimeout(() => {
      setNotification(prev => ({...prev, show: false}));
    }, 5000);
  };

  // Close notification
  const closeNotification = () => {
    setNotification(prev => ({...prev, show: false}));
  };

  // Handle join/unenroll button click
  const handleJoinEvent = async () => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      if (window.confirm(t('eventDetails.actions.join.loginPrompt'))) {
        // Store the current event page URL in session storage
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        // Redirect to login page
        navigate('/login');
      }
      return;
    }

    setEnrollmentLoading(true);

    try {
      if (isEnrolled) {
        // User is enrolled, so unenroll
        const response = await unenrollUserFromEvent(eventId);
        
        if (response.success) {
          setIsEnrolled(false);
          showNotification(t('eventDetails.actions.unenroll.success'), 'success');
          
          // If currently on tasks tab, switch to event tab since tasks will no longer be accessible
          if (activeTab === 'tasks') {
            setActiveTab('event');
          }
        } else {
          showNotification(t('eventDetails.actions.unenroll.failure'), 'error');
        }
      } else {
        // User is not enrolled, so enroll
        const response = await enrollUserInEvent(eventId, userId);
        
        if (response.success) {
          setIsEnrolled(true);
          showNotification(t('eventDetails.actions.join.success'), 'success');
          
          // Switch to tasks tab when user enrolls
          setActiveTab('tasks');
        } else {
          showNotification(t('eventDetails.actions.join.failure'), 'error');
        }
      }
    } catch (error) {
      console.error('Error with enrollment action:', error);
      showNotification(
        isEnrolled 
          ? t('eventDetails.actions.unenroll.error') 
          : t('eventDetails.actions.join.error'), 
        'error'
      );
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const handleShareEvent = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title || t('eventDetails.share.defaultTitle'),
        text: t('eventDetails.share.text', { title: event?.title }),
        url: window.location.href,
      })
      .then(() => {
        showNotification(t('eventDetails.actions.share.success'), 'success');
      })
      .catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          showNotification(t('eventDetails.actions.share.copyMessage'), 'success');
        })
        .catch(err => {
          console.error('Error copying to clipboard:', err);
          alert(t('eventDetails.share.copyMessage'));
        });
    }
  };

  // Check if the event is in the past
  const isEventPast = () => {
    if (!event || !event.end_time) return false;
    const endTime = new Date(event.end_time);
    return endTime < new Date();
  };

  // Handle feedback button click
  const handleFeedbackClick = () => {
    navigate(`/events/${eventId}/feedback`);
  };

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

  const tabs = getTabs();

  return (
    <main className="event-details-container">
      {notification.show && (
        <NotificationPopup 
          message={notification.message} 
          type={notification.type} 
          onClose={closeNotification} 
        />
      )}
      
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
            {/* Only show join/unenroll button for upcoming events */}
            {!isEventPast() && (
              <button 
                className={`event-action-btn ${isEnrolled ? 'unenroll-btn' : 'join-btn'} ${enrollmentLoading ? 'loading' : ''}`}
                onClick={handleJoinEvent}
                disabled={enrollmentLoading}
                aria-label={isEnrolled 
                  ? t('eventDetails.actions.unenroll.ariaLabel') 
                  : t('eventDetails.actions.join.ariaLabel')}
              >
                {enrollmentLoading ? (
                  <span className="loading-text">{t('eventDetails.actions.loading')}</span>
                ) : isEnrolled ? (
                  t('eventDetails.actions.unenroll.label')
                ) : (
                  t('eventDetails.actions.join.label')
                )}
              </button>
            )}
            
            {/* Show feedback button for past events user was enrolled in */}
            {isEventPast() && isEnrolled && (
              <button 
                className="event-action-btn feedback-btn"
                onClick={handleFeedbackClick}
                aria-label={t('eventDetails.actions.feedback.ariaLabel')}
              >
                {t('eventDetails.actions.feedback.label')}
              </button>
            )}
            
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