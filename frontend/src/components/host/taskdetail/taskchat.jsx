import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  getTaskChatMessages, 
  sendTaskChatMessage, 
  formatMessageTime 
} from '../../../apiservice/taskchat';
import { checkAuth } from '../../../apiservice/auth';
import '../../../styles/host/taskdetail/taskchat.css';
/**
 * TaskChat component for displaying and sending chat messages for a task
 * Can be used by both hosts and volunteers
 * 
 * @param {Object} props Component props
 * @param {number} props.taskId ID of the task
 * @param {string} props.taskName Name of the task (optional)
 * @param {boolean} props.isCompact Whether to show in compact mode (optional)
 * @param {number} props.messageLimit Maximum number of messages to fetch (optional)
 * @param {Function} props.onNewMessage Callback when new message is sent (optional)
 */
const TaskChat = ({ 
  taskId,
  taskName = '',
  isCompact = false,
  messageLimit = 30,
  onNewMessage = null 
}) => {
  const { t } = useTranslation();
  
  // State for messages and UI
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [taskInfo, setTaskInfo] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  
  // Refs for DOM manipulation and polling
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  
  // Fetch current user info on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const authResponse = await checkAuth();
        if (authResponse.success && authResponse.data.authenticated) {
          setCurrentUser(authResponse.data.user);
        } else {
          console.error('User not authenticated for chat');
          setError(t('taskChat.errors.notAuthenticated'));
        }
      } catch (err) {
        console.error('Error getting current user:', err);
        setError(t('taskChat.errors.authFailed'));
      }
    };
    
    getCurrentUser();
  }, [t]);
  
  // Scrolls to the bottom of the message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Fetch messages
  const fetchMessages = async () => {
	if (!taskId) return;
	
	try {
	  if (!loading) setLoading(true);
	  setError(null);
	  
	  const response = await getTaskChatMessages(taskId, messageLimit);
	  
	  if (response.success) {
		// Remove the console.log
		// Sort messages by timestamp (oldest first)
		const sortedMessages = response.data.messages?.sort((a, b) => 
		  new Date(a.timestamp) - new Date(b.timestamp)
		) || [];
		
		setMessages(sortedMessages);
		setTaskInfo(response.data.task || {});
	  } else {
		setError(response.error || t('taskChat.errors.fetchFailed'));
	  }
	} catch (err) {
	  console.error('Error fetching chat messages:', err);
	  setError(t('taskChat.errors.fetchFailed'));
	} finally {
	  setLoading(false);
	}
  };
  
  // Set up polling for new messages
  useEffect(() => {
    if (!taskId) return;
    
    // Initial fetch
    fetchMessages();
    
    pollingIntervalRef.current = setInterval(() => {
      fetchMessages();
    }, 1000);
    
    return () => {
      // Clean up on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [taskId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Handle input change
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
  };
  
  // Handle pressing Enter in the input field
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line
      handleSendMessage();
    }
  };
  
  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !taskId || sendingMessage) return;
    
    try {
      setSendingMessage(true);
      
      const response = await sendTaskChatMessage(taskId, newMessage);
      
      if (response.success) {
        // Add the new message to the list
        const sentMessage = response.data.chat_message;
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage(''); // Clear input
        
        // Call the callback if provided
        if (onNewMessage) {
          onNewMessage(sentMessage);
        }
      } else {
        setError(response.error || t('taskChat.errors.sendFailed'));
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(t('taskChat.errors.sendFailed'));
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Determine if a message is from the current user
  const isCurrentUserMessage = (message) => {
	return currentUser && message.is_current_user === true;
  };

  // Determine if a message is from a host
	const isHostMessage = (message) => {
	  return message.is_host === true;
	};
  
  // Get the sender display name
  const getSenderName = (message) => {
	if (message.is_current_user) {
	  return t('taskChat.you');
	}
	return message.user_name || t('taskChat.unknownUser');
  };;
  
  // Render a single message
  const renderMessage = (message) => {
    const isOwnMessage = isCurrentUserMessage(message);
    const isHost = isHostMessage(message);
    
    const messageClasses = `chat-message ${isOwnMessage ? 'own-message' : ''} ${isHost ? 'host-message' : ''}`;
    
    return (
      <div key={message.id} className={messageClasses}>
        <div className="message-content">
          <div className="message-header">
            <span className="sender-name">
              {getSenderName(message)}
              {isHost && <span className="host-badge">{t('taskChat.host')}</span>}
            </span>
            <span className="message-time">{formatMessageTime(message.timestamp)}</span>
          </div>
          <div className="message-text">{message.text || message.message}</div>
        </div>
      </div>
    );
  };
  
  return (
    <div className={`task-chat ${isCompact ? 'compact' : ''}`}>
      <div className="chat-header">
        <h3>{taskName || taskInfo.task_name || t('taskChat.title')}</h3>
      </div>
      
      <div className="chat-messages" ref={messageListRef}>
        {loading && messages.length === 0 ? (
          <div className="chat-loading">{t('taskChat.loading')}</div>
        ) : error ? (
          <div className="chat-error">{error}</div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">{t('taskChat.noMessages')}</div>
        ) : (
          <>
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <div className="chat-input-container">
        <textarea
          className="chat-input"
          value={newMessage}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={t('taskChat.inputPlaceholder')}
          disabled={sendingMessage}
          rows={1}
          aria-label={t('taskChat.inputAriaLabel')}
        />
        <button 
          className="send-button"
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sendingMessage}
          aria-label={t('taskChat.sendAriaLabel')}
        >
          {sendingMessage ? (
            <span className="sending-spinner"></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default TaskChat;