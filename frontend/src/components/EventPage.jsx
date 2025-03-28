import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getUserEnrolledEvents, 
  allUpcomingEvents, 
  getUserPastEvents, 
  getAllOngoingEvents,
  getUserOngoingEvents
} from '../apiservice/event';
import { checkAuth } from '../apiservice/auth';
import { checkFeedbackEligibility } from '../apiservice/feedback';
import { getRecommendedEvents , getEventsSortedByRelevance } from '../apiservice/ml';
import EventCard from './Event/EventCard';
import '../styles/EventPage.css';
import Navbar from './Navbar';
import { useTranslation } from 'react-i18next';

const EventPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // User authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  
  // State for different event categories
  const [enrolledEvents, setEnrolledEvents] = useState([]);
  const [ongoingEvents, setOngoingEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  
  // Track feedback status for past events
  const [feedbackStatus, setFeedbackStatus] = useState({});
  const [feedbackStatusLoading, setFeedbackStatusLoading] = useState(false);
  
  // View mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState('grid');
  
  // Active tab state
  const [activeTab, setActiveTab] = useState(isAuthenticated ? 'enrolled' : 'ongoing');
  
  // Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Number of events to show initially per section
  const INITIAL_EVENTS_TO_SHOW = 4;
  
  // Computed property for showing featured tab
  const showFeaturedTab = isAuthenticated && userRole !== 'host';
  
  // State to track expanded sections
  const [expandedSections, setExpandedSections] = useState({
    enrolled: false,
    ongoing: false,
    upcoming: false,
    past: false,
    featured: false
  });
  
  // Loading and error states
  const [loading, setLoading] = useState({
    enrolled: true,
    ongoing: true,
    upcoming: true,
    past: true,
    featured: true
  });
  
  const [error, setError] = useState({
    enrolled: null,
    ongoing: null,
    upcoming: null,
    past: null,
    featured: null
  });
  
  // Check user authentication status
  useEffect(() => {
    const checkUserAuthentication = async () => {
      try {
        const response = await checkAuth();
        if (response.success && response.data.authenticated) {
          setIsAuthenticated(true);
          setUserId(response.data.user.id);
          // Set user role based on isHost flag
          setUserRole(response.data.user.isHost ? 'host' : 'volunteer');
          setActiveTab('enrolled');
        } else {
          setIsAuthenticated(false);
          setUserId(null);
          setUserRole(null);
          setActiveTab('ongoing');
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        setIsAuthenticated(false);
        setUserRole(null);
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

  const [detailedEventData, setDetailedEventData] = useState({});

  // Update the fetchFeaturedEvents function to store the detailed event data
  useEffect(() => {
	const fetchFeaturedEvents = async () => {
	  // Only fetch featured events for volunteers, not for hosts
	  if (!isAuthenticated || (isAuthenticated && userRole === 'host')) {
		setLoading(prev => ({ ...prev, featured: false }));
		return;
	  }
	  
	  try {
		// Use the new sorted-by-relevance endpoint, which works better for personalization
		const response = await getEventsSortedByRelevance({ 
		  status: 'active',
		  limit: 10,
		  includePast: false
		});
		
		if (response.success) {
		  // Extract the event IDs from the recommendations
		  const eventIds = response.data.events.map(event => event.id);
		  setFeaturedEvents(eventIds);
		  
		  // Store detailed event data
		  const detailedData = {};
		  response.data.events.forEach(event => {
			detailedData[event.id] = {
			  matchScore: event.relevance_score || event.skill_match_percent,
			  matchingSkills: event.matching_skills || [],
			  extractedSkills: event.extracted_skills || []
			};
		  });
		  setDetailedEventData(detailedData);
		  
		  // Update UI to show message if events are not personalized
		  if (!response.data.personalized && response.data.message) {
			setError(prev => ({ 
			  ...prev, 
			  featured: response.data.message
			}));
		  }
		} else {
		  setError(prev => ({ 
			...prev, 
			featured: response.error || t('events.errors.featuredLoadFailed') 
		  }));
		}
	  } catch (err) {
		console.error('Error fetching featured events:', err);
		setError(prev => ({ 
		  ...prev, 
		  featured: t('events.errors.connectionError') 
		}));
	  } finally {
		setLoading(prev => ({ ...prev, featured: false }));
	  }
	};
  
	fetchFeaturedEvents();
  }, [isAuthenticated, userRole, t]);

  // Fetch ongoing events - use appropriate API based on authentication status
  useEffect(() => {
    const fetchOngoingEvents = async () => {
      try {
        // Use the appropriate API function based on authentication status
        const fetchFunction = getAllOngoingEvents;
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

  // Fetch past events and check feedback status
  useEffect(() => {
    const fetchPastEvents = async () => {
      try {
        const response = await getUserPastEvents(userId);
        if (response.success) {
          const pastEventIds = response.data.event_ids || [];
          setPastEvents(pastEventIds);
          
          // Check feedback status for all past events
          if (pastEventIds.length > 0) {
            checkFeedbackStatusForEvents(pastEventIds);
          }
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

  // Check feedback eligibility status for past events
  const checkFeedbackStatusForEvents = async (eventIds) => {
    setFeedbackStatusLoading(true);
    
    const statusMap = {};
    
    try {
      // Check status for each event (could be optimized with a batch API endpoint)
      for (const eventId of eventIds) {
        const response = await checkFeedbackEligibility(eventId);
        
        if (response.success) {
          statusMap[eventId] = {
            eligible: response.data.eligible,
            reason: response.data.reason,
            existingFeedbackId: response.data.existing_feedback_id
          };
        } else {
          // If check fails, assume not eligible
          statusMap[eventId] = {
            eligible: false,
            reason: "Unable to check status",
            existingFeedbackId: null
          };
        }
      }
      
      setFeedbackStatus(statusMap);
    } catch (err) {
      console.error('Error checking feedback status for events:', err);
    } finally {
      setFeedbackStatusLoading(false);
    }
  };
  
  // Handle feedback button click
  const handleFeedbackClick = (eventId) => {
    navigate(`/events/${eventId}/feedback`);
  };

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
				  <div className="event-card-container">
					<EventCard eventId={eventId} viewMode={viewMode} />
					
					{/* Show match score and matching skills for featured events */}
					{section === 'featured' && detailedEventData[eventId] && (
					  <div className="event-match-details">
						{detailedEventData[eventId].matchScore && (
						  <div className="event-match-score">
							<span>{t('recommendations.matchLabel')}:</span>
							<span className="match-value">{Math.round(detailedEventData[eventId].matchScore)}%</span>
						  </div>
						)}
						
						{detailedEventData[eventId].matchingSkills && detailedEventData[eventId].matchingSkills.length > 0 && (
						  <div className="event-matching-skills">
							<span>{t('recommendations.skillsLabel')}:</span>
							<div className="skills-tags">
							  {detailedEventData[eventId].matchingSkills.slice(0, 3).map((skill, index) => (
								<span key={index} className="skill-tag">{skill}</span>
							  ))}
							  {detailedEventData[eventId].matchingSkills.length > 3 && (
								<span className="more-skills">+{detailedEventData[eventId].matchingSkills.length - 3}</span>
							  )}
							</div>
						  </div>
						)}
					  </div>
					)}
					
					{/* Add feedback buttons for past events */}
					{section === 'past' && !feedbackStatusLoading && (
					  <div className="event-feedback-actions">
						{feedbackStatus[eventId] && (
						  <button 
							className={`event-feedback-btn ${feedbackStatus[eventId].existingFeedbackId ? 'view-feedback' : 'submit-feedback'}`}
							onClick={() => handleFeedbackClick(eventId)}
							aria-label={feedbackStatus[eventId].existingFeedbackId 
							  ? t('events.viewFeedback.ariaLabel', 'View your feedback for this event') 
							  : t('events.submitFeedback.ariaLabel', 'Submit feedback for this event')}
						  >
							{/* Add appropriate icons */}
							{feedbackStatus[eventId].existingFeedbackId ? (
							  <>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
								  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
								  <circle cx="12" cy="12" r="3"></circle>
								</svg>
								{t('events.viewFeedback', 'View Feedback')}
							  </>
							) : (
							  <>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
								  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
								</svg>
								{t('events.submitFeedback', 'Submit Feedback')}
							  </>
							)}
						  </button>
						)}
					  </div>
					)}
				  </div>
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
            { isAuthenticated && (
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
            )}
            {showFeaturedTab && isAuthenticated && (
              <button 
                role="tab"
                className={`event-tab-button ${activeTab === 'featured' ? 'active' : ''}`}
                id="featured-tab"
                aria-selected={activeTab === 'featured'}
                aria-controls="featured-tab-panel"
                onClick={() => changeTab('featured')}
              >
                <span>{t('events.featuredEvents', 'Featured For You')}</span>
                <span className="tab-count">{featuredEvents.length}</span>
              </button>
            )}


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
          
          { isAuthenticated && (
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
          )}
        </div>
      </div>
      
      {/* Tab panels */}
      <div className="event-tab-panels">
        {showFeaturedTab && (
          <div 
            role="tabpanel"
            id="featured-tab-panel"
            aria-labelledby="featured-tab"
            className={`event-tab-panel ${activeTab === 'featured' ? 'active' : ''}`}
            hidden={activeTab !== 'featured'}
          >
            {renderEventSection(
              t('events.featuredEvents', 'Featured For You'), 
              featuredEvents, 
              loading.featured, 
              error.featured, 
              t('events.noFeaturedEvents', 'No personalized event recommendations available at the moment.'),
              'featured'
            )}
          </div>
        )}
        
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