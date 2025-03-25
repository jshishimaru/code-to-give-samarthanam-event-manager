import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getTaskWithSubtasks, markSubtaskComplete, deleteSubtask } from '../../../apiservice/task';
import SubtaskForm from './SubtaskForm';
import '../../../styles/host/taskdetail/SubtaskList.css';

/**
 * Component to display a list of subtasks for a given task
 * @param {Object} props 
 * @param {number} props.taskId - ID of the parent task
 * @param {Function} props.onSubtaskAdded - Optional callback when subtask is added
 * @param {Function} props.onSubtaskEdited - Optional callback when subtask is edited
 * @param {Function} props.onSubtaskStatusChange - Optional callback when subtask status changes
 * @param {boolean} props.readOnly - Optional flag to disable editing functionality
 */
const SubtaskList = ({ 
  taskId, 
  onSubtaskAdded, 
  onSubtaskEdited, 
  onSubtaskStatusChange,
  readOnly = false 
}) => {
  const { t } = useTranslation();
  
  // State
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [selectedSubtask, setSelectedSubtask] = useState(null);
  const [expandedNotifications, setExpandedNotifications] = useState([]);
  const [markingComplete, setMarkingComplete] = useState(null);
  const [deletingSubtask, setDeletingSubtask] = useState(null);
  const [taskInfo, setTaskInfo] = useState(null);

  // Fetch subtasks on component mount or when taskId changes
  useEffect(() => {
    fetchSubtasks();
  }, [taskId]);

  // Fetch subtasks from API
  const fetchSubtasks = async () => {
    if (!taskId) {
      setError(t('subtaskList.errors.noTaskId'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await getTaskWithSubtasks(taskId);
      
      if (response.success) {
        const taskData = response.data.task || {};
        let subtasksData = [];

        // Check different possible response structures for subtasks
        if (response.data.subtasks && Array.isArray(response.data.subtasks)) {
          subtasksData = response.data.subtasks;
        } else if (taskData.subtasks && Array.isArray(taskData.subtasks)) {
          subtasksData = taskData.subtasks;
        }

        setSubtasks(subtasksData);
        setTaskInfo(taskData);
      } else {
        setError(response.error || t('subtaskList.errors.fetchFailed'));
      }
    } catch (err) {
      console.error('Error fetching subtasks:', err);
      setError(t('subtaskList.errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting a subtask
  const handleDeleteSubtask = async (subtaskId) => {
    if (window.confirm(t('subtaskList.confirmDelete', { defaultValue: 'Are you sure you want to delete this subtask? This action cannot be undone.' }))) {
      try {
        setDeletingSubtask(subtaskId);
        setError(null);
        
        const response = await deleteSubtask(subtaskId);
        
        if (response.success) {
          // Refresh subtasks list
          fetchSubtasks();
          // Notify parent that a subtask was deleted
          if (onSubtaskEdited) {
            onSubtaskEdited();
          }
        } else {
          setError(response.error || t('subtaskList.errors.deleteFailed', { defaultValue: 'Failed to delete subtask' }));
        }
      } catch (err) {
        console.error('Error deleting subtask:', err);
        setError(t('subtaskList.errors.deleteFailed', { defaultValue: 'Failed to delete subtask' }));
      } finally {
        setDeletingSubtask(null);
      }
    }
  };

  // Handle adding a new subtask
  const handleAddSubtask = () => {
    setFormMode('create');
    setSelectedSubtask(null);
    setShowForm(true);
  };

  // Handle editing a subtask
  const handleEditSubtask = (subtask) => {
    setFormMode('edit');
    setSelectedSubtask(subtask);
    setShowForm(true);
  };

  // Handle form submission success
  const handleFormSuccess = () => {
    setShowForm(false);
    fetchSubtasks();
    
    if (formMode === 'create' && onSubtaskAdded) {
      onSubtaskAdded();
    } else if (formMode === 'edit' && onSubtaskEdited) {
      onSubtaskEdited();
    }
  };

  // Handle form cancellation
  const handleFormCancel = () => {
    setShowForm(false);
  };

  // Toggle notification expansion
  const toggleNotification = (subtaskId) => {
    if (expandedNotifications.includes(subtaskId)) {
      setExpandedNotifications(expandedNotifications.filter(id => id !== subtaskId));
    } else {
      setExpandedNotifications([...expandedNotifications, subtaskId]);
    }
  };

  // Mark subtask as complete
  const handleMarkComplete = async (subtaskId) => {
    if (readOnly) return;
    
    try {
      setMarkingComplete(subtaskId);
      
      const response = await markSubtaskComplete(subtaskId);
      
      if (response.success) {
        fetchSubtasks();
        
        if (onSubtaskStatusChange) {
          onSubtaskStatusChange(subtaskId, 'Completed');
        }
      } else {
        setError(response.error || t('subtaskList.errors.markCompleteFailed', { defaultValue: 'Failed to mark subtask as complete' }));
      }
    } catch (err) {
      console.error('Error marking subtask as complete:', err);
      setError(t('subtaskList.errors.markCompleteFailed', { defaultValue: 'Failed to mark subtask as complete' }));
    } finally {
      setMarkingComplete(null);
    }
  };

  // Get status badge class based on status
  const getStatusBadgeClass = (status) => {
    if (!status) return 'status-badge status-pending';
    
    switch (status) {
      case 'Completed':
        return 'status-badge status-completed';
      case 'In Progress':
        return 'status-badge status-in-progress';
      case 'Delayed':
        return 'status-badge status-delayed';
      case 'Cancelled':
        return 'status-badge status-cancelled';
      case 'Pending':
      default:
        return 'status-badge status-pending';
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return ''; // Invalid date
      
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return '';
    }
  };

  // Render subtask items
  const renderSubtasks = () => {
    if (subtasks.length === 0) {
      return (
        <div className="no-subtasks">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="9" x2="15" y2="9"></line>
            <line x1="9" y1="14" x2="15" y2="14"></line>
            <line x1="9" y1="19" x2="15" y2="19"></line>
          </svg>
          <p>{t('subtaskList.noSubtasks', { defaultValue: 'No subtasks have been added yet' })}</p>
        </div>
      );
    }

    return (
      <ul className="subtask-list">
        {subtasks.map(subtask => (
          <li key={subtask.id} className="subtask-item">
            <div className="subtask-header">
              <div className="subtask-title-wrapper">
                <h3 className="subtask-title">{subtask.title}</h3>
                <span className={getStatusBadgeClass(subtask.status)}>
                  {subtask.status || t('subtaskList.statusPending', { defaultValue: 'Pending' })}
                </span>
              </div>
              
              {!readOnly && (
                <div className="subtask-actions">
                  <button 
                    className="edit-button"
                    onClick={() => handleEditSubtask(subtask)}
                    aria-label={t('subtaskList.editSubtask', { defaultValue: 'Edit subtask' })}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  
                  {subtask.status !== 'Completed' && (
                    <button 
                      className={`complete-button ${markingComplete === subtask.id ? 'loading' : ''}`}
                      onClick={() => handleMarkComplete(subtask.id)}
                      disabled={markingComplete === subtask.id}
                      aria-label={t('subtaskList.markComplete', { defaultValue: 'Mark complete' })}
                    >
                      {markingComplete === subtask.id ? (
                        <span className="spinner"></span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                      )}
                    </button>
                  )}

                  <button 
                    className={`delete-subtask-button ${deletingSubtask === subtask.id ? 'loading' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSubtask(subtask.id);
                    }}
                    disabled={deletingSubtask === subtask.id}
                    aria-label={t('subtaskList.deleteSubtaskAriaLabel', { 
                      title: subtask.title,
                      defaultValue: `Delete subtask: ${subtask.title}`
                    })}
                  >
                    {deletingSubtask === subtask.id ? (
                      <span className="spinner"></span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>
            
            {subtask.description && (
              <div className="subtask-description">
                <p>{subtask.description}</p>
              </div>
            )}
            
            <div className="subtask-meta">
              {subtask.start_time && (
                <div className="subtask-date">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>{t('subtaskList.start', { defaultValue: 'Start' })}: {formatDate(subtask.start_time)}</span>
                </div>
              )}
              
              {subtask.end_time && (
                <div className="subtask-date">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>{t('subtaskList.due', { defaultValue: 'Due' })}: {formatDate(subtask.end_time)}</span>
                </div>
              )}
            </div>
            
            {subtask.completion_notified && (
              <div className="subtask-notification">
                <div 
                  className="notification-header"
                  onClick={() => toggleNotification(subtask.id)}
                  role="button"
                  tabIndex="0"
                  aria-expanded={expandedNotifications.includes(subtask.id)}
                >
                  <div className="notification-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <span className="notification-title">
                    {t('subtaskList.completionNotified', { 
                      time: formatDate(subtask.notification_time),
                      defaultValue: `Completion notified at ${formatDate(subtask.notification_time)}`
                    })}
                  </span>
                  <div className="notification-toggle">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points={expandedNotifications.includes(subtask.id) ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
                    </svg>
                  </div>
                </div>
                
                {expandedNotifications.includes(subtask.id) && subtask.notification_message && (
                  <div className="notification-message">
                    <p>{subtask.notification_message}</p>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="subtask-list-container">
      <div className="subtask-list-header">
        <h2 className="subtask-list-title">
          {t('subtaskList.title', { defaultValue: 'Subtasks' })}
          <span className="subtask-count">{subtasks.length}</span>
        </h2>
        
        {/* Only show add button for non-read-only mode */}
        {!readOnly && (
          <button 
            className="add-subtask-button"
            onClick={handleAddSubtask}
            aria-label={t('subtaskList.addSubtask', { defaultValue: 'Add Subtask' })}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            {t('subtaskList.addSubtask', { defaultValue: 'Add Subtask' })}
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="subtask-loading">
          <div className="spinner"></div>
          <p>{t('subtaskList.loading', { defaultValue: 'Loading subtasks...' })}</p>
        </div>
      ) : error ? (
        <div className="subtask-error">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={fetchSubtasks}
          >
            {t('subtaskList.retry', { defaultValue: 'Retry' })}
          </button>
        </div>
      ) : (
        renderSubtasks()
      )}
      
      {showForm && (
        <div className="subtask-form-overlay">
          <div className="subtask-form-modal">
            <SubtaskForm 
              taskId={taskId}
              mode={formMode}
              subtask={selectedSubtask}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              parentTaskInfo={taskInfo}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SubtaskList;