import axios from 'axios';
import qs from 'qs';
import Cookies from 'js-cookie';

const API_URL = 'http://127.0.0.1:8000/api/';
const APP_API_URL = 'http://127.0.0.1:8000/api/';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

export const login = async (email, password ) => {
	try{
	const data = qs.stringify({email, password});
    const response = await axios.post(`${API_URL}auth/user/login/`, data , {
	  headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
	  },
	});
	if( response.data.message ){
		return { success: false, data : response.data.message };
	}
    return { success: true, data: response.data };
    }
	catch(error){
		console.log(error)
	}

};

export const loginHost = async (email, password ) => {

	try{
	const data = qs.stringify({email, password});
    const response = await axios.post(`${API_URL}auth/host/login/`, data , {
	  headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
	  },
	});
	if( response.data.message ){
		return { success: false, data : response.data.message };
	}
    return { success: true, data: response.data };
    }
	catch(error){
		console.log(error)
	}

};


axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;
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
	  
	  if (response.data.error) {
		return {success: false, data: return_data};
	  }
	  
	  return {success: true, data: return_data};
	} catch (error) {
	  console.error('Error signing up:', error);
	  throw error;
	}
  };