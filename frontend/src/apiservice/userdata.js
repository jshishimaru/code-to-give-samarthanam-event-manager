import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/';
const APP_API_URL = 'http://127.0.0.1:8000/api/app/';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

/**
 * Download event volunteers' data as Excel file
 * This endpoint requires host authorization and returns an Excel file
 * containing volunteer information, task assignments, feedback and event summary
 * 
 * @param {number} eventId - ID of the event to export volunteers from
 * @param {string} [filename] - Optional custom filename (default: generated from event name)
 * @returns {Promise<Object>} Response with success status and blob URL for download
 */
export const downloadEventVolunteersExcel = async (eventId, filename = null) => {
  try {
    if (!eventId) {
      throw new Error('Event ID is required');
    }

    // Make API request with responseType blob to handle file download
    const response = await axios.get(`${APP_API_URL}events/export-volunteers/`, {
      params: { event_id: eventId },
      responseType: 'blob'
    });

    // Create a blob URL for the Excel file
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);

    // Create temporary link to trigger download
    const link = document.createElement('a');
    link.href = url;
    
    // Use provided filename or extract from Content-Disposition header
    if (filename) {
      link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    } else {
      // Try to get filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let extractedFilename = 'event_volunteers.xlsx';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length === 2) {
          extractedFilename = filenameMatch[1];
        }
      }
      
      link.download = extractedFilename;
    }
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);
    
    return { 
      success: true,
      message: 'Download started',
      downloadUrl: url // Note: this URL will be revoked after 100ms
    };
  } catch (error) {
    console.error('Error downloading volunteers Excel:', error);
    
    // Handle different error types
    if (error.response) {
      // Request was made and server responded with error status
      const errorMessage = error.response.data instanceof Blob
        ? 'Server error occurred while generating Excel file'
        : error.response.data.message || `Error: ${error.response.status}`;
      
      return {
        success: false,
        error: errorMessage,
        status: error.response.status
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        success: false,
        error: 'No response received from server'
      };
    } else {
      // Error setting up request
      return {
        success: false,
        error: error.message || 'An error occurred while downloading'
      };
    }
  }
};

/**
* For hosts to check if an event has volunteers who can be exported
* 
* @param {number} eventId - ID of the event to check
* @returns {Promise<Object>} Response with success status and volunteer count
*/
export const checkEventVolunteersForExport = async (eventId) => {
 try {
   if (!eventId) {
	 throw new Error('Event ID is required');
   }

   console.log("Checking volunteers for export, event ID:", eventId);

   // This endpoint doesn't exist in the backend yet, but it would be useful to add
   // Using the event details endpoint as a fallback
   const response = await axios.get(`${APP_API_URL}events/details/`, {
	 params: { event_id: eventId }
   });
   
   console.log("Event details for volunteer check:", response.data);
   
   // Try to find volunteer count in different possible response formats
   const volunteerCount = 
	 response.data.volunteer_count || 
	 response.data.volunteers?.length || 
	 response.data.event?.volunteer_count ||
	 response.data.event?.volunteers?.length ||
	 0;
   
   console.log("Detected volunteer count:", volunteerCount);
   
   return {
	 success: true,
	 data: {
	   eventId,
	   volunteerCount,
	   hasVolunteers: volunteerCount > 0,
	   canExport: true // Always allow export
	 }
   };
 } catch (error) {
   console.error('Error checking event volunteers for export:', error);
   return {
	 success: false,
	 error: error.response?.data?.message || error.message,
	 data: {
	   eventId,
	   volunteerCount: 0,
	   hasVolunteers: false,
	   canExport: true // Always allow export
	 }
   };
 }
};

/**
 * Alternative method to export volunteers using POST request
 * This is useful for cases where you need to customize the export
 * 
 * @param {number} eventId - ID of the event
 * @param {Object} options - Additional export options
 * @returns {Promise<Object>} Response with success status and blob URL
 */
export const exportEventVolunteers = async (eventId, options = {}) => {
  try {
    if (!eventId) {
      throw new Error('Event ID is required');
    }

    // Make POST request with event ID and options
    const response = await axios.post(
      `${APP_API_URL}events/export-volunteers/`,
      { event_id: eventId, ...options },
      { responseType: 'blob' }
    );

    // Create a blob URL for the Excel file
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);

    // Create temporary link to trigger download
    const link = document.createElement('a');
    link.href = url;
    
    // Use custom filename if provided in options
    if (options.filename) {
      link.download = options.filename.endsWith('.xlsx') ? 
        options.filename : `${options.filename}.xlsx`;
    } else {
      // Try to get filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let extractedFilename = 'event_volunteers.xlsx';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length === 2) {
          extractedFilename = filenameMatch[1];
        }
      }
      
      link.download = extractedFilename;
    }
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);
    
    return { 
      success: true,
      message: 'Download started',
      downloadUrl: url // Note: this URL will be revoked after 100ms
    };
  } catch (error) {
    console.error('Error exporting volunteers data:', error);
    
    // Detailed error handling
    if (error.response) {
      const errorMessage = error.response.data instanceof Blob
        ? 'Server error occurred while generating Excel file'
        : error.response.data.message || `Error: ${error.response.status}`;
      
      // For authentication/authorization errors
      if (error.response.status === 401 || error.response.status === 403) {
        return {
          success: false,
          error: 'You do not have permission to export volunteer data',
          status: error.response.status
        };
      }
      
      return {
        success: false,
        error: errorMessage,
        status: error.response.status
      };
    } else if (error.request) {
      return {
        success: false,
        error: 'No response received from server'
      };
    } else {
      return {
        success: false,
        error: error.message || 'An error occurred while downloading'
      };
    }
  }
};