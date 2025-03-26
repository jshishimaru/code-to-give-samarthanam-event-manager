import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getEventDetails } from '../../../apiservice/event';
import ExportData from './exportdata';
import EventAnalytics from './charts';
import FeedbackReportSummary from './feedbackreport';
import '../../../styles/host/stats/statspage.css';

/**
 * StatsPage component - displays statistics and data export options for an event
 * 
 * @param {Object} props Component props
 * @param {number} props.eventId - The ID of the event
 */
const StatsPage = ({ eventId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const handleViewFeedbackDetails = () => {
    // Navigate to a detailed feedback report page
    navigate(`/host/events/${eventId}/feedback-report`);
  };

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
        {/* Feedback Report Section */}
        <section className="stats-section">
          <h3 className="section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            {t('statsPage.feedbackSection', 'Feedback Report')}
          </h3>
          <FeedbackReportSummary
            eventId={eventId}
            eventName={eventName}
            onViewDetails={handleViewFeedbackDetails}
          />
        </section>

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

        {/* Charts Section */}
        <section className="stats-section charts-section">
          <EventAnalytics eventId={eventId} eventName={eventName} />
        </section>
      </div>
    </div>
  );
};

export default StatsPage;