import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventDetails, updateEvent } from '../../apiservice/event';
import { checkAuth } from '../../apiservice/auth';
import NotificationPopup from '../NotificationPopup';
import '../../styles/host/HostEventDetails.css';
import HostLayout from './hostlayout/HostLayout';

const HostEventDetails = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editMode, setEditMode] = useState({});
    const [editValues, setEditValues] = useState({});
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        isHost: false,
        loading: true
    });
    
    // Notification state
    const [notification, setNotification] = useState({
        show: false,
        message: '',
        type: 'success'
    });

    // Check authentication and fetch event details
    useEffect(() => {
        const checkUserAuth = async () => {
            try {
                const response = await checkAuth();
                if (response.success && response.data.authenticated) {
                    setAuthState({
                        isAuthenticated: true,
                        isHost: response.data.user.isHost,
                        loading: false
                    });
                    
                    if (!response.data.user.isHost) {
                        // Redirect non-hosts to the regular event view
                        navigate(`/events/${eventId}`);
                    }
                } else {
                    setAuthState({
                        isAuthenticated: false,
                        isHost: false,
                        loading: false
                    });
                    // Redirect to login
                    navigate('/host/login');
                }
            } catch (err) {
                console.error('Authentication check failed:', err);
                setAuthState({
                    isAuthenticated: false,
                    isHost: false,
                    loading: false
                });
                setError('Authentication failed. Please log in again.');
            }
        };
        
        checkUserAuth();
    }, [eventId, navigate]);

    // Fetch event details
    useEffect(() => {
        const fetchEventDetails = async () => {
            if (!authState.isHost || authState.loading) return;
            
            try {
                setLoading(true);
                const response = await getEventDetails(eventId);
                
                if (response.success) {
                    const eventData = response.data.event || response.data;
                    setEvent(eventData);
                    // Initialize edit values with current event data
                    setEditValues({
                        event_name: eventData.event_name || eventData.title,
                        overview: eventData.overview,
                        description: eventData.description,
                        start_time: eventData.start_time,
                        end_time: eventData.end_time,
                        location: eventData.location,
                        required_volunteers: eventData.required_volunteers,
                        status: eventData.status,
                        image: eventData.image
                    });
                } else {
                    setError('Failed to load event details.');
                }
            } catch (err) {
                console.error('Error fetching event:', err);
                setError('An error occurred while loading the event.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchEventDetails();
    }, [eventId, authState]);

    // Show notification
    const showNotification = (message, type = 'success') => {
        setNotification({
            show: true,
            message,
            type
        });
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            closeNotification();
        }, 3000);
    };
    
    // Close notification
    const closeNotification = () => {
        setNotification(prev => ({
            ...prev,
            show: false
        }));
    };

    // Toggle edit mode for a field
    const toggleEditMode = (field) => {
        setEditMode(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    // Handle input change
    const handleInputChange = (field, value) => {
        setEditValues(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Save field changes
    const saveField = async (field) => {
        try {
            const updateData = {
                event_id: eventId,
                [field]: editValues[field]
            };
            
            const response = await updateEvent(updateData);
            
            if (response.success) {
                // Update the local event state with the new value
                setEvent(prev => ({
                    ...prev,
                    [field]: editValues[field]
                }));
                
                showNotification(`${field.replace('_', ' ')} updated successfully`, 'success');
                toggleEditMode(field);
            } else {
                showNotification(`Failed to update ${field.replace('_', ' ')}`, 'error');
            }
        } catch (err) {
            console.error(`Error updating ${field}:`, err);
            showNotification(`Error updating ${field.replace('_', ' ')}`, 'error');
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch (e) {
            return dateString;
        }
    };

    // Format date for input
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            return date.toISOString().slice(0, 16);
        } catch (e) {
            return dateString;
        }
    };

    if (authState.loading || loading) {
        return (
            <div className="event-details-loading" aria-live="polite">
                <div className="loading-spinner"></div>
                <p>Loading event details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="event-details-error" role="alert">
                <p>{error}</p>
                <button 
                    className="back-button"
                    onClick={() => navigate('/host/MyEvents')}
                >
                    Back to My Events
                </button>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="event-details-error" role="alert">
                <p>Event not found.</p>
                <button 
                    className="back-button"
                    onClick={() => navigate('/host/MyEvents')}
                >
                    Back to My Events
                </button>
            </div>
        );
    }

    // Render an editable field
    const renderEditableField = (field, label, inputType = 'text', options = null) => {
        const value = event[field] || '';
        const editValue = editValues[field] || '';
        
        return (
            <section className="event-field-container">
                <div className="field-header">
                    <h3 id={`${field}-label`}>{label}</h3>
                    {!editMode[field] && (
                        <button 
                            className="edit-button" 
                            onClick={() => toggleEditMode(field)}
                            aria-label={`Edit ${label}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                    )}
                </div>
                
                {editMode[field] ? (
                    <div className="edit-field-container">
                        {inputType === 'textarea' ? (
                            <textarea
                                id={field}
                                value={editValue}
                                onChange={(e) => handleInputChange(field, e.target.value)}
                                rows="5"
                                aria-labelledby={`${field}-label`}
                                className="edit-textarea"
                            />
                        ) : inputType === 'select' ? (
                            <select
                                id={field}
                                value={editValue}
                                onChange={(e) => handleInputChange(field, e.target.value)}
                                aria-labelledby={`${field}-label`}
                                className="edit-select"
                            >
                                {options && options.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        ) : inputType === 'number' ? (
                            <input
                                type="number"
                                id={field}
                                value={editValue}
                                onChange={(e) => handleInputChange(field, e.target.value)}
                                min="1"
                                aria-labelledby={`${field}-label`}
                                className="edit-input"
                            />
                        ) : inputType === 'datetime-local' ? (
                            <input
                                type="datetime-local"
                                id={field}
                                value={formatDateForInput(editValue)}
                                onChange={(e) => handleInputChange(field, e.target.value)}
                                aria-labelledby={`${field}-label`}
                                className="edit-input"
                            />
                        ) : (
                            <input
                                type={inputType}
                                id={field}
                                value={editValue}
                                onChange={(e) => handleInputChange(field, e.target.value)}
                                aria-labelledby={`${field}-label`}
                                className="edit-input"
                            />
                        )}
                        
                        <div className="edit-actions">
                            <button 
                                onClick={() => saveField(field)}
                                className="save-button"
                                aria-label={`Save ${label}`}
                            >
                                Save
                            </button>
                            <button 
                                onClick={() => toggleEditMode(field)}
                                className="cancel-button"
                                aria-label={`Cancel editing ${label}`}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="field-value" aria-labelledby={`${field}-label`}>
                        {inputType === 'datetime-local' ? (
                            formatDate(value)
                        ) : inputType === 'textarea' ? (
                            <p className="multiline-text">{value}</p>
                        ) : (
                            <p>{value}</p>
                        )}
                    </div>
                )}
            </section>
        );
    };

    return (
        <HostLayout>
        <main className="host-event-details-container">
            {notification.show && (
                <NotificationPopup 
                    message={notification.message} 
                    type={notification.type} 
                    onClose={closeNotification} 
                />
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
                <h1 className="page-title">Manage Event Details</h1>
            </header>
            
            <article className="event-details-content">
                {renderEditableField('event_name', 'Event Name')}
                {renderEditableField('location', 'Location')}
                {renderEditableField('status', 'Status', 'select', ['Draft', 'Upcoming', 'In Progress', 'Completed', 'Cancelled'])}
                {renderEditableField('start_time', 'Start Time', 'datetime-local')}
                {renderEditableField('end_time', 'End Time', 'datetime-local')}
                {renderEditableField('required_volunteers', 'Required Volunteers', 'number')}
                {renderEditableField('overview', 'Overview', 'textarea')}
                {renderEditableField('description', 'Description', 'textarea')}
                
                <section className="event-stats">
                    <h2>Event Statistics</h2>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>Enrolled Volunteers</h3>
                            <p className="stat-value">{event.volunteer_enrolled?.length || 0}</p>
                        </div>
                        <div className="stat-card">
                            <h3>Completion Percentage</h3>
                            <p className="stat-value">{event.completion_percentage || '0'}%</p>
                        </div>
                        <div className="stat-card">
                            <h3>Tasks</h3>
                            <p className="stat-value">{event.task_count || 0}</p>
                        </div>
                    </div>
                </section>
                
                <section className="event-actions">
                    <h2>Event Management</h2>
                    <div className="action-buttons">
                        <button 
                            className="manage-tasks-button"
                            onClick={() => navigate(`/host/MyEvents/${eventId}/tasks`)}
                            aria-label="Manage tasks for this event"
                        >
                            Manage Tasks
                        </button>
                        <button 
                            className="manage-volunteers-button"
                            onClick={() => navigate(`/host/MyEvents/${eventId}/volunteers`)}
                            aria-label="Manage volunteers for this event"
                        >
                            Manage Volunteers
                        </button>
                        <button 
                            className="view-feedback-button"
                            onClick={() => navigate(`/host/MyEvents/${eventId}/feedback`)}
                            aria-label="View feedback for this event"
                        >
                            View Feedback
                        </button>
                    </div>
                </section>
            </article>
        </main>
        </HostLayout>
    );
};

export default HostEventDetails;