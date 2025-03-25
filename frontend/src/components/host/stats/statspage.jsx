import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getEventDetails } from '../../../apiservice/event';
import ExportData from './exportdata';
import '../../../styles/host/stats/statspage.css';

/**
 * StatsPage component - displays statistics and data export options for an event
 * 
 * @param {Object} props Component props
 * @param {number} props.eventId - The ID of the event
 */
const StatsPage = ({ eventId }) => {
  const { t } = useTranslation();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch event details on component mount
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) {
        setError('Event ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getEventDetails(eventId);
        
        if (response.success) {
          setEvent(response.data.event);
        } else {
          setError(response.error || 'Failed to load event details');
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('An error occurred while loading event data');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  if (loading) {
    return (
      <div className="stats-page-loading">
        <div className="spinner"></div>
        <p>{t('statsPage.loading', 'Loading event statistics...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stats-page-error">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>{error}</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="stats-page-error">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>{t('statsPage.eventNotFound', 'Event not found')}</p>
      </div>
    );
  }

  const eventName = event.title || event.event_name || `Event ${eventId}`;

  return (
    <div className="stats-page-container">
      <div className="stats-page-header">
        <h1>{t('statsPage.title', 'Event Statistics')}</h1>
        <h2>{eventName}</h2>
      </div>

      <div className="stats-page-content">
        {/* Export data section */}
        <section className="stats-section">
          <h3 className="section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            {t('statsPage.exportSection', 'Export Event Data')}
          </h3>
          <ExportData 
            eventId={eventId} 
            eventName={eventName}
            onError={(err) => console.error('Export error:', err)}
          />
        </section>

        <section className="stats-section">
          <h3 className="section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            {t('statsPage.summarySection', 'Event Summary')}
          </h3>
          <div className="stats-coming-soon">
            <p>{t('statsPage.comingSoon', 'Event summary statistics will be available soon.')}</p>
          </div>
        </section>

        <section className="stats-section">
          <h3 className="section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            {t('statsPage.volunteersSection', 'Volunteer Analytics')}
          </h3>
          <div className="stats-coming-soon">
            <p>{t('statsPage.comingSoon', 'Volunteer analytics will be available soon.')}</p>
          </div>
        </section>

        <section className="stats-section">
          <h3 className="section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"></path>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
            </svg>
            {t('statsPage.tasksSection', 'Task Completion Analytics')}
          </h3>
          <div className="stats-coming-soon">
            <p>{t('statsPage.comingSoon', 'Task completion analytics will be available soon.')}</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StatsPage;