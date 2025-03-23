import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/';
const APP_API_URL = 'http://127.0.0.1:8000/api/app/';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

/**
 * Get all feedback for a specific event including summary statistics
 * @param {string} eventId - The ID of the event to fetch feedback for
 * @returns {Promise} - Promise with feedback data or error
 */
export const getEventFeedbackList = async (eventId) => {
  try {
    const response = await axios.get(`${APP_API_URL}feedback/event/`, {
      params: { event_id: eventId }
    });
    
    return { 
      success: true, 
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching event feedback list:', error);
    
    if (error.response) {
      return { 
        success: false, 
        error: error.response.data.message || 'Failed to fetch feedback list' 
      };
    }
    return { 
      success: false, 
      error: 'Network error occurred while fetching feedback list' 
    };
  }
};

/**
 * Get detailed information about a specific feedback
 * @param {string} feedbackId - The ID of the feedback to fetch
 * @returns {Promise} - Promise with feedback details or error
 */
export const getFeedbackDetails = async (feedbackId) => {
  try {
    const response = await axios.get(`${APP_API_URL}feedback/detail/`, {
      params: { feedback_id: feedbackId }
    });
    
    return { 
      success: true, 
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching feedback details:', error);
    
    if (error.response) {
      return { 
        success: false, 
        error: error.response.data.message || 'Failed to fetch feedback details' 
      };
    }
    return { 
      success: false, 
      error: 'Network error occurred while fetching feedback details' 
    };
  }
};

/**
 * Submit feedback for an event
 * @param {Object} feedbackData - The feedback data to submit
 * @param {string} feedbackData.event_id - The ID of the event
 * @param {number} feedbackData.overall_experience - Rating for overall experience (1-5)
 * @param {number} feedbackData.organization_quality - Rating for organization quality (1-5)
 * @param {number} feedbackData.communication - Rating for communication (1-5)
 * @param {number} feedbackData.host_interaction - Rating for host interaction (1-5)
 * @param {number} feedbackData.volunteer_support - Rating for volunteer support (1-5)
 * @param {number} feedbackData.task_clarity - Rating for task clarity (1-5)
 * @param {number} feedbackData.impact_awareness - Rating for impact awareness (1-5)
 * @param {number} feedbackData.inclusivity - Rating for inclusivity (1-5)
 * @param {number} feedbackData.time_management - Rating for time management (1-5)
 * @param {number} feedbackData.recognition - Rating for recognition (1-5)
 * @param {string} feedbackData.strengths - Event strengths
 * @param {string} feedbackData.improvements - Suggested improvements
 * @param {string} feedbackData.additional_comments - Additional comments
 * @param {boolean} feedbackData.would_volunteer_again - Whether the user would volunteer again
 * @returns {Promise} - Promise with submission result or error
 */
export const submitFeedback = async (feedbackData) => {
  try {
    const response = await axios.post(`${APP_API_URL}feedback/submit/`, feedbackData);
    
    return { 
      success: true, 
      data: response.data
    };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    
    if (error.response) {
      return { 
        success: false, 
        error: error.response.data.message || 'Failed to submit feedback' 
      };
    }
    return { 
      success: false, 
      error: 'Network error occurred while submitting feedback' 
    };
  }
};

/**
 * Get all feedback submitted by the current authenticated user
 * @returns {Promise} - Promise with user's feedback list or error
 */
export const getUserFeedbackList = async () => {
  try {
    const response = await axios.get(`${APP_API_URL}feedback/user/`);
    
    return { 
      success: true, 
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching user feedback list:', error);
    
    if (error.response) {
      return { 
        success: false, 
        error: error.response.data.message || 'Failed to fetch your feedback list' 
      };
    }
    return { 
      success: false, 
      error: 'Network error occurred while fetching your feedback list' 
    };
  }
};

/**
 * Check if a user can submit feedback for an event
 * @param {string} eventId - The ID of the event to check
 * @returns {Promise} - Promise with eligibility status or error
 */
export const checkFeedbackEligibility = async (eventId) => {
  try {
    const response = await axios.get(`${APP_API_URL}feedback/eligibility/`, {
      params: { event_id: eventId }
    });
    
    return { 
      success: true, 
      data: {
        eligible: response.data.eligible,
        reason: response.data.reason,
		existing_feedback_id : response.data.existing_feedback_id
      }
    };
  } catch (error) {
    console.error('Error checking feedback eligibility:', error);
    
    if (error.response) {
      return { 
        success: false, 
        error: error.response.data.message || 'Failed to check feedback eligibility' 
      };
    }
    return { 
      success: false, 
      error: 'Network error occurred while checking feedback eligibility' 
    };
  }
};