import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getEventChatMessages, sendEventChatMessage, formatChatMessages, groupMessagesByDate } from '../../apiservice/chat';
import { checkAuth } from '../../apiservice/auth';
import '../../styles/Event/CommunityChat.css';

const CommunityChat = ({ eventId, eventTitle }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [groupedMessages, setGroupedMessages] = useState({});
  const [lastMessageTime, setLastMessageTime] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Fetch current user info
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
          setError(t('communityChat.errors.auth'));
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
        setError(t('communityChat.errors.auth'));
      }
    };

    getUserInfo();
  }, [t]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await getEventChatMessages(eventId);
        
        if (response.success) {
          // Format messages and ensure they're sorted by timestamp (oldest first)
          const formattedMessages = formatChatMessages(response.data.messages);
          
          // Sort messages by timestamp (oldest first)
          const sortedMessages = formattedMessages.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
          );
          
          setMessages(sortedMessages);
          
          // Save the timestamp of the most recent message for polling
          if (sortedMessages.length > 0) {
            setLastMessageTime(sortedMessages[sortedMessages.length - 1].timestamp);
          }
          
          setError(null);
        } else {
          setError(response.error || t('communityChat.errors.fetchFailed'));
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError(t('communityChat.errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };

    if (eventId && currentUser) {
      fetchMessages();
    }
  }, [eventId, currentUser, t]);

  // Group messages by date whenever messages change
  useEffect(() => {
    // Create a grouped object but preserve the original chronological order
    const grouped = groupMessagesByDate(messages);
    
    // Convert to an array of [date, messages] pairs
    const groupedArray = Object.entries(grouped);
    
    // Sort the dates chronologically (oldest first)
    groupedArray.sort((a, b) => new Date(a[0]) - new Date(b[0]));
    
    // Convert back to an object but with dates in chronological order
    const orderedGrouped = Object.fromEntries(groupedArray);
    
    setGroupedMessages(orderedGrouped);
  }, [messages]);

  // Set up polling for new messages
  useEffect(() => {
    if (!eventId || !currentUser || !lastMessageTime) return;

    const pollForMessages = async () => {
      try {
        const response = await getEventChatMessages(eventId, 50, 0);
        
        if (response.success) {
          const formattedMessages = formatChatMessages(response.data.messages);
          
          // Sort messages by timestamp (oldest first)
          const sortedMessages = formattedMessages.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
          );
          
          if (sortedMessages.length > 0) {
            const lastTimestamp = sortedMessages[sortedMessages.length - 1].timestamp;
            
            // Only update if we have new messages
            if (lastTimestamp !== lastMessageTime) {
              setMessages(sortedMessages);
              setLastMessageTime(lastTimestamp);
            }
          }
        }
      } catch (err) {
        console.error('Error polling for messages:', err);
      }
    };

    // Poll every 5 seconds
    pollIntervalRef.current = setInterval(pollForMessages, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [eventId, currentUser, lastMessageTime]);

  // Scroll to bottom when messages change
  useEffect(() => {
    // Use a small timeout to ensure scrolling happens after render
    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUser) return;
    
    try {
      const response = await sendEventChatMessage(eventId, newMessage.trim());
      
      if (response.success) {
        // The server now returns the new message with is_current_user already set
        const sentMessage = response.data.message;
        
        // Format the response message for UI display
        const formattedMessage = {
          ...sentMessage,
          isCurrentUser: sentMessage.is_current_user === true,
          formattedTime: new Date(sentMessage.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          formattedDate: new Date(sentMessage.timestamp).toLocaleDateString()
        };
        
        // Append the new message at the end (newest last)
        setMessages(prev => [...prev, formattedMessage]);
        setNewMessage('');
        setLastMessageTime(sentMessage.timestamp);
      } else {
        console.error('Failed to send message:', response.error);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Helper function to get ordered dates
  const getOrderedDates = () => {
    return Object.keys(groupedMessages).sort((a, b) => new Date(a) - new Date(b));
  };

  // Render date divider
  const DateDivider = ({ date }) => (
    <div className="date-divider">
      <span className="date-text">{date}</span>
    </div>
  );

  // Render individual message
  const ChatMessage = ({ message }) => {
    const isHost = message.is_host === true;
    const messageClasses = `message ${message.isCurrentUser ? 'outgoing' : 'incoming'} ${isHost ? 'host-message' : ''}`;
    
    return (
      <div className={messageClasses}>
        <div className="message-content">
          <div className="message-header">
            <span className="sender-name">
              {message.user_name}
              {isHost && <span className="host-badge">{t('communityChat.hostBadge')}</span>}
            </span>
            <span className="message-time">{message.formattedTime}</span>
          </div>
          <p className="message-text">{message.message}</p>
        </div>
      </div>
    );
  };

  if (!currentUser) {
    return (
      <div className="community-chat auth-required">
        <div className="auth-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <p>{t('communityChat.loginRequired')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="community-chat">
      <header className="chat-header">
        <h2 className="chat-title">
          <svg className="chat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="M256 32C114.6 32 0 125.1 0 240c0 49.6 21.4 95 57 130.7C44.5 421.1 2.7 466 2.2 466.5c-2.2 2.3-2.8 5.7-1.5 8.7S4.8 480 8 480c66.3 0 116-31.8 140.6-51.4 32.7 12.3 69 19.4 107.4 19.4 141.4 0 256-93.1 256-208S397.4 32 256 32z"/>
          </svg>
          {t('communityChat.title', { event: eventTitle || t('communityChat.defaultEventTitle') })}
        </h2>
      </header>

      <div 
        ref={chatContainerRef}
        className={`chat-messages ${loading ? 'loading' : ''}`} 
        aria-live="polite"
      >
        {loading ? (
          <div className="chat-loading">
            <div className="loading-spinner"></div>
            <p>{t('communityChat.loading')}</p>
          </div>
        ) : error ? (
          <div className="chat-error" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <p>{t('communityChat.noMessages')}</p>
          </div>
        ) : (
          <div className="messages-container">
            {getOrderedDates().map(date => (
              <div key={date} className="message-group">
                <DateDivider date={date} />
                {groupedMessages[date].map((message, index) => (
                  <ChatMessage key={message.id || index} message={message} />
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} className="messages-end" />
          </div>
        )}
      </div>

      <form className="chat-input-container" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={t('communityChat.inputPlaceholder')}
          aria-label={t('communityChat.inputAriaLabel')}
          disabled={loading}
        />
        <button 
          type="submit" 
          className="send-button"
          disabled={!newMessage.trim() || loading}
          aria-label={t('communityChat.sendAriaLabel')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L277.3 424.9l-40.1 74.5c-5.2 9.7-16.3 14.6-27 11.9S192 499 192 488V392c0-5.3 1.8-10.5 5.1-14.7L362.4 164.7c2.5-7.1-6.5-14.3-13-8.4L170.4 318.2l-32 28.9 0 0c-9.2 8.3-22.3 10.6-33.8 5.8l-85-35.4C8.4 312.8 .8 302.2 .1 290s5.5-23.7 16.1-29.8l448-256c10.7-6.1 23.9-5.5 34 1.4z"/>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default CommunityChat;