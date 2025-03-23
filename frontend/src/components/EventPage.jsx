import React, { useState, useEffect, useRef } from 'react';
import { 
  getUserEnrolledEvents, 
  allUpcomingEvents, 
  getUserPastEvents, 
  getAllOngoingEvents,
  getUserOngoingEvents
} from '../apiservice/event';
import { checkAuth } from '../apiservice/auth';
import EventCard from './EventCard';
import '../styles/EventPage.css';
import Navbar from './Navbar';
import { useTranslation } from 'react-i18next';

const EventPage = () => {
  const { t } = useTranslation();
  
  // User authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  
  // State for different event categories
  const [enrolledEvents, setEnrolledEvents] = useState([]);
  const [ongoingEvents, setOngoingEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  
  // View mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState('grid');
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('enrolled');
  
  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
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

  // Check user authentication status
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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch enrolled events when user is authenticated
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
    } else {
      setLoading(prev => ({ ...prev, enrolled: false }));
    }
  }, [userId, t]);

  // Fetch ongoing events - use appropriate API based on authentication status
  useEffect(() => {
    const fetchOngoingEvents = async () => {
      try {
        // Use the appropriate API function based on authentication status
        const fetchFunction = isAuthenticated ? getUserOngoingEvents : getAllOngoingEvents;
        const response = await fetchFunction();
        
        if (response.success) {
          setOngoingEvents(response.data.event_ids || []);
        } else {
          setError(prev => ({ ...prev, ongoing: t('events.errors.loadFailed') }));
        }
      } catch (err) {
        console.error('Error fetching ongoing events:', err);
        setError(prev => ({ ...prev, ongoing: t('events.errors.connectionError') }));
      } finally {
        setLoading(prev => ({ ...prev, ongoing: false }));
      }
    };

    fetchOngoingEvents();
  }, [isAuthenticated, t]);

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
    } else {
      setLoading(prev => ({ ...prev, past: false }));
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

  // Toggle dropdown
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Change view mode and close dropdown
  const changeViewMode = (mode) => {
    setViewMode(mode);
    setDropdownOpen(false);
  };
  
  // Change active tab
  const changeTab = (tabName) => {
    setActiveTab(tabName);
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
          <div className="view-mode-dropdown" ref={dropdownRef}>
            <button 
              className="dropdown-toggle"
              onClick={toggleDropdown}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              <span className={`view-icon ${viewMode === 'grid' ? 'grid-icon' : 'list-icon'}`} aria-hidden="true">
                {viewMode === 'grid' ? '▦' : '☰'}
              </span>
              <span className="view-text">
                {viewMode === 'grid' ? t('events.gridView', 'Grid') : t('events.listView', 'List')}
              </span>
              <span className="dropdown-arrow" aria-hidden="true">▼</span>
            </button>
            
            {dropdownOpen && (
              <div className="dropdown-menu">
                <button 
                  className={`dropdown-item ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => changeViewMode('grid')}
                  aria-pressed={viewMode === 'grid'}
                >
                  <span className="view-icon grid-icon" aria-hidden="true">▦</span>
                  <span>{t('events.gridView', 'Grid')}</span>
                </button>
                <button 
                  className={`dropdown-item ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => changeViewMode('list')}
                  aria-pressed={viewMode === 'list'}
                >
                  <span className="view-icon list-icon" aria-hidden="true">☰</span>
                  <span>{t('events.listView', 'List')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Tab navigation */}
      <div className="event-tabs-container">
        <div 
          className="event-tabs" 
          role="tablist" 
          aria-label={t('events.tabsLabel', 'Event categories')}
        >
          <button 
            role="tab"
            className={`event-tab-button ${activeTab === 'enrolled' ? 'active' : ''}`}
            id="enrolled-tab"
            aria-selected={activeTab === 'enrolled'}
            aria-controls="enrolled-tab-panel"
            onClick={() => changeTab('enrolled')}
          >
            <span>{t('events.enrolledEvents', 'Enrolled Events')}</span>
            <span className="tab-count">{enrolledEvents.length}</span>
          </button>
          
          <button 
            role="tab"
            className={`event-tab-button ${activeTab === 'ongoing' ? 'active' : ''}`}
            id="ongoing-tab"
            aria-selected={activeTab === 'ongoing'}
            aria-controls="ongoing-tab-panel"
            onClick={() => changeTab('ongoing')}
          >
            <span>{t('events.ongoingEvents', 'Ongoing Events')}</span>
            <span className="tab-count">{ongoingEvents.length}</span>
          </button>
          
          <button 
            role="tab"
            className={`event-tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
            id="upcoming-tab"
            aria-selected={activeTab === 'upcoming'}
            aria-controls="upcoming-tab-panel"
            onClick={() => changeTab('upcoming')}
          >
            <span>{t('events.upcomingEvents', 'Upcoming Events')}</span>
            <span className="tab-count">{upcomingEvents.length}</span>
          </button>
          
          <button 
            role="tab"
            className={`event-tab-button ${activeTab === 'past' ? 'active' : ''}`}
            id="past-tab"
            aria-selected={activeTab === 'past'}
            aria-controls="past-tab-panel"
            onClick={() => changeTab('past')}
          >
            <span>{t('events.pastEvents', 'Past Events')}</span>
            <span className="tab-count">{pastEvents.length}</span>
          </button>
        </div>
      </div>
      
      {/* Tab panels */}
      <div className="event-tab-panels">
        {/* Enrolled Events Section */}
        <div 
          role="tabpanel"
          id="enrolled-tab-panel"
          aria-labelledby="enrolled-tab"
          className={`event-tab-panel ${activeTab === 'enrolled' ? 'active' : ''}`}
          hidden={activeTab !== 'enrolled'}
        >
          {!isAuthenticated ? (
            <div className="authentication-required">
              <p>{t('events.authRequired', 'You need to be logged in to see your enrolled events.')}</p>
            </div>
          ) : (
            renderEventSection(
              t('events.enrolledEvents', 'Enrolled Events'), 
              enrolledEvents, 
              loading.enrolled, 
              error.enrolled, 
              t('events.noEnrolledEvents', 'You are not enrolled in any events.'),
              'enrolled'
            )
          )}
        </div>
        
        {/* Ongoing Events Section */}
        <div 
          role="tabpanel"
          id="ongoing-tab-panel"
          aria-labelledby="ongoing-tab"
          className={`event-tab-panel ${activeTab === 'ongoing' ? 'active' : ''}`}
          hidden={activeTab !== 'ongoing'}
        >
          {renderEventSection(
            t('events.ongoingEvents', 'Ongoing Events'), 
            ongoingEvents, 
            loading.ongoing, 
            error.ongoing, 
            t('events.noOngoingEvents', 'No ongoing events at the moment.'),
            'ongoing'
          )}
        </div>
        
        {/* Upcoming Events Section */}
        <div 
          role="tabpanel"
          id="upcoming-tab-panel"
          aria-labelledby="upcoming-tab"
          className={`event-tab-panel ${activeTab === 'upcoming' ? 'active' : ''}`}
          hidden={activeTab !== 'upcoming'}
        >
          {renderEventSection(
            t('events.upcomingEvents', 'Upcoming Events'), 
            upcomingEvents, 
            loading.upcoming, 
            error.upcoming, 
            t('events.noUpcomingEvents', 'No upcoming events at the moment.'),
            'upcoming'
          )}
        </div>
        
        {/* Past Events Section */}
        <div 
          role="tabpanel"
          id="past-tab-panel"
          aria-labelledby="past-tab"
          className={`event-tab-panel ${activeTab === 'past' ? 'active' : ''}`}
          hidden={activeTab !== 'past'}
        >
          {!isAuthenticated ? (
            <div className="authentication-required">
              <p>{t('events.authRequired', 'You need to be logged in to see your past events.')}</p>
            </div>
          ) : (
            renderEventSection(
              t('events.pastEvents', 'Past Events'), 
              pastEvents, 
              loading.past, 
              error.past, 
              t('events.noPastEvents', 'No past events to display.'),
              'past'
            )
          )}
        </div>
      </div>
    </main>
  );
};

export default EventPage;