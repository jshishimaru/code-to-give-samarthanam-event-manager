import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import TaskList from './TaskList';
import TaskDetail from '../../host/taskdetail/taskdetail';
import { getTasksForEvent } from '../../../apiservice/task';
import '../../../styles/host/hosttask/EventTasks.css';
import TaskForm from './TaskForm';
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

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const handleAddTask = () => {
	setEditingTask(null);
	setShowTaskForm(true);
  };
  
  // Add a function to handle form submission success
  const handleTaskFormSuccess = (taskData) => {
	setShowTaskForm(false);
	refreshTasks();
  };
  
  // Add a function to handle form cancellation
  const handleTaskFormCancel = () => {
	setShowTaskForm(false);
  };

  const handleTaskDeleted = () => {
	refreshTasks();
  };
  
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
	setEditingTask(task);
	setShowTaskForm(true);
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
	    {/* Remove the refresh button and keep only the add task button */}
	    <button 
	      className="add-task-button"
	      onClick={handleAddTask}
	    >
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
        </div>
      ) : (
		<TaskList 
		  tasks={tasks} 
		  onEditTask={handleEditTask}
		  onSelectTask={handleSelectTask}
		  onTaskDeleted={handleTaskDeleted}
		/>
      )}

	{showTaskForm && (
	  <div className="task-form-modal-overlay">
	    <div className="task-form-modal-content">
	      <button 
	        className="close-modal-button"
	        onClick={() => setShowTaskForm(false)}
	        aria-label={t('common.close')}
	      >
	        ×
	      </button>
	      <TaskForm
	        mode={editingTask ? 'edit' : 'create'}
	        initialData={editingTask}
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