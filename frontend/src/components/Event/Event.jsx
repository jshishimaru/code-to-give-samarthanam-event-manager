import React from 'react';
import { format } from 'date-fns';
import '../../styles/Event/Event.css';
import { useEffect } from 'react';

const Event = ({ eventData }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    
    try {
      // Parse the date string and format it nicely
      const date = new Date(dateString);
      return format(date, 'EEEE, MMMM d, yyyy • h:mm a');
    } catch (error) {
      console.error('Error parsing date:', error);
      return dateString; // Fallback to original string if parsing fails
    }
  };

  // Format date for calendar display (day and month only)
  const formatCalendarDate = (dateString) => {
    if (!dateString) return { day: "--", month: "---" };
    
    try {
      const date = new Date(dateString);
      return {
        day: format(date, 'd'),
        month: format(date, 'MMM'),
        time: format(date, 'h:mm a')
      };
    } catch (error) {
      console.error('Error parsing date for calendar:', error);
      return { day: "--", month: "---", time: "??:??" };
    }
  };

  useEffect(() => {
    console.log(eventData);
  }, [eventData]);

  // Default image if none provided
  const defaultImage = 'https://via.placeholder.com/400x300?text=Event+Image';

  // Get calendar formatted dates
  const startCalendar = formatCalendarDate(eventData?.start_time);
  const endCalendar = formatCalendarDate(eventData?.end_time);

  return (
    <div className="event-info-container">
      <div className="event-info-left">
        <section className="event-overview-section">
          <h2 className="event-section-title">Overview</h2>
          <div className="event-overview-content">
            <p className="event-overview-text">
              {eventData?.overview || 'No overview available for this event.'}
            </p>
          </div>
        </section>

        <section className="event-description-section">
          <h2 className="event-section-title">Description</h2>
          <div className="event-description-content">
            {eventData?.description ? (
              <div className="event-description-text" dangerouslySetInnerHTML={{ __html: eventData.description }} />
            ) : (
              <p className="event-description-text">No detailed description available for this event.</p>
            )}
          </div>
        </section>
      </div>

      <div className="event-info-right">
        <section className="event-dates-section">
          <div className="event-date-item">
            <h3 className="event-date-label">Starts</h3>
            <div className="date-with-calendar">
              <div className="calendar-icon starts-calendar">
                <div className="calendar-month">{startCalendar.month}</div>
                <div className="calendar-day">{startCalendar.day}</div>
              </div>
              <div className="event-date-details">
                <p className="event-date-value">{formatDate(eventData?.start_time)}</p>
              </div>
            </div>
          </div>
          
          <div className="event-date-item">
            <h3 className="event-date-label">Ends</h3>
            <div className="date-with-calendar">
              <div className="calendar-icon ends-calendar">
                <div className="calendar-month">{endCalendar.month}</div>
                <div className="calendar-day">{endCalendar.day}</div>
              </div>
              <div className="event-date-details">
                <p className="event-date-value">{formatDate(eventData?.end_time)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Add new location section */}
        <section className="event-location-section">
          <h3 className="event-section-title">Location</h3>
          <div className="location-with-icon">
            <div className="location-icon-container">
              <svg 
                className="location-icon" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 384 512"
                aria-hidden="true"
              >
                <path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/>
              </svg>
            </div>
            <div className="location-details">
              <p className="location-text">
                {eventData?.location || 'Location not specified'}
              </p>
              {eventData?.address && <p className="location-address">{eventData.address}</p>}
            </div>
          </div>
        </section>

        <section className="event-image-section">
          <img 
            src={eventData?.image || defaultImage} 
            alt={`${eventData?.title || 'Event'} promotional image`}
            className="event-image"
          />
        </section>
      </div>
    </div>
  );
};

export default Event;