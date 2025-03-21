import axios from 'axios';
import qs from 'qs';
import Cookies from 'js-cookie';

const API_URL = 'http://127.0.0.1:8000/api/';
const APP_API_URL = 'http://127.0.0.1:8000/api/app/';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

export const login = async (email, password) => {
  try {
    const data = qs.stringify({email, password});
    const response = await axios.post(`${API_URL}auth/user/login/`, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    // Check for response status instead of just message presence
    if (response.data.status === 'error') {
      return { success: false, data: response.data.message };
    }
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Login error:', error);
    
    // Improved error handling
    if (error.response) {
      // Server responded with an error status code
      return { 
        success: false, 
        data: error.response.data.message || 'Authentication failed' 
      };
    } else if (error.request) {
      // Request was made but no response received
      return { success: false, data: 'No response from server' };
    } else {
      // Something happened in setting up the request
      return { success: false, data: 'Error making request' };
    }
  }
};

export const loginHost = async (email, password) => {
  try {
    const data = qs.stringify({email, password});
    const response = await axios.post(`${API_URL}auth/host/login/`, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    // Check for response status instead of just message presence
    if (response.data.status === 'error') {
      return { success: false, data: response.data.message };
    }
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Host login error:', error);
    
    // Improved error handling
    if (error.response) {
      // Server responded with an error status code
      return { 
        success: false, 
        data: error.response.data.message || 'Authentication failed' 
      };
    } else if (error.request) {
      // Request was made but no response received
      return { success: false, data: 'No response from server' };
    } else {
      // Something happened in setting up the request
      return { success: false, data: 'Error making request' };
    }
  }
};

// The signup function is already correctly checking for error status
export const signup = async (name, password, email, contact, skills, age, location, organization) => {
  try {
    const data = qs.stringify({
      name,
      password,
      email,
      contact,
      skills,
      age,
      location,
      organization
    });
    
    const response = await axios.post(`${API_URL}auth/user/signup/`, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const return_data = {
      'status': response.data.status,
      'user_id': response.data.user_id,
      'message': response.data.message,
    }
    
    if (response.data.status === 'error') {
      return {success: false, data: return_data};
    }
    
    return {success: true, data: return_data};
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};