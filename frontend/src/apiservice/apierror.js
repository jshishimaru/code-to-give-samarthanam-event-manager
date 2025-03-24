/**
 * Handle API errors in a consistent way
 * @param {Error} error The error object from Axios
 * @param {string} defaultMessage Default message to show if no specific error is found
 * @returns {Object} Standardized error response
 */
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
	console.error('API Error:', error);
	
	let errorMessage = defaultMessage;
	let statusCode = null;
	
	if (error.response) {
	  // The server responded with an error status
	  statusCode = error.response.status;
	  
	  // Try to extract the error message from the response data
	  if (error.response.data) {
		if (error.response.data.message) {
		  errorMessage = error.response.data.message;
		} else if (error.response.data.error) {
		  errorMessage = error.response.data.error;
		} else if (typeof error.response.data === 'string') {
		  errorMessage = error.response.data;
		}
	  }
	} else if (error.request) {
	  // The request was made but no response was received
	  errorMessage = 'No response received from server. Please check your connection.';
	} else {
	  // Something happened in setting up the request
	  errorMessage = error.message || defaultMessage;
	}
	
	return {
	  success: false,
	  error: errorMessage,
	  statusCode: statusCode
	};
  };