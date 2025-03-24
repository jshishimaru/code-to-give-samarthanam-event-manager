import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getTasksForEvent, assignVolunteersToTask } from '../../../apiservice/task';
import '../../../styles/host/volunteer/TaskWindow.css';

/**
 * A component for assigning tasks to a volunteer
 * 
 * @param {Object} props Component props
 * @param {string|number} props.eventId The ID of the event
 * @param {string|number} props.volunteerId The ID of the volunteer
 * @param {string} props.volunteerName The name of the volunteer
 * @param {Function} props.onClose Function to call when closing the window
 * @param {Function} props.onTaskAssigned Function to call after task assignment
 */
const TaskWindow = ({ 
  eventId, 
  volunteerId, 
  volunteerName, 
  onClose, 
  onTaskAssigned 
}) => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch tasks for the event
  useEffect(() => {
    const fetchTasks = async () => {
      if (!eventId) {
        setError(t('taskWindow.errors.noEventId'));
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await getTasksForEvent(eventId);
        
        if (response.success) {
          // Convert to array if it's not already
          const tasksArray = Array.isArray(response.data.tasks) 
            ? response.data.tasks 
            : (response.data.tasks ? Object.values(response.data.tasks) : []);
            
          setTasks(tasksArray);
        } else {
          setError(response.error || t('taskWindow.errors.fetchFailed'));
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError(t('taskWindow.errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, [eventId, t]);
  
  // Handle task selection
  const handleTaskSelect = (taskId) => {
    setSelectedTaskId(taskId === selectedTaskId ? null : taskId);
  };
  
  // Handle assigning the selected task to the volunteer
  const handleAssignTask = async () => {
    if (!selectedTaskId) {
      return;
    }
    
    try {
      setIsAssigning(true);
      setError(null);
      
      const response = await assignVolunteersToTask(selectedTaskId, [volunteerId], false);
      
      if (response.success) {
        setAssignmentSuccess(true);
        setTimeout(() => {
          if (onTaskAssigned) {
            onTaskAssigned();
          }
        }, 1500);
      } else {
        setError(response.error || t('taskWindow.errors.assignFailed'));
      }
    } catch (err) {
      console.error('Error assigning task:', err);
      setError(t('taskWindow.errors.assignFailed'));
    } finally {
      setIsAssigning(false);
    }
  };
  
  // Filter tasks based on search query
  const filteredTasks = tasks.filter(task => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      task.task_name.toLowerCase().includes(query) ||
      (task.description && task.description.toLowerCase().includes(query))
    );
  });
  
  // Helper to determine task status
  const getTaskStatus = (task) => {
    if (task.completed) {
      return 'completed';
    } else if (task.notified_completion) {
      return 'notified';
    } else if (task.in_progress) {
      return 'in-progress';
    } else {
      return 'open';
    }
  };
  
  return (
    <div className="task-window">
      <div className="task-window-header">
        <h2>
          {t('taskWindow.assignTaskTo', { name: volunteerName })}
        </h2>
        <button 
          className="close-window-btn"
          onClick={onClose}
          aria-label={t('common.close')}
        >
          ×
        </button>
      </div>
      
      {/* Search tasks */}
      <div className="task-search">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('taskWindow.searchTasksPlaceholder')}
          className="task-search-input"
        />
      </div>
      
      {/* Error message */}
      {error && (
        <div className="task-window-error" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* Success message */}
      {assignmentSuccess && (
        <div className="task-window-success" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>{t('taskWindow.assignSuccess')}</span>
        </div>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <div className="task-window-loading">
          <div className="loading-spinner" role="status"></div>
          <span>{t('taskWindow.loading')}</span>
        </div>
      )}
      
      {/* No tasks message */}
      {!loading && !error && filteredTasks.length === 0 && (
        <div className="no-tasks-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <p>
            {searchQuery 
              ? t('taskWindow.noSearchResults', { query: searchQuery })
              : t('taskWindow.noTasks')}
          </p>
        </div>
      )}
      
      {/* Task list */}
      {!loading && !error && filteredTasks.length > 0 && (
        <div className="task-list">
          {filteredTasks.map(task => (
            <div 
              key={task.id || task.task_id} 
              className={`task-item ${getTaskStatus(task)} ${selectedTaskId === (task.id || task.task_id) ? 'selected' : ''}`}
              onClick={() => handleTaskSelect(task.id || task.task_id)}
            >
              <div className="task-item-header">
                <h3 className="task-name">{task.task_name || task.name}</h3>
                <div className={`task-status ${getTaskStatus(task)}`}>
                  {t(`taskWindow.status.${getTaskStatus(task)}`)}
                </div>
              </div>
              
              {task.description && (
                <p className="task-description">{task.description}</p>
              )}
              
              {task.assigned_volunteers && (
                <div className="task-volunteers">
                  <span className="volunteers-count">
                    {t('taskWindow.assignedVolunteersCount', { count: task.assigned_volunteers.length })}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Action button */}
      <div className="task-window-actions">
        <button 
          className="assign-button"
          disabled={!selectedTaskId || isAssigning || assignmentSuccess}
          onClick={handleAssignTask}
        >
          {isAssigning ? (
            <>
              <span className="button-spinner"></span>
              {t('taskWindow.assigning')}
            </>
          ) : (
            t('taskWindow.assignTask')
          )}
        </button>
      </div>
    </div>
  );
};

export default TaskWindow;