import axios from 'axios';
import qs from 'qs';

const API_URL = 'http://127.0.0.1:8000/api/';
const APP_API_URL = 'http://127.0.0.1:8000/api/app/';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;


// returns a list of event_ids
export const allUpcomingEvents = async () => {
    try{
    const response = await axios.get(`${APP_API_URL}events/upcoming/`);
    return { success: true, data: response.data };
    }
    catch(error){
        console.log(error)
        return { success: false, error: error.message };
    }
}


// Get user enrolled events
// returns a list of event_ids
export const getUserEnrolledEvents = async (userId) => {
  try {
    const response = await axios.get(`${APP_API_URL}user/events/enrolled/`, {
      params: { user_id: userId }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.log(error);
    return { success: false, error: error.message };
  }
};

// Get user past events
// returns a list of event_ids
export const getUserPastEvents = async (userId) => {
  try {
    const response = await axios.get(`${APP_API_URL}user/events/past/`, {
      params: { user_id: userId }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.log(error);
    return { success: false, error: error.message };
  }
};

// Get user upcoming events
// returns a list of event_ids
export const getUserUpcomingEvents = async (userId) => {
  try {
    const response = await axios.get(`${APP_API_URL}user/events/upcoming/`, {
      params: { user_id: userId }
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.log(error);
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
    console.log(error);
    return { success: false, error: error.message };
  }
};

// Enroll user in event
export const enrollUserInEvent = async (eventId, userId) => {
  try {
    const response = await axios.post(`${APP_API_URL}events/enroll/`, {
      event_id: eventId,
      user_id: userId
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.log(error);
    return { success: false, error: error.message };
  }
};

// Update event
export const updateEvent = async (eventData) => {
  try {
    // Use FormData if there are files to upload
    let formData = new FormData();
    
    // Add all event data to the formData
    Object.keys(eventData).forEach(key => {
      if (key === 'image' && eventData[key] instanceof File) {
        formData.append(key, eventData[key]);
      } else {
        formData.append(key, eventData[key]);
      }
    });
    
    const response = await axios.post(`${APP_API_URL}events/update/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    console.log(error);
    return { success: false, error: error.message };
  }
};

// Create event
export const createEvent = async (eventData) => {
  try {
    // Use FormData to handle file uploads
    let formData = new FormData();
    
    // Add all event data to the formData
    Object.keys(eventData).forEach(key => {
      if (key === 'image' && eventData[key] instanceof File) {
        formData.append(key, eventData[key]);
      } else {
        formData.append(key, eventData[key]);
      }
    });
    
    const response = await axios.post(`${APP_API_URL}events/create/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    console.log(error);
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
	  const response = await axios.get(`${APP_API_URL}events/check-enrollment/`, {
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

  