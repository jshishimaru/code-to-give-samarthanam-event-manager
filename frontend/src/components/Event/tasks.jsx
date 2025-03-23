import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTasksForEvent, getVolunteerTasks } from '../../apiservice/task';
import { checkAuth } from '../../apiservice/auth';
import TaskDetail from './taskdetail';
import '../../styles/Event/tasks.css';

const Tasks = ({ eventId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { taskId: urlTaskId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(urlTaskId || null);
  const [showTasksList, setShowTasksList] = useState(!urlTaskId);
  
  // Fetch current user info
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const response = await checkAuth();
        if (response.success && response.data.authenticated) {
          setCurrentUser({
            id: response.data.user.id,
            name: response.data.user.name || response.data.user.username,
            email: response.data.user.email,
            isHost: response.data.user.is_event_host || false
          });
        } else {
          setError(t('tasks.errors.auth'));
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
        setError(t('tasks.errors.auth'));
      }
    };

    getUserInfo();
  }, [t]);

  // Fetch tasks when user info is available
  useEffect(() => {
    const fetchTasks = async () => {
      if (!currentUser || !eventId) return;
      
      try {
        setLoading(true);
        
        let response;
        
        if (currentUser.isHost) {
          // If user is a host, get all tasks for the event
          response = await getTasksForEvent(eventId);
        } else {
          // If user is a volunteer, get only their assigned tasks
          response = await getVolunteerTasks(currentUser.id, eventId);
        }
        
        if (response.success) {
          // Check different possible response structures
          let tasksList = [];
          
          if (response.data.status === 'success' && Array.isArray(response.data.tasks)) {
            // Format for GetEventTasksView and GetVolunteerTasksView
            tasksList = response.data.tasks;
          } else if (response.data.status === 'success' && typeof response.data.tasks === 'object') {
            // Alternative format
            tasksList = response.data.tasks;
          } else if (Array.isArray(response.data.data?.tasks)) {
            // Format if API response is wrapped in data object
            tasksList = response.data.data.tasks;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // Another possible format
            tasksList = response.data.data;
          } else {
            console.warn('Unexpected API response format:', response.data);
            tasksList = [];
          }
          
          // Process the tasks to normalize field names
          const normalizedTasks = tasksList.map(task => ({
            id: task.id,
            title: task.task_name || task.title,
            description: task.description,
            status: task.status,
            event_id: task.event || task.event_id,
            event_name: task.event_name,
            due_date: task.end_time || task.due_date,
            is_host: task.is_host || false,
            created_at: task.created_at || task.timestamp,
            // Handle different ways volunteers might be represented
            volunteer_ids: Array.isArray(task.volunteers) 
              ? task.volunteers.map(v => typeof v === 'object' ? v.id : v)
              : (task.volunteer_ids || [])
          }));
          
          // If using volunteer endpoints, filter by event ID if needed
          const filteredTasks = currentUser.isHost 
            ? normalizedTasks 
            : normalizedTasks.filter(task => {
                // Check both possible event ID fields and handle string/number comparison
                const taskEventId = String(task.event_id);
                const currentEventId = String(eventId);
                return taskEventId === currentEventId;
              });
          
          setTasks(filteredTasks);
          setError(null);
          
          // If a task ID is in the URL but not loaded yet, select it
          if (urlTaskId && !selectedTaskId) {
            setSelectedTaskId(urlTaskId);
            setShowTasksList(false);
          }
        } else {
          setError(response.error || t('tasks.errors.fetchFailed'));
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError(t('tasks.errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [currentUser, eventId, t, urlTaskId, selectedTaskId]);

  // Handle task click
  const handleTaskClick = (taskId) => {
    setSelectedTaskId(taskId);
    setShowTasksList(false);
    
    // Update URL without full page navigation
    const newUrl = `/events/${eventId}?task=${taskId}`;
    window.history.pushState({ taskId }, "", newUrl);
  };
  
  // Handle back to task list
  const handleBackToTasks = () => {
    setSelectedTaskId(null);
    setShowTasksList(true);
    
    // Update URL to remove task parameter
    const newUrl = `/events/${eventId}`;
    window.history.pushState({}, "", newUrl);
  };

  // Get status label and class based on task status
  const getStatusInfo = (status) => {
    if (!status) return { 
      label: t('tasks.status.unknown'),
      className: 'status-unknown'
    };
    
    // Normalize status to lowercase for case-insensitive comparison
    const normalizedStatus = String(status).toLowerCase();
    
    if (normalizedStatus.includes('pending')) {
      return { 
        label: t('tasks.status.pending'),
        className: 'status-pending'
      };
    } else if (normalizedStatus.includes('progress') || normalizedStatus.includes('in_progress')) {
      return { 
        label: t('tasks.status.inProgress'),
        className: 'status-in-progress'
      };
    } else if (normalizedStatus.includes('complete')) {
      return { 
        label: t('tasks.status.completed'),
        className: 'status-completed'
      };
    } else if (normalizedStatus.includes('notification') || normalizedStatus.includes('notify')) {
      return { 
        label: t('tasks.status.notificationSent'),
        className: 'status-notification-sent'
      };
    } else {
      return { 
        label: status,
        className: 'status-unknown'
      };
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return t('tasks.noDate');
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  };

  // If showing task detail instead of list
  if (!showTasksList && selectedTaskId) {
    return (
      <TaskDetail 
        taskId={selectedTaskId} 
        eventId={eventId} 
        onBack={handleBackToTasks} 
      />
    );
  }

  if (loading) {
    return (
      <div className="tasks-loading" aria-live="polite">
        <div className="loading-spinner"></div>
        <p>{t('tasks.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tasks-error" role="alert">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>{error}</p>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="tasks-empty">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <p>{currentUser?.isHost 
          ? t('tasks.noTasksHost') 
          : t('tasks.noTasksVolunteer')}
        </p>
      </div>
    );
  }

  return (
    <div className="tasks-container">
      <header className="tasks-header">
        <h2 className="tasks-title">{t('tasks.title')}</h2>
        {currentUser?.isHost && (
          <button 
            className="add-task-button"
            onClick={() => navigate(`/events/${eventId}/tasks/add`)}
            aria-label={t('tasks.addTask.ariaLabel')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            {t('tasks.addTask.label')}
          </button>
        )}
      </header>

      <ul className="tasks-list" aria-label={t('tasks.listAriaLabel')}>
        {tasks.map(task => {
          const statusInfo = getStatusInfo(task.status);
          
          return (
            <li 
              key={task.id}
              className="task-item"
              onClick={() => handleTaskClick(task.id)}
              tabIndex="0"
              role="button"
              aria-label={t('tasks.viewDetails', { task: task.title })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleTaskClick(task.id);
                  e.preventDefault();
                }
              }}
            >
              <div className="task-content">
                <h3 className="task-title">{task.title}</h3>
                <div className="task-metadata">
                  <span className={`task-status ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                  <span className="task-dates">
                    {formatDate(task.due_date)}
                  </span>
                </div>
                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}
              </div>
              <div className="task-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Tasks;