import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  getTaskWithSubtasks, 
  notifyTaskCompletion, 
  notifySubtaskCompletion 
} from '../../apiservice/task';
import { checkAuth } from '../../apiservice/auth';
import '../../styles/Event/taskdetail.css';
import TaskChat from './TaskChat';


const TaskDetail = ({ taskId, eventId, onBack }) => {
  const { t } = useTranslation();
  // Use props first, then URL params as fallback
  const params = useParams();
  const urlTaskId = params?.taskId;
  const urlEventId = params?.eventId;
  
  // Use props if available, otherwise use URL params
  const effectiveTaskId = taskId || urlTaskId;
  const effectiveEventId = eventId || urlEventId;
  
  const navigate = useNavigate();
  
  const [task, setTask] = useState(null);
  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [completionProgress, setCompletionProgress] = useState(0);
  const [notifying, setNotifying] = useState({ taskId: null, type: null });
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

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
          setError(t('taskDetail.errors.auth'));
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
        setError(t('taskDetail.errors.auth'));
      }
    };

    getUserInfo();
  }, [t]);

  // Fetch task and subtasks
  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (!effectiveTaskId || !currentUser) return;
      
      try {
        setLoading(true);
        const response = await getTaskWithSubtasks(effectiveTaskId);
        
        if (response.success && response.data.status === 'success') {
          // Get task data
          const taskData = response.data.task;
          
          // Normalize task fields
          const normalizedTask = {
            id: taskData.id,
            title: taskData.task_name || taskData.title,
            description: taskData.description,
            status: taskData.status,
            event_id: taskData.event,
            event_name: taskData.event_name,
            start_date: taskData.start_time,
            due_date: taskData.end_time,
            created_at: taskData.created_at,
            volunteers: taskData.volunteers || [],
            completion_notified: taskData.completion_notified || false,
            notification_message: taskData.notification_message || '',
            notification_time: taskData.notification_time || null
          };
          
          // Get and normalize subtasks
          let subtasksData = [];
          if (taskData.subtasks && Array.isArray(taskData.subtasks)) {
            subtasksData = taskData.subtasks.map(subtask => ({
              id: subtask.id,
              title: subtask.title,
              description: subtask.description,
              status: subtask.status,
              start_date: subtask.start_time,
              due_date: subtask.end_time,
              created_at: subtask.created_at,
              completion_notified: subtask.completion_notified || false,
              notification_message: subtask.notification_message || '',
              notification_time: subtask.notification_time || null
            }));
          }
          
          // Calculate completion progress
          const totalTasks = subtasksData.length + 1; // Including main task
          const completedTasks = subtasksData.filter(st => 
            st.status.toLowerCase().includes('complet')
          ).length + (normalizedTask.status.toLowerCase().includes('complet') ? 1 : 0);
          
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          
          setTask(normalizedTask);
          setSubtasks(subtasksData);
          setCompletionProgress(progress);
          setError(null);
        } else {
          console.error('Failed to fetch task details:', response);
          setError(response.error || t('taskDetail.errors.fetchFailed'));
        }
      } catch (err) {
        console.error('Error fetching task details:', err);
        setError(t('taskDetail.errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [effectiveTaskId, currentUser, t]);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });
    
    // Automatically hide notification after 5 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Handle notify task completion
  const handleNotifyCompletion = async (id, isSubtask = false) => {
    try {
      setNotifying({ taskId: id, type: isSubtask ? 'subtask' : 'task' });
      
      const response = isSubtask 
        ? await notifySubtaskCompletion(id)
        : await notifyTaskCompletion(id);
      
      if (response.success && response.data.status === 'success') {
        showNotification(t('taskDetail.notifications.completed'));
        
        // Update state
        if (isSubtask) {
          setSubtasks(prev => prev.map(st => 
            st.id === id 
              ? { ...st, completion_notified: true, notification_time: new Date().toISOString() }
              : st
          ));
        } else {
          setTask(prev => prev && prev.id === id 
            ? { ...prev, completion_notified: true, notification_time: new Date().toISOString() }
            : prev
          );
        }
        
        // Recalculate completion progress
        const totalTasks = subtasks.length + 1;
        const completedTasks = subtasks.filter(st => 
          st.completion_notified || st.status.toLowerCase().includes('complet')
        ).length + (task.completion_notified || task.status.toLowerCase().includes('complet') ? 1 : 0);
        
        setCompletionProgress(totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);
      } else {
        showNotification(response.error || t('taskDetail.errors.notificationFailed'), 'error');
      }
    } catch (err) {
      console.error('Error notifying completion:', err);
      showNotification(t('taskDetail.errors.notificationFailed'), 'error');
    } finally {
      setNotifying({ taskId: null, type: null });
    }
  };

  // Handle back button click based on whether we're in embedded or standalone mode
  const handleBackClick = () => {
    if (onBack) {
      // We're embedded in the Tasks component, so call the provided callback
      onBack();
    } else {
      // We're standalone, so navigate back to the event page
      navigate(`/events/${effectiveEventId}`);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return t('taskDetail.noDate');
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  };

  // Get status badge class and label
  const getStatusInfo = (status) => {
    if (!status) return { 
      label: t('taskDetail.status.unknown'),
      className: 'status-unknown'
    };
    
    const normalizedStatus = String(status).toLowerCase();
    
    if (normalizedStatus.includes('pending')) {
      return { 
        label: t('taskDetail.status.pending'),
        className: 'status-pending'
      };
    } else if (normalizedStatus.includes('progress') || normalizedStatus.includes('in_progress')) {
      return { 
        label: t('taskDetail.status.inProgress'),
        className: 'status-in-progress'
      };
    } else if (normalizedStatus.includes('complete')) {
      return { 
        label: t('taskDetail.status.completed'),
        className: 'status-completed'
      };
    } else if (normalizedStatus.includes('notification') || normalizedStatus.includes('notify')) {
      return { 
        label: t('taskDetail.status.notificationSent'),
        className: 'status-notification-sent'
      };
    } else {
      return { 
        label: status,
        className: 'status-unknown'
      };
    }
  };

  // Check if user is assigned to the task
  const isUserAssigned = () => {
    if (!task || !currentUser) return false;
    
    // Check if user is in volunteers array
    return task.volunteers.some(volunteer => {
      // Handle both object and ID formats
      if (typeof volunteer === 'object') {
        return volunteer.id === currentUser.id;
      }
      return volunteer === currentUser.id;
    });
  };

  if (loading) {
    return (
      <div className="task-detail-loading" aria-live="polite">
        <div className="loading-spinner"></div>
        <p>{t('taskDetail.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="task-detail-error" role="alert">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>{error}</p>
        <button 
          className="back-button"
          onClick={handleBackClick}
          aria-label={t('taskDetail.backToEvent')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          {t('taskDetail.backToTasks')}
        </button>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-detail-error" role="alert">
        <p>{t('taskDetail.errors.notFound')}</p>
        <button 
          className="back-button"
          onClick={handleBackClick}
          aria-label={t('taskDetail.backToEvent')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          {t('taskDetail.backToTasks')}
        </button>
      </div>
    );
  }

  // Get status info for main task
  const taskStatusInfo = getStatusInfo(task.status);
  const canNotifyCompletion = isUserAssigned() && !task.completion_notified && 
                             !task.status.toLowerCase().includes('complet');
  const hasSubtasks = subtasks && subtasks.length > 0;

  return (
    <div className="task-detail-container">
      {notification.show && (
        <div className={`task-notification ${notification.type}`} role="alert">
          <span>{notification.message}</span>
          <button 
            className="close-notification"
            onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            aria-label={t('taskDetail.closeNotification')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}
      
      <header className="task-detail-header">
        <button 
          className="back-button"
          onClick={handleBackClick}
          aria-label={t('taskDetail.backToTasks')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          {t('taskDetail.backToTasks')}
        </button>
      </header>

      <div className="task-detail-content">
        <main className="task-detail-main">
          <div className="task-progress-container">
            <div className="task-progress-info">
              <span className="progress-label">{t('taskDetail.progress')}</span>
              <span className="progress-percentage">{completionProgress}%</span>
            </div>
            <div className="task-progress-bar">
              <div 
                className="task-progress-bar-fill" 
                style={{ width: `${completionProgress}%` }}
                aria-valuenow={completionProgress}
                aria-valuemin="0"
                aria-valuemax="100"
                role="progressbar"
                aria-label={t('taskDetail.completionProgress', { percentage: completionProgress })}
              ></div>
            </div>
          </div>

          <div className="task-main-info">
            <h1 className="task-title">{task.title}</h1>
            
            <div className="task-metadata">
              <span className={`task-status ${taskStatusInfo.className}`}>
                {taskStatusInfo.label}
              </span>

              <div className="task-dates">
                {task.start_date && (
                  <span className="task-start-date">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    {t('taskDetail.startDate')}: {formatDate(task.start_date)}
                  </span>
                )}
                
                {task.due_date && (
                  <span className="task-due-date">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {t('taskDetail.dueDate')}: {formatDate(task.due_date)}
                  </span>
                )}
              </div>
            </div>

            {/* Rest of the component remains the same */}
            {/* ... */}
            
            {/* Add all the remaining code from the existing Task Detail component */}
            {task.description && (
              <div className="task-description">
                <h2>{t('taskDetail.description')}</h2>
                <p>{task.description}</p>
              </div>
            )}

            {task.volunteers && task.volunteers.length > 0 && (
              <div className="task-assigned-volunteers">
                <h2>{t('taskDetail.assignedVolunteers')}</h2>
                <ul className="volunteers-list">
                  {task.volunteers.map((volunteer, index) => {
                    // Handle both object and ID formats
                    const volunteerId = typeof volunteer === 'object' ? volunteer.id : volunteer;
                    const volunteerName = typeof volunteer === 'object' ? volunteer.name : `Volunteer ${volunteerId}`;
                    
                    return (
                      <li key={volunteerId || index} className="volunteer-item">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span>{volunteerName}</span>
                        {currentUser && volunteerId === currentUser.id && (
                          <span className="current-user-badge">{t('taskDetail.you')}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {canNotifyCompletion && (
              <div className="task-actions">
                <button 
                  className={`notify-completion-button ${notifying.taskId === task.id ? 'notifying' : ''}`}
                  onClick={() => handleNotifyCompletion(task.id, false)}
                  disabled={notifying.taskId === task.id}
                  aria-busy={notifying.taskId === task.id}
                >
                  {notifying.taskId === task.id ? (
                    <>
                      <div className="button-spinner"></div>
                      {t('taskDetail.notifying')}
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      {t('taskDetail.notifyCompletion')}
                    </>
                  )}
                </button>
              </div>
            )}

            {task.completion_notified && (
              <div className="task-notification-info">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>
                  {t('taskDetail.completionNotified', { 
                    time: formatDate(task.notification_time) 
                  })}
                </span>
              </div>
            )}

            {hasSubtasks && (
              <div className="task-subtasks">
                <h2>{t('taskDetail.subtasks')}</h2>
                <ul className="subtasks-list">
                  {subtasks.map(subtask => {
                    const subtaskStatusInfo = getStatusInfo(subtask.status);
                    const canNotifySubtaskCompletion = isUserAssigned() && 
                                                      !subtask.completion_notified && 
                                                      !subtask.status.toLowerCase().includes('complet');
                    
                    return (
                      <li key={subtask.id} className="subtask-item">
                        <div className="subtask-header">
                          <h3 className="subtask-title">{subtask.title}</h3>
                          <span className={`subtask-status ${subtaskStatusInfo.className}`}>
                            {subtaskStatusInfo.label}
                          </span>
                        </div>
                        
                        {subtask.description && (
                          <p className="subtask-description">{subtask.description}</p>
                        )}
                        
                        <div className="subtask-metadata">
                          {subtask.due_date && (
                            <span className="subtask-due-date">
                              {t('taskDetail.dueDate')}: {formatDate(subtask.due_date)}
                            </span>
                          )}
                        </div>
                        
                        {canNotifySubtaskCompletion && (
                          <div className="subtask-actions">
                            <button 
                              className={`notify-completion-button ${notifying.taskId === subtask.id ? 'notifying' : ''}`}
                              onClick={() => handleNotifyCompletion(subtask.id, true)}
                              disabled={notifying.taskId === subtask.id}
                              aria-busy={notifying.taskId === subtask.id}
                            >
                              {notifying.taskId === subtask.id ? (
                                <>
                                  <div className="button-spinner"></div>
                                  {t('taskDetail.notifying')}
                                </>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                  </svg>
                                  {t('taskDetail.notifyCompletion')}
                                </>
                              )}
                            </button>
                          </div>
                        )}
                        
                        {subtask.completion_notified && (
                          <div className="subtask-notification-info">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <span>
                              {t('taskDetail.completionNotified', { 
                                time: formatDate(subtask.notification_time) 
                              })}
                            </span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </main>

        <aside className="task-chat-container">
          <TaskChat taskId={effectiveTaskId} eventId={effectiveEventId} />
        </aside>
      </div>
    </div>
  );
};

export default TaskDetail;