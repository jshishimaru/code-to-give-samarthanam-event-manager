import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
    getEventDetails,
    getHostEvents,
    getHostOngoingEvents,
    getHostUpcomingEvents,
    getHostPastEvents,
    getHostDraftEvents
} from '../../../apiservice/event';
import { isAuthenticated, checkAuth } from '../../../apiservice/auth';
import EventCard from '../../Event/EventCard';
import '../../../styles/EventPage.css';
import '../../../styles/host/hostevents/MyEvents.css';

const MyEvents = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    // Authentication state
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        currentUser: null,
        loading: true
    });

    // State for view mode
    const [viewMode, setViewMode] = useState('grid');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    
    // State for active tab
    const [activeTab, setActiveTab] = useState('all');
    
    // State for events
    const [allEvents, setAllEvents] = useState([]);
    const [ongoingEvents, setOngoingEvents] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [pastEvents, setPastEvents] = useState([]);
    
    // Loading and error states
    const [loading, setLoading] = useState({
        all: false,
        ongoing: false,
        upcoming: false,
        past: false
    });
    
    const [error, setError] = useState({
        all: null,
        ongoing: null,
        upcoming: null,
        past: null
    });

    // Check authentication status when component mounts
    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const authResponse = await isAuthenticated();
                if (authResponse.success) {
                    setAuthState({
                        isAuthenticated: authResponse.data.isAuthenticated,
                        currentUser: authResponse.data.isAuthenticated ? authResponse.data.user : null,
                        loading: false
                    });
                } else {
                    // If the first method fails, try the backup method
                    const backupCheck = await checkAuth();
                    setAuthState({
                        isAuthenticated: backupCheck.data.authenticated,
                        currentUser: backupCheck.data.authenticated ? backupCheck.data.user : null,
                        loading: false
                    });
                }
            } catch (error) {
                console.error('Authentication check failed:', error);
                setAuthState({
                    isAuthenticated: false,
                    currentUser: null,
                    loading: false
                });
            }
        };

        checkAuthStatus();
    }, []);

    // Toggle dropdown for view mode selection
    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    // Change view mode (grid/list)
    const changeViewMode = (mode) => {
        setViewMode(mode);
        setDropdownOpen(false);
        localStorage.setItem('preferred-view-mode', mode);
    };

    // Change active tab
    const changeTab = (tab) => {
        setActiveTab(tab);
    };

    // Fetch detailed event information
    const fetchEventDetails = async (eventIds) => {
        const detailedEvents = [];
        
        // Check if eventIds is null, undefined, or not an array
        if (!eventIds || !Array.isArray(eventIds)) {
            console.error('Invalid eventIds received:', eventIds);
            return [];
        }
        
        for (const eventId of eventIds) {
            try {
                const response = await getEventDetails(eventId);
                if (response.success) {
                    // Handle different possible response structures
                    const eventData = response.data.event || response.data;
                    
                    // Normalize field names to make them consistent
                    const normalizedEvent = {
                        id: eventId,
                        event_id: eventId,
                        title: eventData.title || eventData.event_name || eventData.name,
                        description: eventData.description,
                        location: eventData.location,
                        startDate: eventData.start_time || eventData.startDate || eventData.start_date,
                        endDate: eventData.end_time || eventData.endDate || eventData.end_date,
                        image: eventData.image,
                        // Additional fields as needed
                    };
                    
                    detailedEvents.push(normalizedEvent);
                }
            } catch (error) {
                console.error(`Error fetching details for event ${eventId}:`, error);
            }
        }
        
        return detailedEvents;
    };

    // Categorize events by their status
    const categorizeEvents = (events) => {
        const now = new Date();
        const ongoing = [];
        const upcoming = [];
        const past = [];
        
        events.forEach(event => {
            // Handle different property names in the API response
            const startDate = new Date(
                event.startDate || event.start_time || event.start_date || event.startTime
            );
            const endDate = new Date(
                event.endDate || event.end_time || event.end_date || event.endTime
            );
            
            if (startDate <= now && endDate >= now) {
                ongoing.push(event);
            } else if (startDate > now) {
                upcoming.push(event);
            } else {
                past.push(event);
            }
        });
        
        return { ongoing, upcoming, past };
    };

    // Dropdown close event handler
    useEffect(() => {
        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        // Add event listener
        document.addEventListener('mousedown', handleClickOutside);

        // Load preferred view mode from localStorage
        const savedViewMode = localStorage.getItem('preferred-view-mode');
        if (savedViewMode) {
            setViewMode(savedViewMode);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Fetch events data
    useEffect(() => {
        const fetchEvents = async () => {
            // Don't fetch if authentication is still loading or not authenticated
            if (authState.loading || !authState.isAuthenticated) return;

            if (activeTab === 'all') {
                setLoading(prev => ({ ...prev, all: true }));
                try {
                    // Use getHostEvents to get all events for this host
                    const response = await getHostEvents();
                    if (response.success) {
                        // Fetch detailed event information for each event ID
                        const detailedEvents = await fetchEventDetails(response.data.event_ids || []);
                        setAllEvents(detailedEvents);
                        
                        // Categorize events for other tabs
                        const { ongoing, upcoming, past } = categorizeEvents(detailedEvents);
                        setOngoingEvents(ongoing);
                        setUpcomingEvents(upcoming);
                        setPastEvents(past);
                    } else {
                        setError(prev => ({ ...prev, all: response.error || 'Failed to fetch host events' }));
                    }
                } catch (err) {
                    setError(prev => ({ ...prev, all: err.message }));
                } finally {
                    setLoading(prev => ({ ...prev, all: false }));
                }
            } else if (activeTab === 'ongoing') {
                setLoading(prev => ({ ...prev, ongoing: true }));
                try {
                    // Use getHostOngoingEvents specifically for ongoing events
                    const response = await getHostOngoingEvents();
                    if (response.success) {
                        // Fetch detailed event information for each event ID
                        const detailedEvents = await fetchEventDetails(response.data.event_ids || []);
                        setOngoingEvents(detailedEvents);
                    } else {
                        setError(prev => ({ ...prev, ongoing: response.error || 'Failed to fetch ongoing events' }));
                    }
                } catch (err) {
                    setError(prev => ({ ...prev, ongoing: err.message }));
                } finally {
                    setLoading(prev => ({ ...prev, ongoing: false }));
                }
            } else if (activeTab === 'upcoming') {
                // Use the dedicated upcoming events endpoint instead of client-side filtering
                setLoading(prev => ({ ...prev, upcoming: true }));
                try {
                    const response = await getHostUpcomingEvents();
                    if (response.success) {
                        const detailedEvents = await fetchEventDetails(response.data.event_ids || []);
                        setUpcomingEvents(detailedEvents);
                    } else {
                        setError(prev => ({ ...prev, upcoming: response.error || 'Failed to fetch upcoming events' }));
                    }
                } catch (err) {
                    setError(prev => ({ ...prev, upcoming: err.message }));
                } finally {
                    setLoading(prev => ({ ...prev, upcoming: false }));
                }
            } else if (activeTab === 'past') {
                // Use the dedicated past events endpoint instead of client-side filtering
                setLoading(prev => ({ ...prev, past: true }));
                try {
                    const response = await getHostPastEvents();
                    if (response.success) {
                        const detailedEvents = await fetchEventDetails(response.data.event_ids || []);
                        setPastEvents(detailedEvents);
                    } else {
                        setError(prev => ({ ...prev, past: response.error || 'Failed to fetch past events' }));
                    }
                } catch (err) {
                    setError(prev => ({ ...prev, past: err.message }));
                } finally {
                    setLoading(prev => ({ ...prev, past: false }));
                }
            }
        };
        

        fetchEvents();
    }, [activeTab, authState, allEvents.length]);

    // Render event section (reusable function for all tabs)
    const renderEventSection = (title, events, isLoading, errorMessage, emptyMessage, sectionKey) => {
        return (
            <section className="event-section" aria-labelledby={`${sectionKey}-section-title`}>
                <header className="section-header">
                    <h2 id={`${sectionKey}-section-title`} className="section-title">{title}</h2>
                    {events.length > 0 && (
                        <span className="event-count" aria-label={t('events.countLabel', '{{count}} events', { count: events.length })}>
                            {events.length}
                        </span>
                    )}
                </header>
                
                {isLoading ? (
                    <div className="loading-state" aria-live="polite">
                        <div className="loading-spinner"></div>
                        <p>{t('events.loading', 'Loading events...')}</p>
                    </div>
                ) : errorMessage ? (
                    <div className="error-state" aria-live="assertive">
                        <p>{t('events.error', 'Error: {{error}}', { error: errorMessage })}</p>
                        <button className="retry-button" onClick={() => {
                            // Reset error state and trigger a refetch by changing the active tab
                            setError(prev => ({ ...prev, [sectionKey]: null }));
                            setActiveTab(activeTab); // This will trigger the useEffect
                        }}>
                            {t('events.retry', 'Retry')}
                        </button>
                    </div>
                ) : events.length === 0 ? (
                    <div className="empty-state" aria-live="polite">
                        <p>{emptyMessage}</p>
                        <button 
                            className="create-event-button"
                            onClick={() => navigate('/host/CreateEvent')}
                        >
                            {t('events.createEvent', 'Create New Event')}
                        </button>
                    </div>
                ) : (
                    <div className={`event-${viewMode === 'grid' ? 'grid' : 'list'}`} 
                        aria-label={t('events.eventListLabel', 'List of events')}>
                        {events.map(event => (
                            <EventCard 
                                key={event.id || event.event_id} 
                                eventId={event.id || event.event_id}
                                viewMode={viewMode}
                            />
                        ))}
                    </div>
                )}
            </section>
        );
    };

    // If authentication is still loading, show a loading indicator
    if (authState.loading) {
        return (
            <div className="loading-state global-loading">
                <div className="loading-spinner"></div>
                <p>{t('app.loading', 'Loading...')}</p>
            </div>
        );
    }

    // If not authenticated, redirect to login or show message
    if (!authState.isAuthenticated) {
        return (
            <div className="authentication-required container">
                <h2>{t('auth.requiredTitle', 'Authentication Required')}</h2>
                <p>{t('auth.hostOnly', 'This area is only available to event hosts.')}</p>
                <div className="auth-buttons">
                    <button 
                        className="primary-button"
                        onClick={() => navigate('/host/login')}
                    >
                        {t('auth.login', 'Log In')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <main id="main-content" className="event-page-container">
          <div className="event-page-header">
            <div className="header-left">
                <h1 className="page-title">{t('myevents.pageTitle', 'My Events')}</h1>
                
            </div>
            
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
                className={`event-tab-button ${activeTab === 'all' ? 'active' : ''}`}
                id="all-tab"
                aria-selected={activeTab === 'all'}
                aria-controls="all-tab-panel"
                onClick={() => changeTab('all')}
              >
                <span>{t('events.allEvents', 'All Events')}</span>
                <span className="tab-count">{allEvents.length}</span>
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
              {/* Create Event button - positioned in the tabs container */}
              <button 
                className="tab-create-button"
                onClick={() => navigate('/host/CreateEvent')}
                aria-label={t('events.createEventLabel', 'Create a new event')}
              >
                <span className="create-icon" aria-hidden="true"></span>
                <span>{t('events.createEvent', 'Create Event')}</span>
              </button>
            </div>
          </div>
          
          {/* Tab panels */}
          <div className="event-tab-panels">
            {/* All Events Section */}
            <div 
              role="tabpanel"
              id="all-tab-panel"
              aria-labelledby="all-tab"
              className={`event-tab-panel ${activeTab === 'all' ? 'active' : ''}`}
              hidden={activeTab !== 'all'}
            >
              {renderEventSection(
                t('events.allEvents', 'All Events'), 
                allEvents, 
                loading.all, 
                error.all, 
                t('events.noEvents', 'You haven\'t created any events yet.'),
                'all'
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
                t('events.noOngoingEvents', 'You don\'t have any ongoing events at the moment.'),
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
                t('events.noUpcomingEvents', 'You don\'t have any upcoming events scheduled.'),
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
              {renderEventSection(
                t('events.pastEvents', 'Past Events'), 
                pastEvents, 
                loading.past, 
                error.past, 
                t('events.noPastEvents', 'You don\'t have any past events to display.'),
                'past'
              )}
            </div>
          </div>
        </main>
    );
};

export default MyEvents;