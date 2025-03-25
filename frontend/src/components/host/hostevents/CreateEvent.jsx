import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HostLayout from '../hostlayout/HostLayout';
import EventForm from './EventForm';
import { createEvent } from '../../../apiservice/event';
import { useTranslation } from 'react-i18next';
import '../../../styles/host/hostevents/HostEventDetails.css';

const CreateEvent = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // Handler for form submission
  const handleSubmit = async (formData) => {
    try {
	// debug	
	// console.log("Form data entries:");
	// for (const pair of formData.entries()) {
	//   console.log(`${pair[0]}: ${pair[1]}`);
	// }
		const response = await createEvent(formData);
      
      if (response.success) {
        // Show success notification
        setNotification({
          show: true,
          message: t('events.createSuccess', 'Event created successfully'),
          type: 'success'
        });
        
        // Navigate to the event details page after successful creation
        setTimeout(() => {
			navigate('/host/MyEvents');
        }, 1500);
        
        return response.data;
      } else {
        throw new Error(response.error || t('events.createError', 'Failed to create event'));
      }
    } catch (error) {
      console.error('Error creating event:', error);
      
      // Show error notification
      setNotification({
        show: true,
        message: error.message || t('events.createError', 'Failed to create event'),
        type: 'error'
      });
      
      // Hide notification after 5 seconds
      setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 5000);
      
      throw error;
    }
  };

  // Close notification manually
  const closeNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  return (
    <div className="create-event-page">
      {notification.show && (
        <div className={`notification ${notification.type}`} role="alert">
          <span>{notification.message}</span>
          <button className="close-notification" onClick={closeNotification} aria-label={t('common.closeNotification', 'Close notification')}>×</button>
        </div>
      )}
      
      <header className="page-header">
        <button 
          className="back-button" 
          onClick={() => navigate('/host/MyEvents')}
          aria-label={t('events.backToMyEvents', 'Back to My Events')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          {t('events.backToMyEvents', 'Back to My Events')}
        </button>
        {/* <h1 className="page-title">{t('events.createNew', 'Create New Event')}</h1> */}
      </header>
      
      <EventForm onSubmit={handleSubmit} isEditing={false} />
    </div>
  );
};

export default CreateEvent;