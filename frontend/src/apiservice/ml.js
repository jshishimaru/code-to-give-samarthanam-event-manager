import axios from 'axios';
import { handleApiError } from './apierror';

const API_URL = 'http://127.0.0.1:8000/api/';
const APP_API_URL = 'http://127.0.0.1:8000/api/app/';

/**
 * Get personalized event recommendations for the current user
 * @param {Object} options Configuration options
 * @param {string} options.status Filter by event status (default: 'Upcoming')
 * @param {number} options.limit Maximum number of recommendations to return (default: 10)
 * @param {boolean} options.includeEnrolled Whether to include events the user is already enrolled in (default: false)
 * @returns {Promise<Object>} Response with recommended events and metadata
 */
export const getRecommendedEvents = async (options = {}) => {
  try {
    const { status = 'Upcoming', limit = 10, includeEnrolled = false } = options;
    
    const params = new URLSearchParams({
      status,
      limit,
      include_enrolled: includeEnrolled
    });
    
    const response = await axios.get(`${APP_API_URL}recommendations/events/?${params}`, {
      withCredentials: true, // Include cookies for authentication
    });
    
    if (response.data) {
      return {
        success: true,
        data: {
          events: response.data.recommendations || [],
          count: response.data.count || 0,
          personalized: response.data.personalized || false,
          userSkills: response.data.user_skills || [],
          message: response.data.message || null
        }
      };
    }
    
    return {
      success: false,
      error: 'No data received from server'
    };
  } catch (error) {
    return handleApiError(error, 'Failed to fetch recommended events');
  }
};

/**
 * Get events sorted by relevance for the current user
 * @param {Object} options Configuration options
 * @param {string} options.status Filter by event status ('all', 'active', 'ongoing', 'upcoming') (default: 'active')
 * @param {number} options.limit Maximum number of events to return (default: 100)
 * @param {boolean} options.includePast Whether to include past events (default: false)
 * @returns {Promise<Object>} Response with events sorted by relevance to the user
 */
export const getEventsSortedByRelevance = async (options = {}) => {
  try {
    const { status = 'active', limit = 100, includePast = false } = options;
    
    const params = new URLSearchParams({
      status,
      limit,
      include_past: includePast
    });
    
    const response = await axios.get(`${APP_API_URL}events/sorted-by-relevance/?${params}`, {
      withCredentials: true, // Include cookies for authentication
    });
    
    if (response.data) {
		console.log("aabab");
		console.log(response.data);
      return {
        success: true,
        data: {
          events: response.data.events || [],
          count: response.data.count || 0,
          personalized: response.data.personalized || false,
          userSkills: response.data.user_skills || [],
          message: response.data.message || null,
          totalAvailable: response.data.total_available || 0
        }
      };
    }
    
    return {
      success: false,
      error: 'No data received from server'
    };
  } catch (error) {
    return handleApiError(error, 'Failed to fetch events sorted by relevance');
  }
};

/**
 * Get personalized task recommendations for the current user
 * @param {Object} options Configuration options
 * @param {string} options.eventId Optional event ID to filter tasks
 * @param {number} options.limit Maximum number of recommendations to return (default: 10)
 * @returns {Promise<Object>} Response with recommended tasks and metadata
 */
export const getRecommendedTasks = async (options = {}) => {
  try {
    const { eventId, limit = 10 } = options;
    
    const params = new URLSearchParams();
    if (eventId) params.append('event_id', eventId);
    if (limit) params.append('limit', limit);
    
    const response = await axios.get(`${APP_API_URL}recommendations/tasks/?${params}`, {
      withCredentials: true, // Include cookies for authentication
    });
    
    if (response.data) {
      return {
        success: true,
        data: {
          tasks: response.data.tasks || [],
          count: response.data.count || 0,
          personalized: response.data.personalized || false,
          userSkills: response.data.user_skills || [],
          message: response.data.message || null
        }
      };
    }
    
    return {
      success: false,
      error: 'No data received from server'
    };
  } catch (error) {
    return handleApiError(error, 'Failed to fetch recommended tasks');
  }
};

/**
 * Get skill analysis for a specific event
 * @param {string} eventId The ID of the event to analyze
 * @returns {Promise<Object>} Response with skill analysis data
 */
export const getEventSkillAnalysis = async (eventId) => {
  try {
    if (!eventId) {
      return {
        success: false,
        error: 'Event ID is required'
      };
    }
    
    const response = await axios.get(`${APP_API_URL}events/analyze-skills/?event_id=${eventId}`, {
      withCredentials: true, // Include cookies for authentication
    });
    
    if (response.data) {
      return {
        success: true,
        data: {
          eventId: response.data.event_id,
          eventName: response.data.event_name,
          skills: response.data.skills || [],
          skillStats: response.data.skill_stats || [],
          skillGaps: response.data.skill_gaps || [],
          coveragePercentage: response.data.coverage_percentage || 0,
          totalTasks: response.data.total_tasks || 0,
          totalVolunteers: response.data.total_volunteers || 0
        }
      };
    }
    
    return {
      success: false,
      error: 'No data received from server'
    };
  } catch (error) {
    return handleApiError(error, 'Failed to analyze event skills');
  }
};

export default {
  getRecommendedEvents,
  getRecommendedTasks,
  getEventSkillAnalysis,
  getEventsSortedByRelevance
};