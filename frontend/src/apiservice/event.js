import axios from 'axios';
import qs from 'qs';

const API_URL = 'http://127.0.0.1:8000/api/';
const APP_API_URL = 'http://127.0.0.1:8000/api/app/';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

// Returns a list of event_ids
export const allUpcomingEvents = async () => {
    try {
        const response = await axios.get(`${APP_API_URL}events/upcoming/`);
        return { success: true, data: response.data };
    }
    catch(error) {
        console.error('Error fetching upcoming events:', error);
        return { success: false, error: error.message };
    }
};

// Get user enrolled events
// Returns a list of event_ids
export const getUserEnrolledEvents = async (userId) => {
  try {
    const response = await axios.get(`${APP_API_URL}user/events/enrolled/`, {
      params: { user_id: userId }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching enrolled events:', error);
    return { success: false, error: error.message };
  }
};

// Get user past events
// Returns a list of event_ids
export const getUserPastEvents = async (userId) => {
  try {
    const response = await axios.get(`${APP_API_URL}user/events/past/`, {
      params: { user_id: userId }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching past events:', error);
    return { success: false, error: error.message };
  }
};

// Get user upcoming events
// Returns a list of event_ids
export const getUserUpcomingEvents = async (userId) => {
  try {
    const response = await axios.get(`${APP_API_URL}user/events/upcoming/`, {
      params: { user_id: userId }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching upcoming user events:', error);
    return { success: false, error: error.message };
  }
};

// Get event details
export const getEventDetails = async (eventId) => {
  try {
    const response = await axios.get(`${APP_API_URL}events/details/`, {
      params: { event_id: eventId }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching event details:', error);
    return { success: false, error: error.message };
  }
};

// Enroll user in event
export const enrollUserInEvent = async (eventId, userId) => {
  try {
    // Updated to match the URL in urls.py
    const response = await axios.post(`${APP_API_URL}user/events/enroll/`, {
      event_id: eventId,
      user_id: userId
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error enrolling user in event:', error);
    return { success: false, error: error.message };
  }
};

// Unenroll user from event
export const unenrollUserFromEvent = async (eventId) => {
  try {
    const response = await axios.post(`${APP_API_URL}user/events/unenroll/`, {
      event_id: eventId
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error unenrolling from event:', error);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

// Update event
export const updateEvent = async (eventData) => {
  try {
    // Updated to match the URL in urls.py
    let formData = new FormData();
    
    // Add all event data to the formData
    Object.keys(eventData).forEach(key => {
      if (key === 'image' && eventData[key] instanceof File) {
        formData.append(key, eventData[key]);
      } else {
        formData.append(key, eventData[key]);
      }
    });
    
    const response = await axios.post(`${APP_API_URL}host/events/update/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating event:', error);
    return { success: false, error: error.message };
  }
};

// Create event
export const createEvent = async (eventData) => {
  try {
    // Updated to match the URL in urls.py
    let formData = new FormData();
    
    // Add all event data to the formData
    Object.keys(eventData).forEach(key => {
      if (key === 'image' && eventData[key] instanceof File) {
        formData.append(key, eventData[key]);
      } else {
        formData.append(key, eventData[key]);
      }
    });
    
    const response = await axios.post(`${APP_API_URL}host/events/create/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error creating event:', error);
    return { success: false, error: error.message };
  }
};

// Get host events
export const getHostEvents = async () => {
  try {
    const response = await axios.get(`${APP_API_URL}host/events/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching host events:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if a user is enrolled in a specific event
 * @param {number} eventId - ID of the event to check enrollment for
 * @returns {Promise<Object>} Response with success status and enrollment information
 */
export const checkUserEnrollment = async (eventId) => {
  try {
    // Updated to match the URL in urls.py
    const response = await axios.get(`${APP_API_URL}user/events/check-enrollment/`, {
      params: { event_id: eventId }
    });
    
    return { 
      success: true, 
      data: {
        enrolled: response.data.enrolled,
        eventName: response.data.event_name,
        eventId: response.data.event_id,
        message: response.data.message
      }
    };
  } catch (error) {
    console.error('Error checking enrollment status:', error);
    
    // More detailed error handling
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return { 
        success: false, 
        error: error.response.data.message || 'Error checking enrollment status',
        data: { enrolled: false }
      };
    } else if (error.request) {
      // The request was made but no response was received
      return { 
        success: false, 
        error: 'No response from server',
        data: { enrolled: false }
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      return { 
        success: false, 
        error: error.message,
        data: { enrolled: false }
      };
    }
  }
};


// Add these new functions after your existing ones

/**
 * Fetch all ongoing events (events happening now)
 * @returns {Promise<Object>} Response with success status and list of ongoing events
 */
export const getAllOngoingEvents = async () => {
	try {
	  const response = await axios.get(`${APP_API_URL}events/ongoing/`);
	  return { success: true, data: response.data };
	} catch (error) {
	  console.error('Error fetching ongoing events:', error);
	  return { success: false, error: error.response?.data?.message || error.message };
	}
  };
  
  /**
   * Get ongoing events for the logged-in user
   * @returns {Promise<Object>} Response with success status and list of user's ongoing events
   */
  export const getUserOngoingEvents = async () => {
	try {
	  const response = await axios.get(`${APP_API_URL}user/events/ongoing/`);
	  return { success: true, data: response.data };
	} catch (error) {
	  console.error('Error fetching user ongoing events:', error);
	  return { success: false, error: error.response?.data?.message || error.message };
	}
  };
  
  /**
   * Get ongoing events for the host
   * @returns {Promise<Object>} Response with success status and list of host's ongoing events
   */
  export const getHostOngoingEvents = async () => {
	try {
	  const response = await axios.get(`${APP_API_URL}host/events/ongoing/`);
	  return { success: true, data: response.data };
	} catch (error) {
	  console.error('Error fetching host ongoing events:', error);
	  return { success: false, error: error.response?.data?.message || error.message };
	}
  };

  /**
 * Get upcoming events for the host
 * @returns {Promise<Object>} Response with success status and list of host's upcoming events
 */
export const getHostUpcomingEvents = async () => {
  try {
    const response = await axios.get(`${APP_API_URL}host/events/upcoming/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching host upcoming events:', error);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

/**
 * Get past events for the host
 * @returns {Promise<Object>} Response with success status and list of host's past events
 */
export const getHostPastEvents = async () => {
  try {
    const response = await axios.get(`${APP_API_URL}host/events/past/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching host past events:', error);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

/**
 * Get draft events for the host
 * @returns {Promise<Object>} Response with success status and list of host's draft events
 */
export const getHostDraftEvents = async () => {
  try {
    const response = await axios.get(`${APP_API_URL}host/events/draft/`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching host draft events:', error);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

