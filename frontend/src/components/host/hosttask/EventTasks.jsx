import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTasksForEvent } from '../../../apiservice/task';
import TaskList from './TaskList';
import TaskForm from './TaskForm';
import '../../../styles/host/hosttask/EventTasks.css';

/**
 * EventTasks component displays all tasks for an event and allows adding/editing tasks
 */
const EventTasks = () => {
  const { eventId } = useParams();
  const { t } = useTranslation();
  
  // States
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [eventName, setEventName] = useState('');

  // Fetch tasks on component mount and when eventId changes
  useEffect(() => {
    fetchTasks();
  }, [eventId]);

  // Fetch tasks for the event
  const fetchTasks = async () => {
    if (!eventId) {
      setError(t('eventTasks.errors.noEventId'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getTasksForEvent(eventId);
      
      if (response.success) {
        setTasks(response.data.tasks || []);
        setEventName(response.data.event_name || '');
      } else {
        setError(response.error || t('eventTasks.errors.fetchFailed'));
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(t('eventTasks.errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new task
  const handleAddTask = () => {
    setSelectedTask(null);
    setFormMode('create');
    setShowTaskForm(true);
  };

  // Handle editing a task
  const handleEditTask = (task) => {
    setSelectedTask(task);
    setFormMode('edit');
    setShowTaskForm(true);
  };

  // Handle task form success
  const handleTaskFormSuccess = (taskData) => {
    setShowTaskForm(false);
    fetchTasks(); // Refresh the task list
  };

  // Handle task form cancel
  const handleTaskFormCancel = () => {
    setShowTaskForm(false);
  };

  return (
    <div className="event-tasks-container">
      {/* Header with title and add task button */}
      <div className="event-tasks-header">
        <h1 className="event-tasks-title">
          {eventName ? 
            t('eventTasks.tasksForEvent', { eventName }) : 
            t('eventTasks.tasks')
          }
        </h1>
        <button 
          className="add-task-button"
          onClick={handleAddTask}
          aria-label={t('eventTasks.addTaskAriaLabel')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          {t('eventTasks.addTask')}
        </button>
      </div>

      {/* Display task list or error/loading states */}
      <div className="event-tasks-content">
        {loading ? (
          <div className="event-tasks-loading">
            <div className="loading-spinner" role="status"></div>
            <p>{t('eventTasks.loading')}</p>
          </div>
        ) : error ? (
          <div className="event-tasks-error" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>{error}</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="event-tasks-empty">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <p>{t('eventTasks.noTasks')}</p>
            <button 
              className="add-first-task-button"
              onClick={handleAddTask}
              aria-label={t('eventTasks.addFirstTaskAriaLabel')}
            >
              {t('eventTasks.addFirstTask')}
            </button>
          </div>
        ) : (
          <TaskList 
            tasks={tasks} 
            onEditTask={handleEditTask} 
          />
        )}
      </div>

      {/* Task form modal */}
      {showTaskForm && (
        <div className="task-form-modal-overlay">
          <div className="task-form-modal-content">
            <button 
              className="close-modal-button"
              onClick={handleTaskFormCancel}
              aria-label={t('eventTasks.closeModal')}
            >
              ×
            </button>
            <TaskForm
              mode={formMode}
              initialData={selectedTask}
              eventId={eventId}
              onSuccess={handleTaskFormSuccess}
              onCancel={handleTaskFormCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EventTasks;