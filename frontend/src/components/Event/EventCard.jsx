import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getEventDetails } from '../../apiservice/event';
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
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isOrganizer: false,
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
            userId: authResponse.data.user.id || null
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            isOrganizer: false,
            userId: null
          });
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setAuthState({
          isAuthenticated: false,
          isOrganizer: false,
          userId: null
        });
      }
    };

    verifyAuth();
  }, []);

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

  // Format date for display based on current language
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    
    // Get localized date formatting based on the current language
    try {
      // You can implement locale mapping here based on i18n.language
      const locale = i18n.language === 'en' ? 'en-US' : 
                    i18n.language === 'hi' ? 'hi-IN' : 
                    i18n.language === 'kn' ? 'kn-IN' : 
                    i18n.language === 'te' ? 'te-IN' : 'en-US';
                    
      return date.toLocaleDateString(locale, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      // Fallback to English if locale isn't supported
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
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
    <article className={cardClasses}>
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
        
        <div className="event-card__date" aria-label={t('eventCard.date.ariaLabel')}>
          <span className="event-card__date-icon" aria-hidden="true">📅</span>
          <time dateTime={event.start_time}>
            {formatDate(event.start_time)}
          </time>
        </div>
        
        {/* Only show description in list view */}
        {viewMode === 'list' && event.description && (
          <p className="event-card__description">
            {event.description}
          </p>
        )}
        
        <div className="event-card__footer">
          {/* Show "Manage Event" button when on the MyEvents page */}
          {isOnMyEventsPage ? (
            <Link 
              to={`/host/MyEvents/${eventId}`} 
              className="event-card__link manage-event-link"
              aria-label={t('eventCard.manage.ariaLabel', { name: event.event_name })}
            >
              {t('eventCard.manage.label')}
            </Link>
          ) : (
            // The original rendering logic for other pages
            authState.isAuthenticated && authState.isOrganizer && isHostedEvent() ? (
              <Link 
                to={`/host/MyEvents/${eventId}`} 
                className="event-card__link"
                aria-label={t('eventCard.edit.ariaLabel', { name: event.event_name })}
              >
                {t('eventCard.review.label')}
              </Link>
            ) : (
              <Link 
                to={`/events/${eventId}`} 
                className="event-card__link"
                aria-label={t('eventCard.viewDetails.ariaLabel', { name: event.event_name })}
              >
                {t('eventCard.viewDetails.label')}
              </Link>
            )
          )}
        </div>
      </div>
    </article>
  );
};

export default EventCard;