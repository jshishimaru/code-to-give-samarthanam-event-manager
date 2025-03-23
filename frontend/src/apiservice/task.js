import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/';
const APP_API_URL = 'http://127.0.0.1:8000/api/app/';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

/**
 * Add a new task to an event
 * @param {Object} taskData - Task data including event_id, task_name, description, etc.
 * @returns {Promise<Object>} Response with success status and task data
 */
export const addTaskToEvent = async (taskData) => {
  try {
    const response = await axios.post(`${APP_API_URL}tasks/add/`, taskData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error adding task:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Add a subtask to a parent task
 * @param {Object} subtaskData - Subtask data including task_id, title, description, etc.
 * @returns {Promise<Object>} Response with success status and subtask data
 */
export const addSubtask = async (subtaskData) => {
  try {
    const response = await axios.post(`${APP_API_URL}subtasks/add/`, subtaskData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error adding subtask:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Assign volunteers to a task
 * @param {number} taskId - ID of the task
 * @param {Array<number>} volunteerIds - Array of volunteer user IDs
 * @param {boolean} replace - Whether to replace existing volunteers or add to them
 * @returns {Promise<Object>} Response with success status and updated task data
 */
export const assignVolunteersToTask = async (taskId, volunteerIds, replace = false) => {
  try {
    const response = await axios.post(`${APP_API_URL}tasks/assign-volunteers/`, {
      task_id: taskId,
      volunteer_ids: volunteerIds,
      replace: replace
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error assigning volunteers:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Update task details
 * @param {Object} taskData - Updated task data including task_id and fields to update
 * @returns {Promise<Object>} Response with success status and updated task data
 */
export const updateTask = async (taskData) => {
  try {
    const response = await axios.post(`${APP_API_URL}tasks/update/`, taskData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating task:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Delete a task
 * @param {number} taskId - ID of the task to delete
 * @returns {Promise<Object>} Response with success status and message
 */
export const deleteTask = async (taskId) => {
  try {
    const response = await axios.post(`${APP_API_URL}tasks/delete/`, {
      task_id: taskId
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Volunteer notifies that a task is completed
 * @param {number} taskId - ID of the completed task
 * @param {string} message - Optional notification message
 * @returns {Promise<Object>} Response with success status and updated task data
 */
export const notifyTaskCompletion = async (taskId, message) => {
  try {
    const response = await axios.post(`${APP_API_URL}tasks/notify-completion/`, {
      task_id: taskId,
      message: message
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error notifying task completion:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Volunteer notifies that a subtask is completed
 * @param {number} subtaskId - ID of the completed subtask
 * @param {string} message - Optional notification message
 * @returns {Promise<Object>} Response with success status and updated subtask data
 */
export const notifySubtaskCompletion = async (subtaskId, message) => {
  try {
    const response = await axios.post(`${APP_API_URL}subtasks/notify-completion/`, {
      subtask_id: subtaskId,
      message: message
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error notifying subtask completion:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Get tasks with completion notifications
 * @param {number} eventId - Optional event ID to filter tasks by event
 * @returns {Promise<Object>} Response with success status and list of notified tasks
 */
export const getNotifiedTasks = async (eventId = null) => {
  try {
    const params = eventId ? { event_id: eventId } : {};
    const response = await axios.get(`${APP_API_URL}tasks/notified/`, { params });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching notified tasks:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Get subtasks with completion notifications for a task
 * @param {number} taskId - ID of the parent task
 * @returns {Promise<Object>} Response with success status and list of notified subtasks
 */
export const getNotifiedSubtasks = async (taskId) => {
  try {
    const response = await axios.get(`${APP_API_URL}subtasks/notified/`, {
      params: { task_id: taskId }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching notified subtasks:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Host marks a task as complete
 * @param {number} taskId - ID of the task
 * @returns {Promise<Object>} Response with success status and updated task data
 */
export const markTaskComplete = async (taskId) => {
  try {
    const response = await axios.post(`${APP_API_URL}tasks/mark-complete/`, {
      task_id: taskId
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error marking task as complete:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Host marks a subtask as complete
 * @param {number} subtaskId - ID of the subtask
 * @returns {Promise<Object>} Response with success status and updated subtask data
 */
export const markSubtaskComplete = async (subtaskId) => {
  try {
    const response = await axios.post(`${APP_API_URL}subtasks/mark-complete/`, {
      subtask_id: subtaskId
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error marking subtask as complete:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Get detailed information about a task and all its subtasks
 * @param {number} taskId - ID of the task
 * @returns {Promise<Object>} Response with success status and task data with subtasks
 */
export const getTaskWithSubtasks = async (taskId) => {
  try {
    const response = await axios.get(`${APP_API_URL}tasks/details/`, {
      params: { task_id: taskId }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching task details with subtasks:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};


/**
 * Get tasks for an event
 * @param {number} eventId - ID of the event
 * @returns {Promise<Object>} Response with success status and tasks for the event
 */
export const getTasksForEvent = async (eventId) => {
	try {
	  // Use the correct endpoint from tasks_views.py
	  const response = await axios.get(`${APP_API_URL}tasks/event/`, {
		params: { event_id: eventId }
	  });
	  
	  // Check if the response has the expected structure
	  if (response.data && (response.data.tasks || response.data.status === 'success')) {
		return { success: true, data: response.data };
	  } else {
		return { 
		  success: false, 
		  error: 'Invalid response format from server' 
		};
	  }
	} catch (error) {
	  console.error('Error fetching tasks for event:', error);
	  
	  // Try the fallback endpoint if the main one fails
	  try {
		const fallbackResponse = await axios.get(`${APP_API_URL}tasks/notified/`, {
		  params: { event_id: eventId }
		});
		
		if (fallbackResponse.data) {
		  return { success: true, data: fallbackResponse.data };
		} else {
		  return { 
			success: false, 
			error: 'Invalid response format from server' 
		  };
		}
	  } catch (fallbackError) {
		console.error('Error with fallback endpoint:', fallbackError);
		return { 
		  success: false, 
		  error: error.response?.data?.message || error.message 
		};
	  }
	}
  };
  
  /**
   * Get tasks assigned to a volunteer
   * @param {number} userId - ID of the volunteer
   * @param {number} eventId - Optional event ID to filter tasks
   * @returns {Promise<Object>} Response with success status and assigned tasks
   */
  export const getVolunteerTasks = async (userId, eventId = null) => {
	try {
	  // Build query parameters
	  const params = { volunteer_id: userId };
	  if (eventId) params.event_id = eventId;
	  
	  // Use the correct endpoint from tasks_views.py
	  const response = await axios.get(`${APP_API_URL}tasks/volunteer/`, { params });
	  
	  // Check if the response has the expected structure
	  if (response.data && (response.data.tasks || response.data.status === 'success')) {
		return { success: true, data: response.data };
	  } else {
		return { 
		  success: false, 
		  error: 'Invalid response format from server' 
		};
	  }
	} catch (error) {
	  console.error('Error fetching volunteer tasks:', error);
	  return { 
		success: false, 
		error: error.response?.data?.message || error.message 
	  };
	}
  };