import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  getTaskChatMessages, 
  sendTaskChatMessage, 
  formatMessageTime 
} from '../../apiservice/taskchat';
import { checkAuth } from '../../apiservice/auth';
import '../../styles/Event/TaskChat.css';

const TaskChat = ({ taskId, eventId }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingPoller, setLoadingPoller] = useState(false);
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Get current user
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const response = await checkAuth();
        if (response.success && response.data.authenticated) {
          setCurrentUser({
            id: response.data.user.id,
            name: response.data.user.name || response.data.user.username,
            email: response.data.user.email,
            isHost: response.data.user.is_event_host || false
          });
        } else {
          setError(t('taskChat.errors.auth'));
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
        setError(t('taskChat.errors.auth'));
      }
    };

    getUserInfo();
  }, [t]);

  // Load initial messages when component mounts
  useEffect(() => {
    const fetchMessages = async () => {
      if (!taskId || !currentUser) return;
      
      try {
        setLoading(true);
        const response = await getTaskChatMessages(taskId, limit, 0);
        
        if (response.success) {
          setMessages(response.data.messages.reverse()); // Reverse to show oldest first
          setHasMore(response.data.has_more);
          setOffset(limit);
          setError(null);
        } else {
          console.error('Failed to fetch task chat messages:', response);
          setError(response.error || t('taskChat.errors.fetchFailed'));
        }
      } catch (err) {
        console.error('Error fetching task chat messages:', err);
        setError(t('taskChat.errors.fetchFailed'));
      } finally {
        setLoading(false);
        
        // Scroll to bottom after messages load
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    };

    fetchMessages();
    
    // Start polling for new messages
    startPolling();
    
    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [taskId, currentUser, t]);

  // Start polling for new messages
  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Poll every 10 seconds
    pollingIntervalRef.current = setInterval(async () => {
      if (!taskId || !currentUser || messages.length === 0) return;
      
      try {
        setLoadingPoller(true);
        
        // Get the timestamp of the most recent message
        const latestTimestamp = messages[messages.length - 1]?.timestamp;
        
        if (latestTimestamp) {
          const response = await pollNewMessages(latestTimestamp);
          if (response.success && response.data.messages.length > 0) {
            // Add new messages
            setMessages(prevMessages => [
              ...prevMessages,
              ...response.data.messages.reverse()
            ]);
            
            // Scroll to bottom if user was already at bottom
            if (isUserAtBottom()) {
              setTimeout(() => scrollToBottom(), 100);
            }
          }
        }
      } catch (err) {
        console.error('Error polling for new messages:', err);
      } finally {
        setLoadingPoller(false);
      }
    }, 10000); // Poll every 10 seconds
  };

  // Poll for new messages
  const pollNewMessages = async (since) => {
    try {
      // Get the latest messages (we'll handle filtering by timestamp here)
      const response = await getTaskChatMessages(taskId, 20, 0);
      
      if (response.success) {
        // Filter to only include messages newer than the provided timestamp
        const sinceDate = new Date(since);
        const newMessages = response.data.messages.filter(msg => {
          const msgDate = new Date(msg.timestamp);
          return msgDate > sinceDate;
        });
        
        return {
          success: true,
          data: {
            messages: newMessages
          }
        };
      }
      
      return response;
    } catch (error) {
      console.error('Error polling for new messages:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  // Check if user is at the bottom of the message list
  const isUserAtBottom = () => {
    if (!messageListRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
    const scrollPosition = Math.abs(scrollHeight - scrollTop - clientHeight);
    
    // Consider "at bottom" if within 100px of actual bottom
    return scrollPosition < 100;
  };

  // Scroll to the bottom of the chat
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Load more (older) messages
  const handleLoadMore = async () => {
    if (!taskId || !currentUser || loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      
      const response = await getTaskChatMessages(taskId, limit, offset);
      
      if (response.success) {
        // Preserve scroll position
        const scrollContainer = messageListRef.current;
        const scrollPosition = scrollContainer.scrollHeight - scrollContainer.scrollTop;
        
        // Add older messages to the beginning
        setMessages(prevMessages => [
          ...response.data.messages.reverse(),
          ...prevMessages
        ]);
        
        setHasMore(response.data.has_more);
        setOffset(prevOffset => prevOffset + limit);
        
        // Restore scroll position
        setTimeout(() => {
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight - scrollPosition;
          }
        }, 100);
      } else {
        console.error('Failed to fetch more messages:', response);
        setError(response.error || t('taskChat.errors.loadMoreFailed'));
      }
    } catch (err) {
      console.error('Error fetching more messages:', err);
      setError(t('taskChat.errors.loadMoreFailed'));
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !taskId || !currentUser || sending) return;
    
    try {
      setSending(true);
      
      const response = await sendTaskChatMessage(taskId, newMessage);
      
      if (response.success) {
        // Add the new message to the messages list
        const chatMessage = response.data.chat_message;
        setMessages(prevMessages => [...prevMessages, chatMessage]);
        
        // Clear the input field
        setNewMessage('');
        
        // Scroll to bottom
        setTimeout(() => scrollToBottom(), 100);
      } else {
        console.error('Failed to send message:', response);
        setError(response.error || t('taskChat.errors.sendFailed'));
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(t('taskChat.errors.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
  };

  // Handle input keypress (send on Enter)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (loading) {
    return (
      <div className="task-chat-loading">
        <div className="loading-spinner"></div>
        <p>{t('taskChat.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="task-chat-error">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>{error}</p>
        <button 
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          {t('taskChat.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="task-chat">
      <header className="task-chat-header">
        <h2>{t('taskChat.title')}</h2>
      </header>
      
      <div className="task-chat-messages" ref={messageListRef}>
        {hasMore && (
          <div className="load-more-container">
            <button 
              className="load-more-button"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <div className="button-spinner"></div>
                  {t('taskChat.loadingMore')}
                </>
              ) : t('taskChat.loadMore')}
            </button>
          </div>
        )}
        
        {messages.length === 0 ? (
          <div className="no-messages">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <p>{t('taskChat.noMessages')}</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message.user.id === currentUser?.id;
            const isHost = message.user.is_host;
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
            
            // Check if this message is from the same user as the previous one
            // and if they were sent close in time (within 2 minutes)
            const isSameGroupAsPrev = prevMessage && 
              prevMessage.user.id === message.user.id &&
              (new Date(message.timestamp) - new Date(prevMessage.timestamp)) < 120000;
            
            // Check if this message is from the same user as the next one
            const isSameGroupAsNext = nextMessage && 
              nextMessage.user.id === message.user.id &&
              (new Date(nextMessage.timestamp) - new Date(message.timestamp)) < 120000;
            
            const timeAgo = formatMessageTime(message.timestamp);
            
            return (
              <div 
                key={message.id} 
                className={`message-container ${isCurrentUser ? 'current-user' : ''} ${isHost ? 'host-message' : ''}`}
              >
                <div className={`message ${isSameGroupAsPrev ? 'same-group' : ''}`}>
                  {/* Only show sender info if this is the first message in a group */}
                  {!isSameGroupAsPrev && (
                    <div className="message-sender">
                      <span className="sender-name">
                        {isCurrentUser ? `${message.user.name} (${t('taskChat.you')})` : message.user.name}
                      </span>
                      {isHost && (
                        <span className="host-badge">{t('taskChat.host')}</span>
                      )}
                    </div>
                  )}
                  
                  <div className={`message-content ${isSameGroupAsPrev ? 'continued' : ''} ${isSameGroupAsNext ? 'continues' : ''}`}>
                    <p>{message.text}</p>
                    <span className="message-time">{timeAgo}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {loadingPoller && (
          <div className="loading-more-indicator">
            <div className="loading-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form className="task-chat-input" onSubmit={handleSendMessage}>
        <textarea
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={t('taskChat.messagePlaceholder')}
          disabled={sending}
          rows={1}
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim() || sending}
          className={sending ? 'sending' : ''}
        >
          {sending ? (
            <div className="button-spinner"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default TaskChat;