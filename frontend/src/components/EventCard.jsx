import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getEventDetails } from '../apiservice/event';
import '../styles/EventCard.css';

/**
 * EventCard component for displaying event information
 * @param {Object} props Component props
 * @param {string} props.eventId The ID of the event to display
 */
const EventCard = ({ eventId }) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const response = await getEventDetails(eventId);
        
        if (response.success) {
          setEvent(response.data.event);
        } else {
          setError('Failed to load event details');
        }
      } catch (err) {
        setError('An error occurred while fetching event data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <article className="event-card" aria-busy="true">
        <div className="event-card__placeholder" aria-hidden="true">
          Loading...
        </div>
      </article>
    );
  }

  if (error || !event) {
    return (
      <article className="event-card" aria-errormessage="event-card-error">
        <div className="event-card__content">
          <p id="event-card-error" className="error">
            {error || 'Event not found'}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="event-card">
      <div className="event-card__image-container">
        {event.image_url ? (
          <img 
            src={event.image_url} 
            alt={`${event.event_name} event`} 
            className="event-card__image"
            loading="lazy"
          />
        ) : (
          <div className="event-card__placeholder" aria-label="No image available">
            No image
          </div>
        )}
      </div>
      
      <div className="event-card__content">
        <h3 className="event-card__title">{event.event_name}</h3>
        
        <div className="event-card__date" aria-label="Event start date and time">
          <span className="event-card__date-icon" aria-hidden="true">📅</span>
          <time dateTime={event.start_time}>
            {formatDate(event.start_time)}
          </time>
        </div>
        
        <div className="event-card__footer">
          <Link 
            to={`/events/${eventId}`} 
            className="event-card__link"
            aria-label={`View details for ${event.event_name}`}
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
};

export default EventCard;