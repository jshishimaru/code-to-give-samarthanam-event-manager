import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { deleteTask } from '../../../apiservice/task';
import '../../../styles/host/hosttask/TaskList.css';

/**
 * TaskList component displays a list of tasks with basic information
 * @param {Object} props Component props
 * @param {Array} props.tasks Array of task objects
 * @param {Function} props.onEditTask Function to call when editing a task
 * @param {Function} props.onSelectTask Function to call when selecting a task to view details
 * @param {Function} props.onTaskDeleted Function to call when a task is deleted
 */
const TaskList = ({ tasks, onEditTask, onSelectTask, onTaskDeleted }) => {
  const { t } = useTranslation();
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Handle task deletion
  const handleDeleteTask = async (taskId, event) => {
    // Stop the event from propagating to the parent (which would trigger task selection)
    event.stopPropagation();
    
    if (deletingTaskId) return; // Prevent multiple clicks
    
    if (window.confirm(t('taskList.confirmDelete'))) {
      try {
        setDeletingTaskId(taskId);
        
        const response = await deleteTask(taskId);
        
        if (response.success) {
          setNotification({
            type: 'success',
            message: t('taskList.taskDeleted')
          });
          
          // Call the callback to refresh the task list
          if (onTaskDeleted) {
            onTaskDeleted();
          }
        } else {
          setNotification({
            type: 'error',
            message: response.error || t('taskList.deleteFailed')
          });
        }
      } catch (err) {
        console.error('Error deleting task:', err);
        setNotification({
          type: 'error',
          message: t('taskList.deleteFailed')
        });
      } finally {
        setDeletingTaskId(null);
        
        // Clear notification after 3 seconds
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      }
    }
  };

  // Get status class name based on task status
  const getStatusClassName = (status) => {
    if (!status) return 'status-pending';
    
    // Normalize status to handle case differences
    const normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus.includes('progress') || normalizedStatus.includes('in-progress')) {
      return 'status-in-progress';
    } else if (normalizedStatus.includes('complet')) {
      return 'status-completed';
    } else if (normalizedStatus.includes('cancel')) {
      return 'status-cancelled';
    } else if (normalizedStatus.includes('delay')) {
      return 'status-delayed';
    }
    
    return 'status-pending';
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Check if the date string is valid
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get volunteer count message
  const getVolunteerCountMessage = (task) => {
    // Different possible ways the volunteers info might be stored
    let count = 0;
    
    if (task.volunteers && Array.isArray(task.volunteers)) {
      count = task.volunteers.length;
    } else if (task.volunteer_count !== undefined) {
      count = task.volunteer_count;
    } else if (task.assigned_volunteers && Array.isArray(task.assigned_volunteers)) {
      count = task.assigned_volunteers.length;
    }
    
    return count === 0 
      ? t('taskList.noVolunteers') 
      : t('taskList.volunteerCount', { count });
  };

  // Get task name from different possible properties
  const getTaskName = (task) => {
    return task.task_name || task.title || task.name || 'Unnamed Task';
  };

  // Get task skills list
  const getTaskSkills = (task) => {
    // Different possible ways the skills info might be stored
    if (task.skills_list && Array.isArray(task.skills_list)) {
      return task.skills_list;
    } else if (task.required_skills) {
      if (Array.isArray(task.required_skills)) {
        return task.required_skills;
      } else if (typeof task.required_skills === 'string') {
        return task.required_skills.split(',').map(skill => skill.trim());
      }
    }
    
    return [];
  };

  return (
	<div className="task-list-container">
	{/* Show notification if present */}
	{notification && (
	  <div className={`task-notification ${notification.type}`}>
		<span>{notification.message}</span>
		<button 
		  className="close-notification"
		  onClick={() => setNotification(null)}
		>
		  ×
		</button>
	  </div>
	)}
  
	<div className="task-list-header">
	  <div className="task-name-header">{t('taskList.taskName')}</div>
	  <div className="task-date-header">{t('taskList.dates')}</div>
	  <div className="task-status-header">{t('taskList.status')}</div>
	  <div className="task-volunteers-header">{t('taskList.volunteers')}</div>
	  <div className="task-actions-header">{t('taskList.actions')}</div>
	</div>
	
	<ul className="task-list">
	  {tasks.map(task => (
		<li 
		  key={task.id} 
		  className="task-item"
		  onClick={() => onSelectTask && onSelectTask(task)}
		>
            <div className="task-name">
              <h3>{getTaskName(task)}</h3>
              {task.required_skills && (
                <div className="task-skills">
                  {getTaskSkills(task).map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="task-dates">
              <div className="task-date">
                <strong>{t('taskList.start')}:</strong> {formatDate(task.start_time || task.start_date)}
              </div>
              <div className="task-date">
                <strong>{t('taskList.end')}:</strong> {formatDate(task.end_time || task.due_date)}
              </div>
            </div>
            
            <div className="task-status">
              <span className={`status-badge ${getStatusClassName(task.status)}`}>
                {task.status || t('taskList.statusPending')}
              </span>
            </div>
            
            <div className="task-volunteers">
              <div className="volunteer-count">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                {getVolunteerCountMessage(task)}
              </div>
            </div>
            
            <div className="task-actions" onClick={(e) => e.stopPropagation()}>
              <button 
                className="edit-task-button"
                onClick={() => onEditTask && onEditTask(task)}
                aria-label={t('taskList.editTaskAriaLabel', { taskName: getTaskName(task) })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                {t('taskList.editTask')}
              </button>
              
              <button 
                className="view-task-button"
                onClick={() => onSelectTask && onSelectTask(task)}
                aria-label={t('taskList.viewTaskAriaLabel', { taskName: getTaskName(task) })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                {t('taskList.viewTask')}
              </button>
              
              <button 
                className="delete-task-button"
                onClick={(e) => handleDeleteTask(task.id, e)}
                disabled={deletingTaskId === task.id}
                aria-label={t('taskList.deleteTaskAriaLabel', { taskName: getTaskName(task) })}
              >
                {deletingTaskId === task.id ? (
                  <span className="button-spinner"></span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                )}
                {t('taskList.deleteTask')}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;