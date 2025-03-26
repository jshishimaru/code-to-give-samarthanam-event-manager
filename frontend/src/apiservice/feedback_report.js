import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/app/';

// Configure axios defaults
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

/**
 * Generate a comprehensive event report with feedback analysis
 * 
 * @param {number} eventId - ID of the event
 * @returns {Promise<Object>} Response with report data
 */
export const generateEventReport = async (eventId) => {
  try {
    const response = await axios.get(`${API_URL}events/report/`, {
      params: { event_id: eventId }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error generating event report:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || 
             error.message || 
             'Failed to generate event report'
    };
  }
};

/**
 * Get detailed analytics for event feedback
 * 
 * @param {number} eventId - ID of the event
 * @returns {Promise<Object>} Response with analytics data
 */
export const getEventFeedbackAnalytics = async (eventId) => {
  try {
    const response = await axios.get(`${API_URL}events/feedback/analytics/`, {
      params: { event_id: eventId }
    });
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching feedback analytics:', error);
    
    return {
      success: false,
      error: error.response?.data?.message || 
             error.message || 
             'Failed to fetch feedback analytics'
    };
  }
};

export default {
  generateEventReport,
  getEventFeedbackAnalytics
};