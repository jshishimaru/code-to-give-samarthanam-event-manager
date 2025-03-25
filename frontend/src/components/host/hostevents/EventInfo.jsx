import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
// import HostLayout from '../hostlayout/HostLayout';
import EventForm from './EventForm';
import { getEventDetails, updateEvent } from '../../../apiservice/event';
import '../../../styles/host/hostevents/EventInfo.css';

const EventInfo = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) {
        setError('No event ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getEventDetails(eventId);
        
        if (response.success && response.data) {
          // Access the event data - handle different response structures
          const event = response.data.event || response.data;
          setEventData(event);
        } else {
          setError(response.error || 'Failed to load event details');
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('An error occurred while loading the event');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleUpdateSuccess = (updatedData) => {
    setEventData(updatedData.event || updatedData);
    setIsEditing(false);
    setNotification({
      show: true,
      message: t('events.updateSuccess', 'Event updated successfully'),
      type: 'success'
    });
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSubmit = async (formData) => {
    try {
      // Make sure event_id is included
      if (formData instanceof FormData) {
        if (!formData.has('event_id')) {
          formData.append('event_id', eventId);
        }
      } else if (!formData.event_id) {
        formData.event_id = eventId;
      }
      
      const response = await updateEvent(formData);
      
      if (response.success) {
        handleUpdateSuccess(response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      setNotification({
        show: true,
        message: error.message || 'Failed to update event',
        type: 'error'
      });
      
      // Hide notification after 5 seconds
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      
      throw error;
    }
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return format(date, 'PPP p'); // e.g., "April 29, 2023 at 2:30 PM"
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString || 'N/A';
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'upcoming':
        return 'status-upcoming';
      case 'in progress':
        return 'status-in-progress';
      case 'completed':
        return 'status-completed';
      case 'draft':
        return 'status-draft';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  };

  // Get a status icon based on the status
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'upcoming':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        );
      case 'in progress':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
          </svg>
        );
      case 'completed':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      case 'draft':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        );
      case 'cancelled':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
      <div className="event-info-container">
        {notification.show && (
          <div className={`notification ${notification.type}`} role="alert">
            <span>{notification.message}</span>
            <button 
              className="close-notification" 
              onClick={closeNotification} 
              aria-label={t('common.close', 'Close')}
            >
              ×
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-container" aria-live="polite">
            <div className="loading-spinner"></div>
            <p>{t('common.loading', 'Loading event details...')}</p>
          </div>
        ) : error ? (
          <div className="error-container" aria-live="assertive">
            <h3>{t('common.error', 'Error')}</h3>
            <p>{error}</p>
            <button 
              className="back-button" 
              onClick={() => navigate('/host/MyEvents')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              {t('common.back', 'Back to My Events')}
            </button>
          </div>
        ) : isEditing ? (
          <div className="edit-event-container">
            <h2>{t('events.editEvent', 'Edit Event')}</h2>
            <EventForm
              initialValues={eventData}
              onSubmit={handleSubmit}
              onCancel={handleCancelEdit}
              isEditing={true}
            />
          </div>
        ) : (
          <div className="event-details">
            <div className="event-header">
              <h1 className="event-title">{eventData?.event_name || eventData?.title}</h1>
              <div className="event-actions">
                <button 
                  className="edit-button" 
                  onClick={handleEditClick}
                  aria-label={t('events.editEvent', 'Edit Event')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  {t('events.edit', 'Edit')}
                </button>
                <button 
                  className="back-button" 
                  onClick={() => navigate('/host/MyEvents')}
                  aria-label={t('common.back', 'Back to My Events')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                  {t('common.back', 'Back')}
                </button>
              </div>
            </div>

            <div className="event-status-container">
              <span className={`event-status ${getStatusClass(eventData?.status)}`}>
                {getStatusIcon(eventData?.status)} 
                {eventData?.status || 'Draft'}
              </span>
            </div>

            <div className="event-content-container">
              <div className="event-main-content">
                <div className="event-info-sections">
                  <div className="info-section">
                    <h2>{t('events.overview', 'Overview')}</h2>
                    <div className="section-content">
                      <p>{eventData?.overview || t('common.notProvided', 'No overview provided')}</p>
                    </div>
                  </div>

                  <div className="info-section">
                    <h2>{t('events.details', 'Event Details')}</h2>
                    <div className="section-content">
                      <div className="detail-grid">
                        <div className="detail-item">
                          <span className="detail-label">{t('events.startDate', 'Start Date')}</span>
                          <span className="detail-value">
                            {formatDate(eventData?.start_time || eventData?.startDate)}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">{t('events.endDate', 'End Date')}</span>
                          <span className="detail-value">
                            {formatDate(eventData?.end_time || eventData?.endDate)}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">{t('events.location', 'Location')}</span>
                          <span className="detail-value">
                            {eventData?.location || t('common.notProvided', 'Not specified')}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">{t('events.volunteers', 'Required Volunteers')}</span>
                          <span className="detail-value">
                            {eventData?.required_volunteers || 0}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">{t('events.enrolledVolunteers', 'Enrolled Volunteers')}</span>
                          <span className="detail-value">
                            {eventData?.volunteer_enrolled_count || 0}
                          </span>
                        </div>
                        {eventData?.event_type && (
                          <div className="detail-item">
                            <span className="detail-label">{t('events.type', 'Event Type')}</span>
                            <span className="detail-value">
                              {eventData.event_type}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="info-section">
                    <h2>{t('events.description', 'Description')}</h2>
                    <div className="section-content description-content">
                      <p>{eventData?.description || t('common.notProvided', 'No description provided')}</p>
                    </div>
                  </div>

                  {/* {eventData?.task_analysis && (
                    <div className="info-section">
                      <h2>{t('events.taskAnalysis', 'Task Analysis')}</h2>
                      <div className="section-content">
                        <p>{eventData.task_analysis}</p>
                      </div>
                    </div>
                  )} */}
                </div>
              </div>

              {eventData?.image && (
                <div className="event-image-container">
                  <img 
                    src={eventData.image} 
                    alt={eventData.event_name || eventData.title || 'Event'} 
                    className="event-image"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
  );
};

export default EventInfo;