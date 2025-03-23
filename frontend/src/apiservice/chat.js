import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/';
const APP_API_URL = 'http://127.0.0.1:8000/api/app/';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

/**
 * Gets the most recent chat messages for a specific event
 * @param {number} eventId - The ID of the event to fetch chat messages for
 * @param {number} limit - Maximum number of messages to fetch (default: 50)
 * @param {number} offset - Number of messages to skip (for pagination) (default: 0)
 * @returns {Promise<Object>} Response with success status and chat messages
 */
export const getEventChatMessages = async (eventId, limit = 50, offset = 0) => {
  try {
    const response = await axios.get(`${APP_API_URL}events/chat/`, {
      params: { 
        event_id: eventId,
        limit,
        offset
      }
    });
    
    return { 
      success: true, 
      data: {
        messages: response.data.messages || [],
        eventId: response.data.event_id,
        eventName: response.data.event_name,
        count: response.data.count || 0,
        hasMore: response.data.has_more || false
      }
    };
  } catch (error) {
    console.error('Error fetching event chat messages:', error);
    
    // Handle various error cases
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const errorMessage = error.response.data.message || 'Failed to fetch chat messages';
      return { 
        success: false, 
        error: errorMessage,
        status: error.response.status
      };
    } else if (error.request) {
      // The request was made but no response was received
      return { 
        success: false, 
        error: 'No response from server. Please check your internet connection.'
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
};

/**
 * Sends a new chat message for a specific event
 * @param {number} eventId - The ID of the event to send the message to
 * @param {string} message - The chat message text
 * @returns {Promise<Object>} Response with success status and the sent message
 */
export const sendEventChatMessage = async (eventId, message) => {
  try {
    const response = await axios.post(`${APP_API_URL}events/chat/`, {
      event_id: eventId,
      message
    });
    
    // The server now returns the complete message data including is_current_user flag
    return { 
      success: true, 
      data: {
        message: response.data.chat_message || {},
        status: response.data.status
      }
    };
  } catch (error) {
    console.error('Error sending event chat message:', error);
    
    if (error.response) {
      const errorMessage = error.response.data.message || 'Failed to send chat message';
      return { 
        success: false, 
        error: errorMessage,
        status: error.response.status
      };
    } else if (error.request) {
      return { 
        success: false, 
        error: 'No response from server. Please check your internet connection.'
      };
    } else {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
};

/**
 * Gets the full chat history for a specific event with filtering options
 * @param {number} eventId - The ID of the event to fetch chat history for
 * @param {Object} filters - Optional filters for the chat history
 * @param {string} filters.fromDate - Start date for filtering messages (ISO format)
 * @param {string} filters.toDate - End date for filtering messages (ISO format)
 * @param {number} filters.userId - Filter messages by a specific user
 * @param {boolean} filters.hostOnly - Filter messages to show only host messages
 * @param {string} filters.search - Search text to filter messages containing this text
 * @param {number} filters.limit - Maximum number of messages to fetch (default: 100)
 * @param {number} filters.offset - Number of messages to skip (for pagination) (default: 0)
 * @returns {Promise<Object>} Response with success status and filtered chat history
 */
export const getEventChatHistory = async (eventId, filters = {}) => {
  try {
    const {
      fromDate,
      toDate,
      userId,
      hostOnly,
      search,
      limit = 100,
      offset = 0
    } = filters;
    
    // Build query parameters
    const params = { event_id: eventId, limit, offset };
    
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    if (userId) params.user_id = userId;
    if (hostOnly !== undefined) params.host_only = hostOnly;
    if (search) params.search = search;
    
    const response = await axios.get(`${APP_API_URL}events/chat/history/`, { params });
    
    return { 
      success: true, 
      data: {
        messages: response.data.messages || [],
        eventId: response.data.event_id,
        eventName: response.data.event_name,
        totalCount: response.data.total_count || 0,
        returnedCount: response.data.returned_count || 0,
        hasMore: response.data.has_more || false
      }
    };
  } catch (error) {
    console.error('Error fetching event chat history:', error);
    
    if (error.response) {
      const errorMessage = error.response.data.message || 'Failed to fetch chat history';
      return { 
        success: false, 
        error: errorMessage,
        status: error.response.status
      };
    } else if (error.request) {
      return { 
        success: false, 
        error: 'No response from server. Please check your internet connection.'
      };
    } else {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
};

/**
 * Gets recent chat messages across all events the user is part of
 * @param {number} limit - Maximum number of messages to fetch per event (default: 5)
 * @returns {Promise<Object>} Response with success status and recent chats from all events
 */
export const getRecentEventChats = async (limit = 5) => {
  try {
    const response = await axios.get(`${APP_API_URL}user/chats/recent/`, {
      params: { limit }
    });
    
    return { 
      success: true, 
      data: {
        events: response.data.events || [],
        eventCount: response.data.event_count || 0
      }
    };
  } catch (error) {
    console.error('Error fetching recent event chats:', error);
    
    if (error.response) {
      const errorMessage = error.response.data.message || 'Failed to fetch recent chats';
      return { 
        success: false, 
        error: errorMessage,
        status: error.response.status
      };
    } else if (error.request) {
      return { 
        success: false, 
        error: 'No response from server. Please check your internet connection.'
      };
    } else {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
};

/**
 * Polls for new chat messages since a given timestamp
 * @param {number} eventId - The ID of the event to check for new messages
 * @param {string} lastTimestamp - ISO timestamp of the most recent message the client has
 * @returns {Promise<Object>} Response with success status and any new messages
 */
export const pollForNewMessages = async (eventId, lastTimestamp) => {
  try {
    const response = await axios.get(`${APP_API_URL}events/chat/`, {
      params: { 
        event_id: eventId,
        since: lastTimestamp
      }
    });
    
    return { 
      success: true, 
      data: {
        messages: response.data.messages || [],
        eventId: response.data.event_id,
        eventName: response.data.event_name,
        count: response.data.count || 0
      }
    };
  } catch (error) {
    console.error('Error polling for new messages:', error);
    
    if (error.response) {
      const errorMessage = error.response.data.message || 'Failed to poll for new messages';
      return { 
        success: false, 
        error: errorMessage,
        status: error.response.status
      };
    } else if (error.request) {
      return { 
        success: false, 
        error: 'No response from server. Please check your internet connection.'
      };
    } else {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
};

/**
 * Helper function to format chat messages for display
 * @param {Array} messages - Raw chat messages from the API
 * @returns {Array} Formatted messages with additional display properties
 */
export const formatChatMessages = (messages) => {
  if (!messages || !Array.isArray(messages)) {
    return [];
  }
  
  return messages.map(msg => {
    // Now we can directly use is_current_user from the server
    const isCurrentUser = msg.is_current_user === true;
    
    return {
      ...msg,
      isCurrentUser,
      formattedTime: new Date(msg.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      formattedDate: new Date(msg.timestamp).toLocaleDateString()
    };
  });
};

/**
 * Helper function to group chat messages by date
 * @param {Array} messages - Formatted chat messages 
 * @returns {Object} Messages grouped by date
 */
export const groupMessagesByDate = (messages) => {
  if (!messages || !Array.isArray(messages)) {
    return {};
  }
  
  return messages.reduce((groups, message) => {
    const date = message.formattedDate;
    
    if (!groups[date]) {
      groups[date] = [];
    }
    
    groups[date].push(message);
    return groups;
  }, {});
};