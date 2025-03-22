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
	console.log(response.data);
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