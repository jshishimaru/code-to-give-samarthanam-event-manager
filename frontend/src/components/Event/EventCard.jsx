import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getEventDetails, checkUserEnrollment } from '../../apiservice/event';
import { checkAuth } from '../../apiservice/auth';
import '../../styles/Event/EventCard.css';

/**
 * EventCard component for displaying event information
 * @param {Object} props Component props
 * @param {string} props.eventId The ID of the event to display
 * @param {string} props.viewMode Display mode ('grid' or 'list')
 */
const EventCard = ({ eventId, viewMode = 'grid' }) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUserEnrolled, setIsUserEnrolled] = useState(false);
  const [enrollmentChecked, setEnrollmentChecked] = useState(false);
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isOrganizer: false,
    isVolunteer: false,
    userId: null
  });

  // Check if currently on MyEvents page
  const isOnMyEventsPage = location.pathname.includes('/host/MyEvents') && 
                          !location.pathname.includes('/CreateEvent') && 
                          !location.pathname.includes(`/${eventId}`);

  // Check authentication status
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const authResponse = await checkAuth();
        if (authResponse.success && authResponse.data.authenticated) {
          setAuthState({
            isAuthenticated: true,
            isOrganizer: authResponse.data.user.isHost || false,
            isVolunteer: authResponse.data.user.isVolunteer || false,
            userId: authResponse.data.user.id || null
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            isOrganizer: false,
            isVolunteer: false,
            userId: null
          });
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setAuthState({
          isAuthenticated: false,
          isOrganizer: false,
          isVolunteer: false,
          userId: null
        });
      }
    };

    verifyAuth();
  }, []);

  // Fetch event details
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const response = await getEventDetails(eventId);
        
        if (response.success) {
          setEvent(response.data.event || response.data);
        } else {
          setError(t('eventCard.errors.fetchFailed'));
        }
      } catch (err) {
        setError(t('eventCard.errors.generalError'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId, t]);

  // Check enrollment status if user is a volunteer
  useEffect(() => {
    const checkEnrollment = async () => {
      if (authState.isAuthenticated && authState.isVolunteer && eventId) {
        try {
          console.log('Checking enrollment for event:', eventId);
          const response = await checkUserEnrollment(eventId);
          console.log('Enrollment response:', response);
          setIsUserEnrolled(response.success && response.data.enrolled);
        } catch (err) {
          console.error('Error checking enrollment:', err);
          setIsUserEnrolled(false);
        } finally {
          setEnrollmentChecked(true);
        }
      }
    };

    checkEnrollment();
  }, [authState.isAuthenticated, authState.isVolunteer, eventId]);

  // Format date for display based on current language with improved formatting
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    try {
      const locale = i18n.language === 'en' ? 'en-US' : 
                    i18n.language === 'hi' ? 'hi-IN' : 
                    i18n.language === 'kn' ? 'kn-IN' : 
                    i18n.language === 'te' ? 'te-IN' : 'en-US';
      
      // Date formatting without time
      const dateFormatted = date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      
      // Time formatting separately
      const timeFormatted = date.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      return `${dateFormatted}`;
    } catch (e) {
      // Fallback formatting
      return `${date.toLocaleDateString()}`;
    }
  };

  // Handle click on the entire card
  const handleCardClick = () => {
    if (isOnMyEventsPage) {
      navigate(`/host/MyEvents/${eventId}`);
    } else if (authState.isAuthenticated && authState.isOrganizer && isHostedEvent()) {
      navigate(`/host/MyEvents/${eventId}`);
    } else {
      navigate(`/events/${eventId}`);
    }
  };

  // Check if the current user is the host of this event
  const isHostedEvent = () => {
    if (!event || !authState.userId) return false;
    return (
      event.host_id === authState.userId || 
      event.organizer_id === authState.userId ||
      (authState.currentUser && authState.currentUser.isHost)
    );
  };

  // Determine component class based on view mode
  const cardClasses = `event-card ${viewMode === 'list' ? 'event-card-list' : ''}`;

  if (loading) {
    return (
      <article className={cardClasses} aria-busy="true">
        <div className="event-card__image-container">
          <div className="event-card__placeholder" aria-hidden="true">
            {t('eventCard.loading')}
          </div>
        </div>
        <div className="event-card__content">
          <div className="skeleton-title"></div>
          <div className="skeleton-date"></div>
          <div className="skeleton-description"></div>
        </div>
      </article>
    );
  }

  if (error || !event) {
    return (
      <article className={cardClasses} aria-errormessage="event-card-error">
        <div className="event-card__content">
          <p id="event-card-error" className="error">
            {error || t('eventCard.errors.notFound')}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className={cardClasses} onClick={handleCardClick}>

      <div className="event-card__image-container">
        {event.image_url ? (
          <img 
          src={event.image_url} 
          alt={t('eventCard.image.alt', { name: event.event_name })} 
          className="event-card__image"
          loading="lazy"
          />
        ) : (
          <div className="event-card__placeholder" aria-label={t('eventCard.image.noImage')}>
            {t('eventCard.image.noImageText')}
          </div>
        )}
      </div>
      
      <div className="event-card__content">
        <h3 className="event-card__title">{event.event_name}</h3>
        {/* Status badges for volunteers - made more visible */}
        {authState.isAuthenticated && authState.isVolunteer && enrollmentChecked && (
          <div className="event-card__badges">
            <div className={`event-status-badge ${isUserEnrolled ? 'enrolled-badge' : 'not-enrolled-badge'}`}>
              {isUserEnrolled ? t('eventCard.status.enrolled') : t('eventCard.status.notEnrolled')}
            </div>
            <div className="event-status-badge volunteer-badge">
              {t('eventCard.status.volunteer')}
            </div>
          </div>
        )}
        
        <div className="event-card__dates" aria-label={t('eventCard.date.ariaLabel')}>
          <div className="event-card__date-row">
            <span className="event-card__date-icon" aria-hidden="true">📅</span>
            <span className="event-card__date-label">{t('eventCard.date.start')}:</span>
            <time dateTime={event.start_time} className="event-card__date-value">
              {formatDate(event.start_time)}
            </time>
          </div>
          
          <div className="event-card__date-row">
            <span className="event-card__date-icon" aria-hidden="true">🏁</span>
            <span className="event-card__date-label">{t('eventCard.date.end')}:</span>
            <time dateTime={event.end_time} className="event-card__date-value">
              {formatDate(event.end_time)}
            </time>
          </div>
        </div>
        
        {/* Only show description in list view */}
        {viewMode === 'list' && event.description && (
          <p className="event-card__description">
            {event.description}
          </p>
        )}
      </div>
    </article>
  );
};

export default EventCard;