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

  // Render event section with appropriate loading and error states
  const renderEventSection = (title, eventIds, loadingState, errorState, emptyMessage) => (
    <section className="event-section" aria-labelledby={title.toLowerCase().replace(/\s+/g, '-')}>
      <h2 id={title.toLowerCase().replace(/\s+/g, '-')} className="section-title">{title}</h2>
      
      {loadingState ? (
        <div className="loading-container" aria-live="polite" aria-busy="true">
          <div className="loading-spinner"></div>
          <p>{t('common.loading')}</p>
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
      <h1 className="page-title">{t('events.pageTitle')}</h1>
      
      {renderEventSection(
        t('events.enrolledEvents'), 
        enrolledEvents, 
        loading.enrolled, 
        error.enrolled, 
        t('events.noEnrolledEvents')
      )}
      
      {renderEventSection(
        t('events.upcomingEvents'), 
        upcomingEvents, 
        loading.upcoming, 
        error.upcoming, 
        t('events.noUpcomingEvents')
      )}
      
      {renderEventSection(
        t('events.pastEvents'), 
        pastEvents, 
        loading.past, 
        error.past, 
        t('events.noPastEvents')
      )}
    </main>
  </>
  );
};

export default EventPage;