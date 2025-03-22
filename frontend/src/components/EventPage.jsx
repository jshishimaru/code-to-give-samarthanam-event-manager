import React, { useState, useEffect } from 'react';
import { getUserEnrolledEvents, allUpcomingEvents, getUserPastEvents } from '../apiservice/event';
import EventCard from './EventCard';
import '../styles/EventPage.css';
import Navbar from './Navbar';


const EventPage = () => {
  // User ID - in a real app, this would come from auth context
  const [userId, setUserId] = useState('1'); // Placeholder user ID
  
  // State for different event categories
  const [enrolledEvents, setEnrolledEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState({
    enrolled: true,
    upcoming: true,
    past: true
  });
  const [error, setError] = useState({
    enrolled: null,
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
          setError(prev => ({ ...prev, enrolled: 'Failed to load enrolled events' }));
        }
      } catch (err) {
        console.error('Error fetching enrolled events:', err);
        setError(prev => ({ ...prev, enrolled: 'Error loading enrolled events' }));
      } finally {
        setLoading(prev => ({ ...prev, enrolled: false }));
      }
    };

    if (userId) {
      fetchEnrolledEvents();
    }
  }, [userId]);

  // Fetch upcoming events
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const response = await allUpcomingEvents();
        if (response.success) {
          setUpcomingEvents(response.data.event_ids || []);
        } else {
          setError(prev => ({ ...prev, upcoming: 'Failed to load upcoming events' }));
        }
      } catch (err) {
        console.error('Error fetching upcoming events:', err);
        setError(prev => ({ ...prev, upcoming: 'Error loading upcoming events' }));
      } finally {
        setLoading(prev => ({ ...prev, upcoming: false }));
      }
    };

    fetchUpcomingEvents();
  }, []);

  // Fetch past events
  useEffect(() => {
    const fetchPastEvents = async () => {
      try {
        const response = await getUserPastEvents(userId);
        if (response.success) {
          setPastEvents(response.data.event_ids || []);
        } else {
          setError(prev => ({ ...prev, past: 'Failed to load past events' }));
        }
      } catch (err) {
        console.error('Error fetching past events:', err);
        setError(prev => ({ ...prev, past: 'Error loading past events' }));
      } finally {
        setLoading(prev => ({ ...prev, past: false }));
      }
    };

    if (userId) {
      fetchPastEvents();
    }
  }, [userId]);

  // Render event section with appropriate loading and error states
  const renderEventSection = (title, eventIds, loadingState, errorState, emptyMessage) => (
    <section className="event-section" aria-labelledby={title.toLowerCase().replace(/\s+/g, '-')}>
      <h2 id={title.toLowerCase().replace(/\s+/g, '-')} className="section-title">{title}</h2>
      
      {loadingState ? (
        <div className="loading-container" aria-live="polite" aria-busy="true">
          <div className="loading-spinner"></div>
          <p>Loading events...</p>
        </div>
      ) : errorState ? (
        <div className="error-container" role="alert">
          <p className="error-message">{errorState}</p>
        </div>
      ) : eventIds.length === 0 ? (
        <div className="empty-container">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="event-grid" role="list">
          {eventIds.map(eventId => (
            <div key={eventId} className="event-item" role="listitem">
              <EventCard eventId={eventId} />
            </div>
          ))}
        </div>
      )}
    </section>
  );

  return (
  <>
    <Navbar />
    <main id="main-content" className="event-page-container">
      <h1 className="page-title">Events</h1>
      
      {renderEventSection(
        'Enrolled Events', 
        enrolledEvents, 
        loading.enrolled, 
        error.enrolled, 
        'You are not enrolled in any events yet.'
      )}
      
      {renderEventSection(
        'Upcoming Events', 
        upcomingEvents, 
        loading.upcoming, 
        error.upcoming, 
        'No upcoming events available.'
      )}
      
      {renderEventSection(
        'Past Events', 
        pastEvents, 
        loading.past, 
        error.past, 
        'No past events found.'
      )}
    </main>
  </>
  );
};

export default EventPage;