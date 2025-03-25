import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTaskWithSubtasks, notifyTaskCompletion, markTaskComplete } from '../../../apiservice/task';
import { checkAuth } from '../../../apiservice/auth';
import SubtaskList from './subtasklist';
import TaskChat from './taskchat';
import '../../../styles/host/taskdetail/taskdetail.css';
import TaskVolunteers from './taskvolunteers';
/**
 * TaskDetail component displays detailed information about a task,
 * including subtasks, required skills, and a task chat feature.
 * 
 * @param {Object} props Component props
 * @param {number} props.taskId - ID of the task (optional if provided in URL)
 * @param {number} props.eventId - ID of the event (optional if provided in URL)
 * @param {Function} props.onBack - Callback function when back button is clicked
 */
const TaskDetail = ({ taskId: propTaskId, eventId: propEventId, onBack }) => {
  const { t } = useTranslation();
  
  // Use props first, then URL params as fallback
  const params = useParams();
  const urlTaskId = params?.taskId;
  const urlEventId = params?.eventId;
  
  // Use props if available, otherwise use URL params
  const effectiveTaskId = propTaskId || urlTaskId;
  const effectiveEventId = propEventId || urlEventId;
  
  const navigate = useNavigate();
  
  // State
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [completionProgress, setCompletionProgress] = useState(0);
  const [notifying, setNotifying] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  
  // Handle back button click
  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (effectiveEventId) {
      navigate(`/host/events/${effectiveEventId}/tasks`);
    } else {
      navigate(-1);
    }
  };

  // Fetch current user info on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const authResponse = await checkAuth();
        if (authResponse.success && authResponse.data.authenticated) {
          setCurrentUser(authResponse.data.user);
        }
      } catch (err) {
        console.error('Error getting current user:', err);
      }
    };
    
    getCurrentUser();
  }, []);
  
  // Fetch task data
  useEffect(() => {
    const fetchTaskData = async () => {
      if (!effectiveTaskId) {
        setError(t('taskDetail.errors.missingTaskId'));
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await getTaskWithSubtasks(effectiveTaskId);
        
        if (response.success) {
          const taskData = response.data.task || {};
          setTask(taskData);
          
          // Calculate completion progress
          if (taskData.subtasks && taskData.subtasks.length > 0) {
            const completedSubtasks = taskData.subtasks.filter(
              subtask => subtask.status === 'Completed'
            ).length;
            const progress = Math.round(
              (completedSubtasks / taskData.subtasks.length) * 100
            );
            setCompletionProgress(progress);
          } else {
            setCompletionProgress(taskData.status === 'Completed' ? 100 : 0);
          }
        } else {
          setError(response.error || t('taskDetail.errors.fetchFailed'));
        }
      } catch (err) {
        console.error('Error fetching task details:', err);
        setError(t('taskDetail.errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchTaskData();
  }, [effectiveTaskId, t]);

  // Handle task completion notification
  const handleNotifyCompletion = async () => {
	if (notifying) return;
	
	try {
	  setNotifying(true);
	  
	  const response = await notifyTaskCompletion(
		effectiveTaskId,
		t('taskDetail.defaultCompletionMessage')
	  );
	  
	  if (response.success) {
		setNotification({
		  show: true,
		  message: t('taskDetail.completionNotificationSent'),
		  type: 'success'
		});
		
		// Refresh task data
		const taskResponse = await getTaskWithSubtasks(effectiveTaskId);
		if (taskResponse.success) {
		  setTask(taskResponse.data.task);
		}
		
		// Wait a bit before going back to list to show success message
		setTimeout(() => {
		  if (onBack) onBack();
		}, 1500);
	  } else {
		setNotification({
		  show: true,
		  message: response.error || t('taskDetail.errors.notificationFailed'),
		  type: 'error'
		});
	  }
	} catch (err) {
	  console.error('Error notifying completion:', err);
	  setNotification({
		show: true,
		message: t('taskDetail.errors.notificationFailed'),
		type: 'error'
	  });
	} finally {
	  setNotifying(false);
	}
  };

  // Handle marking task as complete (host action)
  const handleMarkComplete = async () => {
	if (notifying) return;
	
	try {
	  setNotifying(true);
	  
	  const response = await markTaskComplete(effectiveTaskId);
	  
	  if (response.success) {
		setNotification({
		  show: true,
		  message: t('taskDetail.taskMarkedComplete'),
		  type: 'success'
		});
		
		// Refresh task data
		const taskResponse = await getTaskWithSubtasks(effectiveTaskId);
		if (taskResponse.success) {
		  setTask(taskResponse.data.task);
		  setCompletionProgress(100);
		}
		
		// Wait a bit before going back to list to show success message
		setTimeout(() => {
		  if (onBack) onBack();
		}, 1500);
	  } else {
		setNotification({
		  show: true,
		  message: response.error || t('taskDetail.errors.markCompleteFailed'),
		  type: 'error'
		});
	  }
	} catch (err) {
	  console.error('Error marking task complete:', err);
	  setNotification({
		show: true,
		message: t('taskDetail.errors.markCompleteFailed'),
		type: 'error'
	  });
	} finally {
	  setNotifying(false);
	}
  };
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if the current user is a host
// Update the isHost function to handle all possible host indicators
const isHost = () => {
	console.log('Current user in isHost check:', currentUser);
	return currentUser && (
	  currentUser.is_host === true || 
	  currentUser.is_event_host === true || 
	  currentUser.host === true ||
	  currentUser.role === 'host' ||
	  currentUser.isHost === true
	);
  };

  // Get task status with appropriate classes
  const getTaskStatusInfo = () => {
    if (!task) return { label: '', className: '' };
    
    switch (task.status) {
      case 'Completed':
        return { 
          label: t('taskDetail.status.completed'), 
          className: 'status-completed' 
        };
      case 'In Progress':
        return { 
          label: t('taskDetail.status.inProgress'), 
          className: 'status-in-progress' 
        };
      case 'Cancelled':
        return { 
          label: t('taskDetail.status.cancelled'), 
          className: 'status-cancelled' 
        };
      case 'Delayed':
        return { 
          label: t('taskDetail.status.delayed'), 
          className: 'status-delayed' 
        };
      case 'Pending':
      default:
        return { 
          label: t('taskDetail.status.pending'), 
          className: 'status-pending' 
        };
    }
  };

  // Check if the user can notify task completion
  const canNotifyCompletion = () => {
    return (
      task && 
      !task.completion_notified && 
      task.status !== 'Completed' && 
      !isHost()
    );
  };

  // Check if the user can mark task as complete
  const canMarkComplete = () => {
    return (
      task && 
      task.status !== 'Completed' && 
      isHost()
    );
  };

  // Render loading state
  if (loading) {
    return (
      <div className="task-detail-loading">
        <div className="spinner"></div>
        <p>{t('taskDetail.loading')}</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="task-detail-error">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>{error}</p>
        <button 
          className="back-button"
          onClick={handleBackClick}
          aria-label={t('taskDetail.backToTasks')}
        >
          {t('taskDetail.backToTasks')}
        </button>
      </div>
    );
  }

  const getRequiredSkills = () => {
	if (!task || !task.required_skills) return [];
	
	// If required_skills is already an array, use it directly
	if (Array.isArray(task.required_skills)) {
	  return task.required_skills;
	}
	
	// If it's a string (comma-separated), split it into an array
	if (typeof task.required_skills === 'string') {
	  return task.required_skills.split(',').map(skill => skill.trim()).filter(skill => skill);
	}
	
	// If we have skills_list property, use that instead
	if (task.skills_list && Array.isArray(task.skills_list)) {
	  return task.skills_list;
	}
	
	// Fallback to empty array
	return [];
  };

  // Extract task info
  const taskStatusInfo = getTaskStatusInfo();
  const requiredSkills = getRequiredSkills();
  const hasRequiredSkills = requiredSkills.length > 0;

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
        {/* Left side - Task details and subtasks */}
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
            <h1 className="task-title">{task.title || task.task_name}</h1>
            
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
                    {t('taskDetail.startDate')}: {formatDate(task.start_date || task.start_time)}
                  </span>
                )}
                
                {task.due_date && (
                  <span className="task-due-date">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    {t('taskDetail.dueDate')}: {formatDate(task.due_date || task.end_time)}
                  </span>
                )}
              </div>
            </div>

            {task.description && (
              <div className="task-description">
                <h2>{t('taskDetail.description')}</h2>
                <p>{task.description}</p>
              </div>
            )}



            {canNotifyCompletion() && (
              <div className="task-actions">
                <button 
                  className={`notify-completion-button ${notifying ? 'notifying' : ''}`}
                  onClick={handleNotifyCompletion}
                  disabled={notifying}
                  aria-busy={notifying}
                >
                  {notifying ? (
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

            {canMarkComplete() && (
              <div className="task-actions">
                <button 
                  className={`mark-complete-button ${notifying ? 'notifying' : ''}`}
                  onClick={handleMarkComplete}
                  disabled={notifying}
                  aria-busy={notifying}
                >
                  {notifying ? (
                    <>
                      <div className="button-spinner"></div>
                      {t('taskDetail.processing')}
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                      {t('taskDetail.markComplete')}
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

            {/* Subtasks section - using the existing SubtaskList component */}
            <SubtaskList 
              taskId={effectiveTaskId}
              onSubtaskAdded={() => {
                // Refresh task data when subtask is added
                getTaskWithSubtasks(effectiveTaskId).then(response => {
                  if (response.success) {
                    setTask(response.data.task);
                  }
                });
              }}
              onSubtaskEdited={() => {
                // Refresh task data when subtask is edited
                getTaskWithSubtasks(effectiveTaskId).then(response => {
                  if (response.success) {
                    setTask(response.data.task);
                  }
                });
              }}
              onSubtaskStatusChange={() => {
                // Recalculate progress when subtask status changes
                getTaskWithSubtasks(effectiveTaskId).then(response => {
                  if (response.success) {
                    const taskData = response.data.task;
                    setTask(taskData);
                    
                    if (taskData.subtasks && taskData.subtasks.length > 0) {
                      const completedSubtasks = taskData.subtasks.filter(
                        subtask => subtask.status === 'Completed'
                      ).length;
                      const progress = Math.round(
                        (completedSubtasks / taskData.subtasks.length) * 100
                      );
                      setCompletionProgress(progress);
                    }
                  }
                });
              }}
              readOnly={!isHost()}
            />

			<TaskVolunteers 
			  taskId={effectiveTaskId}
			  eventId={effectiveEventId}
			  onVolunteersChanged={() => {
			    // Refresh task data when volunteers are added/removed
			    getTaskWithSubtasks(effectiveTaskId).then(response => {
			      if (response.success) {
			        setTask(response.data.task);
			      }
			    });
			  }}
			  readOnly={!isHost()}
			/>	
          </div>
        </main>

        {/* Right side - Required skills and task chat */}
        <aside className="task-detail-sidebar">
          {/* Required skills section */}
          {hasRequiredSkills && (
            <div className="task-required-skills">
              <h2>{t('taskDetail.requiredSkills')}</h2>
              <div className="skills-container">
                {requiredSkills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Task chat section - using the existing TaskChat component */}
          <div className="task-chat-container">
            <TaskChat 
              taskId={effectiveTaskId}
              taskName={task.title || task.task_name}
              isCompact={true} 
            />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TaskDetail;