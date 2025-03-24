import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HostLayout from '../hostlayout/HostLayout'; // Fixed import path
import EventForm from './EventForm'; // Fixed import path
import { getEventDetails, updateEvent } from '../../../apiservice/event'; // Fixed import path
import '../../../styles/host/hostevents/HostEventDetails.css'; // Fixed import path

const HostEventDetails = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [imageUrl, setImageUrl] = useState(null); // Added for image preview
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // Fetch event data when component mounts
  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) {
        setLoading(false);
        setError('No event ID provided');
        return;
      }

      try {
        setLoading(true);
        const response = await getEventDetails(eventId);
        
        if (response.success) {
          // Handle different possible response structures
          const event = response.data.event || response.data;
          
          // Store image URL for preview if available
          if (event.image) {
            setImageUrl(typeof event.image === 'string' 
              ? event.image 
              : URL.createObjectURL(event.image));
          }
          
          // Normalize the event data to match the form fields
          const formattedEvent = {
            event_name: event.event_name || event.title || '',
            overview: event.overview || '',
            description: event.description || '',
            start_time: event.start_time || event.startDate || '',
            end_time: event.end_time || event.endDate || '',
            required_volunteers: parseInt(event.required_volunteers || 0, 10),
            status: event.status || 'Draft',
            location: event.location || '',
            task_analysis: event.task_analysis || '',
            // Don't include image here as we handle it separately
          };
          
          setEventData(formattedEvent);
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

  // Handler for form submission
  const handleSubmit = async (formData) => {
    try {
      // Ensure event_id is included in the form data
      if (!formData.has('event_id')) {
        formData.append('event_id', eventId);
      }
      
      // If no new image was uploaded but we have an existing one, 
      // don't send an empty image field to prevent overwriting
      if (!formData.get('image') && imageUrl && !formData.has('preserve_image')) {
        formData.append('preserve_image', 'true');
      }
      
      const response = await updateEvent(eventId, formData);
      
      if (response.success) {
        // Show success notification
        setNotification({
          show: true,
          message: 'Event updated successfully',
          type: 'success'
        });
        
        // Hide notification after 3 seconds
        setTimeout(() => {
          setNotification(prev => ({ ...prev, show: false }));
        }, 3000);
        
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update event');
      }
    } catch (error) {
      console.error('Error updating event:', error);
      
      // Show error notification
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
        
        {/* <header className="event-details-header">
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
          <h1 className="page-title">Edit Event</h1>
        </header> */}
        
        {loading ? (
          <div className="event-details-loading" aria-live="polite">
            <div className="loading-spinner"></div>
            <p>Loading event details...</p>
          </div>
        ) : error ? (
          <div className="event-details-error" aria-live="assertive">
            <p>{error}</p>
            <button className="back-button" onClick={() => navigate('/host/MyEvents')}>
              Return to My Events
            </button>
          </div>
        ) : (
          <EventForm 
            initialValues={{...eventData, existingImageUrl: imageUrl}} 
            onSubmit={handleSubmit} 
            isEditing={true} 
          />
        )}
      </div>
    </HostLayout>
  );
};

export default HostEventDetails;