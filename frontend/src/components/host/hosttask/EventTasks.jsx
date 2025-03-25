import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import TaskList from './TaskList';
import TaskDetail from '../../host/taskdetail/taskdetail';
import { getTasksForEvent } from '../../../apiservice/task';
import '../../../styles/host/hosttask/EventTasks.css';

/**
 * EventTasks component displays tasks for an event with options to view, edit, and manage tasks
 * @param {Object} props Component props
 * @param {string} props.eventId ID of the event
 */
const EventTasks = ({ eventId }) => {
  const { t } = useTranslation();
  
  // State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Fetch tasks on component mount or when eventId changes
  useEffect(() => {
    const fetchTasks = async () => {
      if (!eventId) {
        setError(t('eventTasks.errors.noEventId'));
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Using getTasksForEvent instead of getEventTasks
        const response = await getTasksForEvent(eventId);
        
        if (response.success) {
          // Handle different response structures that might come from the API
          let tasksList = [];
          if (response.data.tasks) {
            tasksList = response.data.tasks;
          } else if (Array.isArray(response.data)) {
            tasksList = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            tasksList = response.data.data;
          }
          
          setTasks(tasksList);
          setError(null);
        } else {
          setError(response.error || t('eventTasks.errors.fetchFailed'));
        }
      } catch (err) {
        console.error('Error fetching event tasks:', err);
        setError(t('eventTasks.errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, [eventId, t]);
  
  // Refresh tasks after actions that might change the task data
  const refreshTasks = async () => {
    try {
      setLoading(true);
      const response = await getTasksForEvent(eventId);
      
      if (response.success) {
        // Handle different response structures
        let tasksList = [];
        if (response.data.tasks) {
          tasksList = response.data.tasks;
        } else if (Array.isArray(response.data)) {
          tasksList = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          tasksList = response.data.data;
        }
        
        setTasks(tasksList);
        setError(null);
      } else {
        console.error('Error refreshing tasks:', response.error);
      }
    } catch (err) {
      console.error('Error refreshing tasks:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle task selection for viewing details
  const handleSelectTask = (task) => {
    setSelectedTask(task);
  };
  
  // Handle back to task list
  const handleBackToList = () => {
    // Refresh tasks when returning to list view to get latest data
    refreshTasks();
    setSelectedTask(null);
  };
  
  // Handle task edit
  const handleEditTask = (task) => {
    // For now, just view the task detail
    setSelectedTask(task);
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="event-tasks-loading">
        <div className="spinner"></div>
        <p>{t('eventTasks.loading')}</p>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="event-tasks-error">
        <p>{error}</p>
        <button 
          className="retry-button"
          onClick={refreshTasks}
        >
          {t('eventTasks.retry')}
        </button>
      </div>
    );
  }
  
  // Render task detail if a task is selected
  if (selectedTask) {
    return (
      <TaskDetail
        taskId={selectedTask.id}
        eventId={eventId}
        onBack={handleBackToList}
      />
    );
  }
  
  // Render task list
  return (
    <div className="event-tasks-container">
      <div className="event-tasks-header">
        <h2>{t('eventTasks.title')}</h2>
        <div className="event-tasks-actions">
          {/* Task actions like add new task, filter, etc. */}
          <button 
            className="refresh-tasks-button"
            onClick={refreshTasks}
            aria-label={t('eventTasks.refreshTasks')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"></path>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            {t('eventTasks.refresh')}
          </button>
          <button className="add-task-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            {t('eventTasks.addTask')}
          </button>
        </div>
      </div>
      
      {tasks.length === 0 ? (
        <div className="no-tasks-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
          <p>{t('eventTasks.noTasks')}</p>
          <button className="create-first-task-button">
            {t('eventTasks.createFirstTask')}
          </button>
        </div>
      ) : (
        <TaskList 
          tasks={tasks} 
          onEditTask={handleEditTask}
          onSelectTask={handleSelectTask}
        />
      )}
    </div>
  );
};

export default EventTasks;