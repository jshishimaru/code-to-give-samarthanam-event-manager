import React, { useState, useEffect } from 'react';
import { getUserEnrolledEvents, allUpcomingEvents, getUserPastEvents } from '../apiservice/event';
import EventCard from './EventCard';
import '../styles/EventPage.css';
import Navbar from './Navbar';
import { useTranslation } from 'react-i18next';

const EventPage = () => {
  const { t } = useTranslation();
  
  // User ID - in a real app, this would come from auth context
  const [userId, setUserId] = useState('1'); // Placeholder user ID
  
  // State for different event categories
  const [enrolledEvents, setEnrolledEvents] = useState([]);
  const [ongoingEvents, setOngoingEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  
  // View mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState('grid');
  
  // Number of events to show initially per section
  const INITIAL_EVENTS_TO_SHOW = 4;
  
  // State to track expanded sections
  const [expandedSections, setExpandedSections] = useState({
    enrolled: false,
    ongoing: false,
    upcoming: false,
    past: false
  });
  
  // Loading and error states
  const [loading, setLoading] = useState({
    enrolled: true,
    ongoing: true,
    upcoming: true,
    past: true
  });
  const [error, setError] = useState({
    enrolled: null,
    ongoing: null,
    upcoming: null,
    past: null
  });

  // Fetch enrolled events
  useEffect(() => {
    const fetchEnrolledEvents = async () => {
      try {
        const response = await getUserEnrolledEvents(userId);
        if (response.success) {
          setEnrolledEvents(response.data.event_ids || []);
        } else {
          setError(prev => ({ ...prev, enrolled: t('events.errors.loadFailed') }));
        }
      } catch (err) {
        console.error('Error fetching enrolled events:', err);
        setError(prev => ({ ...prev, enrolled: t('events.errors.connectionError') }));
      } finally {
        setLoading(prev => ({ ...prev, enrolled: false }));
      }
    };

    if (userId) {
      fetchEnrolledEvents();
    }
  }, [userId, t]);

  // Fetch ongoing events
  useEffect(() => {
    const fetchOngoingEvents = async () => {
      try {
        // This would be an actual API call in production
        // For now using mock data as an example - replace with your API
        const mockOngoingEvents = [201, 202, 203, 204, 205, 206];
        
        // Simulate API response delay
        setTimeout(() => {
          setOngoingEvents(mockOngoingEvents);
          setLoading(prev => ({ ...prev, ongoing: false }));
        }, 600);
      } catch (err) {
        console.error('Error fetching ongoing events:', err);
        setError(prev => ({ ...prev, ongoing: t('events.errors.connectionError') }));
        setLoading(prev => ({ ...prev, ongoing: false }));
      }
    };

    fetchOngoingEvents();
  }, [t]);

  // Fetch upcoming events
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const response = await allUpcomingEvents();
        if (response.success) {
          setUpcomingEvents(response.data.event_ids || []);
        } else {
          setError(prev => ({ ...prev, upcoming: t('events.errors.loadFailed') }));
        }
      } catch (err) {
        console.error('Error fetching upcoming events:', err);
        setError(prev => ({ ...prev, upcoming: t('events.errors.connectionError') }));
      } finally {
        setLoading(prev => ({ ...prev, upcoming: false }));
      }
    };

    fetchUpcomingEvents();
  }, [t]);

  // Fetch past events
  useEffect(() => {
    const fetchPastEvents = async () => {
      try {
        const response = await getUserPastEvents(userId);
        if (response.success) {
          setPastEvents(response.data.event_ids || []);
        } else {
          setError(prev => ({ ...prev, past: t('events.errors.loadFailed') }));
        }
      } catch (err) {
        console.error('Error fetching past events:', err);
        setError(prev => ({ ...prev, past: t('events.errors.connectionError') }));
      } finally {
        setLoading(prev => ({ ...prev, past: false }));
      }
    };

    if (userId) {
      fetchPastEvents();
    }
  }, [userId, t]);

  // Toggle expanded state for a section
  const toggleSectionExpansion = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get the appropriate number of events to display based on section expansion
  const getVisibleEvents = (events, section) => {
    if (expandedSections[section]) {
      return events;
    }
    return events.slice(0, INITIAL_EVENTS_TO_SHOW);
  };

  // Render event section with appropriate loading and error states
  const renderEventSection = (title, eventIds, loadingState, errorState, emptyMessage, section) => {
    const visibleEvents = getVisibleEvents(eventIds, section);
    const hasMoreEvents = eventIds.length > INITIAL_EVENTS_TO_SHOW;
    
    return (
      <section 
        className="event-section" 
        aria-labelledby={`${section}-section-heading`}
      >
        <div className="section-header">
          <h2 
            id={`${section}-section-heading`} 
            className="section-title"
          >
            {title}
          </h2>
          <span 
            className="event-count" 
            aria-label={`${eventIds.length} ${t('events.countLabel')}`}
          >
            ({eventIds.length})
          </span>
        </div>
        
        {loadingState ? (
          <div className="loading-container" aria-live="polite" aria-busy="true">
            <div className="loading-spinner" role="status"></div>
            <span className="sr-only">{t('common.loading')}</span>
          </div>
        ) : errorState ? (
          <div className="error-container" role="alert">
            <p className="error-message">{errorState}</p>
          </div>
        ) : eventIds.length === 0 ? (
          <div className="empty-state" aria-live="polite">
            <div className="empty-state-icon" aria-hidden="true">📅</div>
            <p className="empty-state-text">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <div 
              id={`${section}-events-collection`}
              className={`event-collection ${viewMode === 'grid' ? 'event-grid' : 'event-list'}`} 
              role="list"
              aria-label={`${title} events in ${viewMode} view`}
            >
              {visibleEvents.map(eventId => (
                <div 
                  key={eventId} 
                  className={`event-item ${viewMode === 'list' ? 'event-list-item' : ''}`} 
                  role="listitem"
                >
                  <EventCard eventId={eventId} viewMode={viewMode} />
                </div>
              ))}
            </div>
            
            <div className="view-more-container">
              {hasMoreEvents && (
                <button 
                  className="view-more-button" 
                  onClick={() => toggleSectionExpansion(section)}
                  aria-expanded={expandedSections[section]}
                  aria-controls={`${section}-events-collection`}
                >
                  {expandedSections[section] 
                    ? t('events.viewLess', 'View Less') 
                    : t('events.viewMore', { count: eventIds.length - INITIAL_EVENTS_TO_SHOW })}
                </button>
              )}
            </div>
          </>
        )}
      </section>
    );
  };

  return (
    <main id="main-content" className="event-page-container">
      <div className="event-page-header">
        <h1 className="page-title">{t('events.pageTitle', 'Events')}</h1>
        
        <div className="view-controls" role="toolbar" aria-label={t('events.viewControls', 'View Controls')}>
          <div className="view-mode-toggle">
            <button 
              className={`view-mode-button ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              aria-label={t('events.gridView', 'Grid View')}
            >
              <span className="view-icon grid-icon" aria-hidden="true">▦</span>
              <span className="view-text">{t('events.gridView', 'Grid')}</span>
            </button>
            <button 
              className={`view-mode-button ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              aria-label={t('events.listView', 'List View')}
            >
              <span className="view-icon list-icon" aria-hidden="true">☰</span>
              <span className="view-text">{t('events.listView', 'List')}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* 1. Enrolled Events Section */}
      {renderEventSection(
        t('events.enrolledEvents', 'Enrolled Events'), 
        enrolledEvents, 
        loading.enrolled, 
        error.enrolled, 
        t('events.noEnrolledEvents', 'You are not enrolled in any events.'),
        'enrolled'
      )}
      
      {/* 2. Ongoing Events Section */}
      {renderEventSection(
        t('events.ongoingEvents', 'Ongoing Events'), 
        ongoingEvents, 
        loading.ongoing, 
        error.ongoing, 
        t('events.noOngoingEvents', 'No ongoing events at the moment.'),
        'ongoing'
      )}
      
      {/* 3. Upcoming Events Section */}
      {renderEventSection(
        t('events.upcomingEvents', 'Upcoming Events'), 
        upcomingEvents, 
        loading.upcoming, 
        error.upcoming, 
        t('events.noUpcomingEvents', 'No upcoming events at the moment.'),
        'upcoming'
      )}
      
      {/* 4. Past Events Section */}
      {renderEventSection(
        t('events.pastEvents', 'Past Events'), 
        pastEvents, 
        loading.past, 
        error.past, 
        t('events.noPastEvents', 'No past events to display.'),
        'past'
      )}
    </main>
  );
};

export default EventPage;