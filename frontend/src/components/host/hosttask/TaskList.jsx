import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../../styles/host/hosttask/TaskList.css';

/**
 * TaskList component displays a list of tasks with basic information
 * @param {Object} props Component props
 * @param {Array} props.tasks Array of task objects
 * @param {Function} props.onEditTask Function to call when editing a task
 */
const TaskList = ({ tasks, onEditTask }) => {
  const { t } = useTranslation();

  // Get status class name based on task status
  const getStatusClassName = (status) => {
    const statusMap = {
      'Pending': 'status-pending',
      'In Progress': 'status-in-progress',
      'Completed': 'status-completed',
      'Cancelled': 'status-cancelled',
      'Delayed': 'status-delayed'
    };
    return statusMap[status] || 'status-pending';
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
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
    const count = task.volunteers?.length || 0;
    return count === 0 
      ? t('taskList.noVolunteers') 
      : t('taskList.volunteerCount', { count });
  };

  return (
    <div className="task-list-container">
      <div className="task-list-header">
        <div className="task-name-header">{t('taskList.taskName')}</div>
        <div className="task-date-header">{t('taskList.dates')}</div>
        <div className="task-status-header">{t('taskList.status')}</div>
        <div className="task-volunteers-header">{t('taskList.volunteers')}</div>
        <div className="task-actions-header">{t('taskList.actions')}</div>
      </div>
      
      <ul className="task-list">
        {tasks.map(task => (
          <li key={task.id} className="task-item">
            <div className="task-name">
              <h3>{task.task_name}</h3>
              {task.required_skills && (
                <div className="task-skills">
                  {Array.isArray(task.skills_list) 
                    ? task.skills_list.map((skill, index) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))
                    : task.required_skills.split(',').map((skill, index) => (
                        <span key={index} className="skill-tag">{skill.trim()}</span>
                      ))
                  }
                </div>
              )}
            </div>
            
            <div className="task-dates">
              <div className="task-date">
                <strong>{t('taskList.start')}:</strong> {formatDate(task.start_time)}
              </div>
              <div className="task-date">
                <strong>{t('taskList.end')}:</strong> {formatDate(task.end_time)}
              </div>
            </div>
            
            <div className="task-status">
              <span className={`status-badge ${getStatusClassName(task.status)}`}>
                {task.status}
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
            
            <div className="task-actions">
              <button 
                className="edit-task-button"
                onClick={() => onEditTask(task)}
                aria-label={t('taskList.editTaskAriaLabel', { taskName: task.task_name })}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                {t('taskList.editTask')}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;