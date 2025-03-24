import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HostLayout from '../hostlayout/HostLayout';
import EventForm from './EventForm';
import { createEvent } from '../../../apiservice/event';
import '../../../styles/host/hostevents/HostEventDetails.css';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // Handler for form submission
  const handleSubmit = async (formData) => {
    try {
      const response = await createEvent(formData);
      
      if (response.success) {
        // Show success notification
        setNotification({
          show: true,
          message: 'Event created successfully',
          type: 'success'
        });
        
        // Navigate to the event details page after successful creation
        setTimeout(() => {
          navigate(`/host/event-info/${response.data.event_id}`);
        }, 1500);
        
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      
      // Show error notification
      setNotification({
        show: true,
        message: error.message || 'Failed to create event',
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
    <HostLayout>
      <div className="host-event-details-page">
        {notification.show && (
          <div className={`notification ${notification.type}`} role="alert">
            <span>{notification.message}</span>
            <button className="close-notification" onClick={closeNotification} aria-label="Close notification">×</button>
          </div>
        )}
        
        <header className="event-details-header">
          <button 
            className="back-to-events-button" 
            onClick={() => navigate('/host/MyEvents')}
            aria-label="Go back to my events page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to My Events
          </button>
          <h1 className="page-title">Create New Event</h1>
        </header>
        
        <EventForm onSubmit={handleSubmit} isEditing={false} />
      </div>
    </HostLayout>
  );
};

export default CreateEvent;