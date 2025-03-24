import axios from 'axios';
import { handleApiError } from './apierror';

const API_URL = 'http://127.0.0.1:8000/api/';
const APP_API_URL = 'http://127.0.0.1:8000/api/app/';

/**
 * Get all volunteers enrolled in a specific event
 * @param {string|number} eventId The ID of the event
 * @returns {Promise<Object>} Response with volunteers data and metadata
 */
export const getEventVolunteers = async (eventId) => {
  try {
    if (!eventId) {
      return {
        success: false,
        error: 'Event ID is required'
      };
    }

    const response = await axios.get(`${APP_API_URL}events/volunteers/`, {
      params: { event_id: eventId },
      withCredentials: true // Include cookies for authentication
    });

    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        data: {
          eventId: response.data.event_id,
          eventName: response.data.event_name,
          volunteers: response.data.volunteers || [],
          totalCount: response.data.total_count || 0
        }
      };
    } else {
      return {
        success: false,
        error: response.data?.message || 'Failed to fetch event volunteers'
      };
    }
  } catch (error) {
    return handleApiError(error, 'Failed to fetch event volunteers');
  }
};

/**
 * Get all volunteers assigned to a specific task
 * @param {string|number} taskId The ID of the task
 * @returns {Promise<Object>} Response with volunteers data and metadata
 */
export const getTaskVolunteers = async (taskId) => {
  try {
    if (!taskId) {
      return {
        success: false,
        error: 'Task ID is required'
      };
    }

    const response = await axios.get(`${APP_API_URL}tasks/volunteers/`, {
      params: { task_id: taskId },
      withCredentials: true // Include cookies for authentication
    });

    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        data: {
          taskId: response.data.task_id,
          taskName: response.data.task_name,
          eventId: response.data.event_id,
          eventName: response.data.event_name,
          volunteers: response.data.volunteers || [],
          totalCount: response.data.total_count || 0
        }
      };
    } else {
      return {
        success: false,
        error: response.data?.message || 'Failed to fetch task volunteers'
      };
    }
  } catch (error) {
    return handleApiError(error, 'Failed to fetch task volunteers');
  }
};

/**
 * Get available volunteers who are enrolled in an event but not assigned to a specific task
 * @param {string|number} taskId The ID of the task
 * @returns {Promise<Object>} Response with available volunteers data and metadata
 */
export const getAvailableVolunteersForTask = async (taskId) => {
  try {
    if (!taskId) {
      return {
        success: false,
        error: 'Task ID is required'
      };
    }

    const response = await axios.get(`${APP_API_URL}tasks/available-volunteers/`, {
      params: { task_id: taskId },
      withCredentials: true
    });

    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        data: {
          taskId: response.data.task_id,
          taskName: response.data.task_name,
          eventId: response.data.event_id,
          eventName: response.data.event_name,
          volunteers: response.data.available_volunteers || [],
          totalCount: response.data.total_count || 0
        }
      };
    } else {
      return {
        success: false,
        error: response.data?.message || 'Failed to fetch available volunteers'
      };
    }
  } catch (error) {
    return handleApiError(error, 'Failed to fetch available volunteers for task');
  }
};

/**
 * Search for volunteers by name, skills, location, or organization
 * @param {Object} options Search options
 * @param {string} options.query The search query (name/skills/organization/location)
 * @param {string|number} [options.eventId] Optional event ID to limit search to a specific event
 * @returns {Promise<Object>} Response with matching volunteers data
 */
export const searchVolunteers = async (options = {}) => {
  try {
    const { query = '', eventId = null } = options;

    const params = {};
    if (query) params.q = query;
    if (eventId) params.event_id = eventId;

    const response = await axios.get(`${APP_API_URL}volunteers/search/`, {
      params,
      withCredentials: true
    });

    if (response.data && response.data.status === 'success') {
		// console.log(response.data);
      return {
        success: true,
        data: {
          query: response.data.query,
          eventId: response.data.event_id,
          volunteers: response.data.volunteers || [],
          totalCount: response.data.total_count || 0
        }
      };
    } else {
      return {
        success: false,
        error: response.data?.message || 'Failed to search volunteers'
      };
    }
  } catch (error) {
    return handleApiError(error, 'Failed to search volunteers');
  }
};

/**
 * Assign volunteers to a task
 * @param {string|number} taskId The ID of the task
 * @param {Array<string|number>} volunteerIds Array of volunteer IDs to assign
 * @returns {Promise<Object>} Response indicating success or failure
 */
export const assignVolunteersToTask = async (taskId, volunteerIds) => {
  try {
    if (!taskId) {
      return {
        success: false,
        error: 'Task ID is required'
      };
    }

    if (!volunteerIds || !Array.isArray(volunteerIds) || volunteerIds.length === 0) {
      return {
        success: false,
        error: 'At least one volunteer ID must be provided'
      };
    }

    const response = await axios.post(
      `${APP_API_URL}tasks/assign-volunteers/`,
      {
        task_id: taskId,
        volunteer_ids: volunteerIds
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );

    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        data: {
          taskId: response.data.task_id,
          assignedVolunteers: response.data.assigned_volunteers || []
        }
      };
    } else {
      return {
        success: false,
        error: response.data?.message || 'Failed to assign volunteers to task'
      };
    }
  } catch (error) {
    return handleApiError(error, 'Failed to assign volunteers to task');
  }
};

/**
 * Remove volunteers from a task
 * @param {string|number} taskId The ID of the task
 * @param {Array<string|number>} volunteerIds Array of volunteer IDs to remove
 * @returns {Promise<Object>} Response indicating success or failure
 */
export const removeVolunteersFromTask = async (taskId, volunteerIds) => {
  try {
    if (!taskId) {
      return {
        success: false,
        error: 'Task ID is required'
      };
    }

    if (!volunteerIds || !Array.isArray(volunteerIds) || volunteerIds.length === 0) {
      return {
        success: false,
        error: 'At least one volunteer ID must be provided'
      };
    }

    const response = await axios.post(
      `${APP_API_URL}tasks/remove-volunteers/`,
      {
        task_id: taskId,
        volunteer_ids: volunteerIds
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );

    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        data: {
          taskId: response.data.task_id,
          removedVolunteers: response.data.removed_volunteers || []
        }
      };
    } else {
      return {
        success: false,
        error: response.data?.message || 'Failed to remove volunteers from task'
      };
    }
  } catch (error) {
    return handleApiError(error, 'Failed to remove volunteers from task');
  }
};

export default {
  getEventVolunteers,
  getTaskVolunteers,
  getAvailableVolunteersForTask,
  searchVolunteers,
  assignVolunteersToTask,
  removeVolunteersFromTask
};