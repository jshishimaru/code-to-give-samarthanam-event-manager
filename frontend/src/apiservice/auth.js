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
// Update the signup function to better handle error responses
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
	  
	  // Check status in the response
	  if (response.data.status === 'error') {
		return {
		  success: false, 
		  data: {
			message: response.data.message,
			status: response.status
		  }
		};
	  }
	  
	  return {
		success: true, 
		data: {
		  user_id: response.data.user_id,
		  message: response.data.message,
		  status: response.data.status
		}
	  };
	} catch (error) {
	  console.error('Error signing up:', error);
	  
	  // Extract and structure the error information for better handling in the UI
	  if (error.response) {
		// The server responded with an error status code
		return {
		  success: false,
		  data: {
			message: error.response.data.message || "Server error. Please try again.",
			status: error.response.status
		  }
		};
	  } else if (error.request) {
		// The request was made but no response was received
		return {
		  success: false,
		  data: {
			message: "No response from server. Please check your connection.",
			status: 0
		  }
		};
	  } else {
		// Something happened in setting up the request
		return {
		  success: false,
		  data: {
			message: error.message || "Request failed. Please try again.",
			status: 0
		  }
		};
	  }
	}
  };

/**
 * Check if the user is authenticated
 * @returns {Promise<Object>} Object with success status and authentication information
 */
export const isAuthenticated = async () => {
  try {
    const response = await axios.get(`${API_URL}auth/is-authenticated/`);
    
    return { 
      success: true, 
      data: {
        isAuthenticated: response.data.isAuthenticated,
        user: response.data.user || null
      }
    };
  } catch (error) {
    console.error('Authentication check error:', error);
    
    // Handle network errors
    return { 
      success: false, 
      data: { 
        isAuthenticated: false,
        message: 'Could not verify authentication status'
      }
    };
  }
}

/**
 * Check authentication status using the auth/check endpoint
 * @returns {Promise<Object>} Object with success status and authentication information
 */
export const checkAuth = async () => {
  try {
    const response = await axios.get(`${API_URL}auth/check/`);
    
    return {
      success: true,
      data: {
        authenticated: response.data.authenticated,
        user: response.data.user || null,
        message: response.data.message || 'Authentication successful'
      }
    };
  } catch (error) {
    console.error('Authentication check error:', error);
    
    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return {
        success: false,
        data: {
          authenticated: false,
          message: error.response.data.message || 'Authentication failed',
          status: error.response.status
        }
      };
    } else if (error.request) {
      // The request was made but no response was received
      return {
        success: false,
        data: {
          authenticated: false,
          message: 'No response from authentication server'
        }
      };
    } else { 	
      // Something happened in setting up the request that triggered an Error
      return {
        success: false,
        data: {
          authenticated: false,
          message: 'Error checking authentication'
        }
      };
    }
  }
};