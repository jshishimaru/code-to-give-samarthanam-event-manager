import axios from 'axios';

// API URLs
const API_URL = 'http://127.0.0.1:8000/api/';
const APP_API_URL = 'http://127.0.0.1:8000/api/app/';

// Configure axios defaults
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

/**
 * Get chat messages for a specific task
 * @param {number} taskId - ID of the task
 * @param {number} limit - Maximum number of messages to retrieve (default: 50)
 * @param {number} offset - Number of messages to skip (for pagination, default: 0)
 * @returns {Promise<Object>} Response containing task info and chat messages
 */
export const getTaskChatMessages = async (taskId, limit = 50, offset = 0) => {
  try {
    const response = await axios.get(`${APP_API_URL}tasks/chat/`, {
      params: {
        task_id: taskId,
        limit,
        offset
      }
    });

    // Check if the response has the expected structure
    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        data: response.data
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Invalid response format from server'
      };
    }
  } catch (error) {
    console.error('Error fetching task chat messages:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Send a chat message for a specific task
 * @param {number} taskId - ID of the task
 * @param {string} message - Message text to send
 * @returns {Promise<Object>} Response with the sent message details
 */
export const sendTaskChatMessage = async (taskId, message) => {
  try {
    // Ensure message is not empty
    if (!message || message.trim() === '') {
      return {
        success: false,
        error: 'Message cannot be empty'
      };
    }

    const response = await axios.post(`${APP_API_URL}tasks/chat/`, {
      task_id: taskId,
      message
    });

    // Check if the response has the expected structure
    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        data: response.data
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Invalid response format from server'
      };
    }
  } catch (error) {
    console.error('Error sending task chat message:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Get complete chat history for a task with filters
 * @param {number} taskId - ID of the task
 * @param {Object} filters - Optional filters for the chat history
 * @param {string} filters.fromDate - Filter messages from this date (ISO format)
 * @param {string} filters.toDate - Filter messages up to this date (ISO format)
 * @param {number} filters.userId - Filter messages from a specific user
 * @param {boolean} filters.hostOnly - Filter to only show messages from hosts
 * @param {string} filters.searchText - Search for messages containing this text
 * @param {number} filters.limit - Maximum number of messages to retrieve (default: 100)
 * @param {number} filters.offset - Number of messages to skip (for pagination, default: 0)
 * @returns {Promise<Object>} Response containing filtered chat history
 */
export const getTaskChatHistory = async (taskId, filters = {}) => {
  try {
    const {
      fromDate,
      toDate,
      userId,
      hostOnly,
      searchText,
      limit = 100,
      offset = 0
    } = filters;

    // Build query parameters
    const params = {
      task_id: taskId,
      limit,
      offset
    };

    // Add optional filters if provided
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    if (userId) params.user_id = userId;
    if (hostOnly !== undefined) params.host_only = hostOnly;
    if (searchText) params.search = searchText;

    const response = await axios.get(`${APP_API_URL}tasks/chat/history/`, { params });

    // Check if the response has the expected structure
    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        data: response.data
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Invalid response format from server'
      };
    }
  } catch (error) {
    console.error('Error fetching task chat history:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Get recent messages from all tasks that the current user is associated with
 * @param {number} limit - Maximum number of messages per task to retrieve (default: 5)
 * @returns {Promise<Object>} Response containing recent messages grouped by task
 */
export const getRecentTaskChats = async (limit = 5) => {
  try {
    const response = await axios.get(`${APP_API_URL}user/tasks/chats/recent/`, {
      params: { limit }
    });

    // Check if the response has the expected structure
    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        data: response.data
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Invalid response format from server'
      };
    }
  } catch (error) {
    console.error('Error fetching recent task chats:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Poll for new messages in a task chat since a given timestamp
 * @param {number} taskId - ID of the task
 * @param {string} since - ISO timestamp to get messages newer than this time
 * @returns {Promise<Object>} Response containing new messages
 */
export const pollNewTaskMessages = async (taskId, since) => {
  try {
    // We'll use the regular chat endpoint with a different approach
    const response = await axios.get(`${APP_API_URL}tasks/chat/`, {
      params: {
        task_id: taskId,
        // Set a large limit to ensure we get all new messages
        limit: 100,
        // Use a different parameter to filter by timestamp
        // This function assumes the backend supports the `since` parameter
        // If not, we'll need to handle filtering on the client side
        since
      }
    });

    // Check if the response has the expected structure
    if (response.data && response.data.status === 'success') {
      return {
        success: true,
        data: response.data
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Invalid response format from server'
      };
    }
  } catch (error) {
    console.error('Error polling for new task messages:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};


/**
 * Function to calculate and format time differences for chat messages
 * @param {string} timestamp - ISO timestamp to compare against current time
 * @returns {string} Formatted time difference (e.g., "just now", "5m ago")
 */
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return 'Unknown time';
  
  try {
    const messageTime = new Date(timestamp);
    const now = new Date();
    const diffMs = now - messageTime;
    const diffSec = Math.floor(diffMs / 1000);
    
    // Just now: less than a minute ago
    if (diffSec < 60) {
      return 'just now';
    }
    
    // Minutes: less than an hour ago
    if (diffSec < 3600) {
      const minutes = Math.floor(diffSec / 60);
      return `${minutes}m ago`;
    }
    
    // Hours: less than a day ago
    if (diffSec < 86400) {
      const hours = Math.floor(diffSec / 3600);
      return `${hours}h ago`;
    }
    
    // Days: less than a week ago
    if (diffSec < 604800) {
      const days = Math.floor(diffSec / 86400);
      return `${days}d ago`;
    }
    
    // For older messages, show the date
    return messageTime.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: messageTime.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } catch (error) {
    console.error('Error formatting message time:', error);
    return timestamp;
  }
};

export default {
  getTaskChatMessages,
  sendTaskChatMessage,
  getTaskChatHistory,
  getRecentTaskChats,
  pollNewTaskMessages,
  formatMessageTime
};