import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getTaskVolunteers } from '../../../apiservice/volunteer';
import AvailableVolunteers from './availablevolunteers';
import '../../../styles/host/taskdetail/taskvolunteers.css';

/**
 * Component that displays volunteers assigned to a task and provides ability to add more
 * @param {Object} props Component props
 * @param {string|number} props.taskId ID of the task
 * @param {string|number} props.eventId ID of the event (for context)
 * @param {Function} props.onVolunteersChanged Callback for when volunteers are added/removed
 * @param {boolean} props.readOnly Whether the component should be in read-only mode
 */
const TaskVolunteers = ({ taskId, eventId, onVolunteersChanged, readOnly = false }) => {
  const { t } = useTranslation();
  
  // State
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddVolunteers, setShowAddVolunteers] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [eventName, setEventName] = useState('');
  
  // Fetch volunteers when component mounts or when taskId changes
  useEffect(() => {
    fetchVolunteers();
  }, [taskId]);
  
  // Fetch task volunteers data
  const fetchVolunteers = async () => {
    if (!taskId) {
      setError(t('taskVolunteers.errors.noTaskId'));
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await getTaskVolunteers(taskId);
      
      if (response.success) {
        setVolunteers(response.data.volunteers || []);
        setTaskName(response.data.taskName || '');
        setEventName(response.data.eventName || '');
      } else {
        setError(response.error || t('taskVolunteers.errors.fetchFailed'));
      }
    } catch (err) {
      console.error('Error fetching task volunteers:', err);
      setError(t('taskVolunteers.errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };
  
  // Handle volunteer added via AvailableVolunteers
  const handleVolunteersAdded = () => {
    fetchVolunteers();
    if (onVolunteersChanged) {
      onVolunteersChanged();
    }
  };
  
  return (
    <div className="task-volunteers-container">
      <div className="task-volunteers-header">
        <h2>
          {t('taskVolunteers.title')}
          <span className="volunteer-count">{volunteers.length}</span>
        </h2>
        
        {!readOnly && (
          <button 
            className="add-volunteer-button"
            onClick={() => setShowAddVolunteers(true)}
            aria-label={t('taskVolunteers.addVolunteer')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            {t('taskVolunteers.addVolunteer')}
          </button>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="task-volunteers-error" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <div className="task-volunteers-loading">
          <div className="spinner" role="status" aria-hidden="true"></div>
          <span>{t('taskVolunteers.loading')}</span>
        </div>
      )}
      
      {/* No volunteers message */}
      {!loading && !error && volunteers.length === 0 && (
        <div className="no-volunteers-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <p>{t('taskVolunteers.noVolunteers')}</p>
          {!readOnly && (
            <button 
              className="add-first-volunteer-button"
              onClick={() => setShowAddVolunteers(true)}
            >
              {t('taskVolunteers.addFirstVolunteer')}
            </button>
          )}
        </div>
      )}
      
      {/* Simplified Volunteers list - removed skills, location, contact info */}
      {!loading && !error && volunteers.length > 0 && (
        <ul className="volunteers-list simplified">
          {volunteers.map(volunteer => (
            <li key={volunteer.id} className="volunteer-item simplified">
              <div className="volunteer-avatar">
                {volunteer.name ? volunteer.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="volunteer-name-only">
                <span className="volunteer-name">{volunteer.name}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {/* Add volunteers modal */}
      {showAddVolunteers && (
        <div className="add-volunteers-overlay">
          <div className="add-volunteers-modal">
            <AvailableVolunteers 
              taskId={taskId} 
              eventId={eventId}
              taskName={taskName}
              eventName={eventName}
              onClose={() => setShowAddVolunteers(false)}
              onVolunteersAdded={handleVolunteersAdded}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskVolunteers;