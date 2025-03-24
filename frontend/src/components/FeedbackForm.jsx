import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  checkFeedbackEligibility, 
  getFeedbackDetails, 
  submitFeedback 
} from '../apiservice/feedback.js';
import { getEventDetails } from '../apiservice/event';
import { checkAuth } from '../apiservice/auth';
import '../styles/Event/feedback.css';

const FeedbackForm = () => {
  const { t } = useTranslation();
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  // States for managing component behavior
  const [isEligible, setIsEligible] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [ineligibilityReason, setIneligibilityReason] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventData, setEventData] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Form data state
  const [feedbackData, setFeedbackData] = useState({
    event_id: eventId,
    overall_experience: 5,
    organization_quality: 5,
    communication: 5,
    host_interaction: 5,
    volunteer_support: 5,
    task_clarity: 5,
    impact_awareness: 5,
    inclusivity: 5,
    time_management: 5,
    recognition: 5,
    strengths: '',
    improvements: '',
    additional_comments: '',
    would_volunteer_again: true
  });

  // Check if user is authenticated
  useEffect(() => {
    const checkUserAuthentication = async () => {
      try {
        const response = await checkAuth();
        if (response.success && response.data.authenticated){
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setError(t('feedback.errors.authRequired'));
          // Redirect to login after a short delay
          setTimeout(() => {
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
            navigate('/login');
          }, 3000);
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        setIsAuthenticated(false);
        setError(t('feedback.errors.authFailed'));
      }
    };

    checkUserAuthentication();
  }, [navigate, t]);

  // Fetch event details to get the name
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;
      
      try {
        const response = await getEventDetails(eventId);
        if (response.success){
          const event = response.data.event;
          console.log("Event data retrieved:", event); // Debug log to check the data
          setEventData(event);
          
          // Extract event title - be explicit about which properties to check
          let eventTitle = "Event";
          if (event.title) {
            eventTitle = event.title;
          } else if (event.event_name) {
            eventTitle = event.event_name;
          } else if (event.name) {
            eventTitle = event.name;
          }
          
          console.log("Setting event name to:", eventTitle); // Debug log
          setEventName(eventTitle);
          document.title = `${t('feedback.pageTitle')} - ${eventTitle}`;
        } else {
          console.error('Failed to fetch event details:', response.error);
          setError(t('feedback.errors.eventLoadFailed'));
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError(t('feedback.errors.eventLoadFailed'));
      }
    };

    fetchEventDetails();
    
    return () => {
      document.title = 'Samarthanam Event Manager';
    };
  }, [eventId, t]);

  // Check eligibility when component mounts and user is authenticated
  useEffect(() => {
    const checkEligibility = async () => {
      if (!isAuthenticated || !eventId) return;
      
      try {
        const response = await checkFeedbackEligibility(eventId);
        
        if (response.success) {
          setIsEligible(response.data.eligible);
          if (!response.data.eligible) {
            setIneligibilityReason(response.data.reason || t('feedback.errors.notEligible'));
            
            // If user already submitted feedback, fetch and display it
            if (response.data.existing_feedback_id) {
              fetchExistingFeedback(response.data.existing_feedback_id);
            }
          }
        } else {
          setError(response.error || t('feedback.errors.eligibilityCheckFailed'));
        }
      } catch (err) {
        console.error('Error checking feedback eligibility:', err);
        setError(t('feedback.errors.generalError'));
      } finally {
        setEligibilityChecked(true);
      }
    };

    // Function to fetch existing feedback details when an ID is available
    const fetchExistingFeedback = async (feedbackId) => {
      try {
        const feedbackResponse = await getFeedbackDetails(feedbackId);
        
        if (feedbackResponse.success) {
          setExistingFeedback(feedbackResponse.data.feedback);
        } else {
          console.error('Failed to fetch existing feedback:', feedbackResponse.error);
        }
      } catch (err) {
        console.error('Error fetching existing feedback:', err);
      }
    };

    if (isAuthenticated && eventId) {
      checkEligibility();
    }
  }, [eventId, t, isAuthenticated]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Handle rating changes
  const handleRatingChange = (field, value) => {
    setFeedbackData({
      ...feedbackData,
      [field]: parseInt(value, 10)
    });
  };

  // Handle text input changes
  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFeedbackData({
      ...feedbackData,
      [name]: value
    });
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFeedbackData({
      ...feedbackData,
      [name]: checked
    });
  };

  // Submit feedback
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await submitFeedback(feedbackData);
      
      if (response.success) {
        setSubmitSuccess(true);
        setExistingFeedback(response.data.feedback);
        setIsEligible(false); // Can't submit again
        setIneligibilityReason(t('feedback.alreadySubmitted'));
      } else {
        setError(response.error || t('feedback.errors.submissionFailed'));
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(t('feedback.errors.generalError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Return to events page
  const handleBackToEvents = () => {
    navigate('/events');
  };

  // Render rating question with stars
  const renderRatingQuestion = (field, label, description) => {
    return (
      <div className="feedback-rating-question">
        <label htmlFor={field} className="feedback-label">
          {label}
          {description && <span className="feedback-label-description">{description}</span>}
        </label>
        <div className="rating-stars" role="radiogroup" aria-labelledby={`${field}-label`}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
            <React.Fragment key={rating}>
              <input
                type="radio"
                name={field}
                id={`${field}-${rating}`}
                value={rating}
                checked={feedbackData[field] === rating}
                onChange={() => handleRatingChange(field, rating)}
                className="star-input"
                aria-label={`${rating} ${t('feedback.stars')}`}
              />
              <label
                htmlFor={`${field}-${rating}`}
                className={`star-label ${feedbackData[field] >= rating ? 'active' : ''}`}
                aria-hidden="true"
              >
                ★
              </label>
            </React.Fragment>
          ))}
          <span className="rating-value" aria-hidden="true">
            {feedbackData[field]}/10
          </span>
        </div>
      </div>
    );
  };

  // Loading state for authentication check
  if (!isAuthenticated) {
    return (
      <div className="feedback-container feedback-loading">
        <p aria-live="polite">{t('feedback.authChecking')}</p>
      </div>
    );
  }

  // Loading state for eligibility check
  if (!eligibilityChecked || !eventData) {
    return (
      <div className="feedback-container feedback-loading">
        <p aria-live="polite">{t('feedback.loading')}</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="feedback-container feedback-error" role="alert">
        <header className="feedback-header">
          <button className="back-button" onClick={handleBackToEvents}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            {t('feedback.backToEvents')}
          </button>
        </header>
        <h2 className="feedback-title">{t('feedback.errorTitle')}</h2>
        <p>{error}</p>
      </div>
    );
  }

  // If user has already submitted feedback, show the existing feedback
  if (existingFeedback) {
	return (
	  <div className="feedback-container feedback-submitted">
		<header className="feedback-header">
		  <button className="back-button" onClick={handleBackToEvents}>
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			  <line x1="19" y1="12" x2="5" y2="12"></line>
			  <polyline points="12 19 5 12 12 5"></polyline>
			</svg>
			{t('feedback.backToEvents')}
		  </button>
		  <h2 className="feedback-title">{t('feedback.viewFeedbackTitle')}</h2>
		  {/* Use direct string interpolation instead of translation with parameters */}
		  <p className="feedback-subtitle">
			{`${t('feedback.yourFeedbackFor')} ${eventName}`}
		  </p>
		</header>
		
		<div className="feedback-summary">
		  <div className="feedback-event-info">
			<h3>{eventName}</h3>
			{eventData && eventData.start_time && (
			  <p className="event-date">
				{formatDate(eventData.start_time)}
			  </p>
			)}
		  </div>
          
          <div className="feedback-ratings-overview">
            <h3>{t('feedback.ratingsOverview')}</h3>
            <div className="ratings-grid">
              <div className="rating-item">
                <span className="rating-label">{t('feedback.fields.overallExperience')}</span>
                <span className="rating-value">{existingFeedback.overall_experience}/10</span>
                <div className="rating-bar">
                  <div 
                    className="rating-fill" 
                    style={{ width: `${existingFeedback.overall_experience * 10}%` }}
                    aria-hidden="true"
                  ></div>
                </div>
              </div>
              
              <div className="rating-item">
                <span className="rating-label">{t('feedback.fields.organizationQuality')}</span>
                <span className="rating-value">{existingFeedback.organization_quality}/10</span>
                <div className="rating-bar">
                  <div 
                    className="rating-fill" 
                    style={{ width: `${existingFeedback.organization_quality * 10}%` }}
                    aria-hidden="true"
                  ></div>
                </div>
              </div>
              
              <div className="rating-item">
                <span className="rating-label">{t('feedback.fields.communication')}</span>
                <span className="rating-value">{existingFeedback.communication}/10</span>
                <div className="rating-bar">
                  <div 
                    className="rating-fill" 
                    style={{ width: `${existingFeedback.communication * 10}%` }}
                    aria-hidden="true"
                  ></div>
                </div>
              </div>
              
              <div className="rating-item">
                <span className="rating-label">{t('feedback.fields.hostInteraction')}</span>
                <span className="rating-value">{existingFeedback.host_interaction}/10</span>
                <div className="rating-bar">
                  <div 
                    className="rating-fill" 
                    style={{ width: `${existingFeedback.host_interaction * 10}%` }}
                    aria-hidden="true"
                  ></div>
                </div>
              </div>
              
              <div className="rating-item">
                <span className="rating-label">{t('feedback.fields.volunteerSupport')}</span>
                <span className="rating-value">{existingFeedback.volunteer_support}/10</span>
                <div className="rating-bar">
                  <div 
                    className="rating-fill" 
                    style={{ width: `${existingFeedback.volunteer_support * 10}%` }}
                    aria-hidden="true"
                  ></div>
                </div>
              </div>
              
              <div className="rating-item">
                <span className="rating-label">{t('feedback.fields.taskClarity')}</span>
                <span className="rating-value">{existingFeedback.task_clarity}/10</span>
                <div className="rating-bar">
                  <div 
                    className="rating-fill" 
                    style={{ width: `${existingFeedback.task_clarity * 10}%` }}
                    aria-hidden="true"
                  ></div>
                </div>
              </div>
              
              <div className="rating-item">
                <span className="rating-label">{t('feedback.fields.impactAwareness')}</span>
                <span className="rating-value">{existingFeedback.impact_awareness}/10</span>
                <div className="rating-bar">
                  <div 
                    className="rating-fill" 
                    style={{ width: `${existingFeedback.impact_awareness * 10}%` }}
                    aria-hidden="true"
                  ></div>
                </div>
              </div>
              
              <div className="rating-item">
                <span className="rating-label">{t('feedback.fields.inclusivity')}</span>
                <span className="rating-value">{existingFeedback.inclusivity}/10</span>
                <div className="rating-bar">
                  <div 
                    className="rating-fill" 
                    style={{ width: `${existingFeedback.inclusivity * 10}%` }}
                    aria-hidden="true"
                  ></div>
                </div>
              </div>
              
              <div className="rating-item">
                <span className="rating-label">{t('feedback.fields.timeManagement')}</span>
                <span className="rating-value">{existingFeedback.time_management}/10</span>
                <div className="rating-bar">
                  <div 
                    className="rating-fill" 
                    style={{ width: `${existingFeedback.time_management * 10}%` }}
                    aria-hidden="true"
                  ></div>
                </div>
              </div>
              
              <div className="rating-item">
                <span className="rating-label">{t('feedback.fields.recognition')}</span>
                <span className="rating-value">{existingFeedback.recognition}/10</span>
                <div className="rating-bar">
                  <div 
                    className="rating-fill" 
                    style={{ width: `${existingFeedback.recognition * 10}%` }}
                    aria-hidden="true"
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {existingFeedback.strengths && (
            <div className="feedback-text-response">
              <h3>{t('feedback.fields.strengths')}</h3>
              <p>{existingFeedback.strengths}</p>
            </div>
          )}
          
          {existingFeedback.improvements && (
            <div className="feedback-text-response">
              <h3>{t('feedback.fields.improvements')}</h3>
              <p>{existingFeedback.improvements}</p>
            </div>
          )}
          
          {existingFeedback.additional_comments && (
            <div className="feedback-text-response">
              <h3>{t('feedback.fields.additionalComments')}</h3>
              <p>{existingFeedback.additional_comments}</p>
            </div>
          )}
          
          <div className="feedback-volunteer-again">
            <h3>{t('feedback.fields.wouldVolunteerAgain')}</h3>
            <p>
              {existingFeedback.would_volunteer_again 
                ? t('feedback.wouldVolunteerAgainYes') 
                : t('feedback.wouldVolunteerAgainNo')
              }
            </p>
          </div>
          
		  {existingFeedback.created_at && (
			  <div className="feedback-submission-date">
			    <p>
			      {t('feedback.submittedOn')} {formatDate(existingFeedback.created_at)}
			    </p>
			  </div>
			)}
          
          <div className="feedback-actions">
            <button 
              className="back-to-event-btn"
              onClick={handleBackToEvents}
            >
              {t('feedback.backToEventsButton')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user is not eligible, show reason
  if (!isEligible) {
    return (
      <div className="feedback-container feedback-not-eligible">
        <header className="feedback-header">
          <button className="back-button" onClick={handleBackToEvents}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            {t('feedback.backToEvents')}
          </button>
        </header>
        <h2 className="feedback-title">{t('feedback.notEligibleTitle')}</h2>
        <p>{ineligibilityReason}</p>
        <div className="feedback-actions">
          <button 
            className="back-to-event-btn"
            onClick={handleBackToEvents}
          >
            {t('feedback.backToEventsButton')}
          </button>
        </div>
      </div>
    );
  }

  // Main feedback form
  return (
    <div className="feedback-container">
      <header className="feedback-header">
        <button className="back-button" onClick={handleBackToEvents}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          {t('feedback.backToEvents')}
        </button>
        <h2 className="feedback-title">{t('feedback.title')}</h2>
        {/* Use the actual event name, not the translation with parameter */}
        <p className="feedback-subtitle">
          {`${t('feedback.provideFeedbackFor')} ${eventName}`}
        </p>
      </header>
      
      {/* Display event information */}
      {eventData && (
        <div className="feedback-event-info">
          <h3>{eventName}</h3>
          {eventData.start_time && (
            <p className="event-date">
              {formatDate(eventData.start_time)}
            </p>
          )}
        </div>
      )}
      
      <form className="feedback-form" onSubmit={handleSubmit}>
        <div className="feedback-section">
          <h3 className="section-title">{t('feedback.sections.ratings')}</h3>
          
          {/* Rating scales (1-10) */}
          {renderRatingQuestion(
            'overall_experience', 
            t('feedback.fields.overallExperience'),
            t('feedback.descriptions.overallExperience')
          )}
          
          {renderRatingQuestion(
            'organization_quality', 
            t('feedback.fields.organizationQuality')
          )}
          
          {renderRatingQuestion(
            'communication', 
            t('feedback.fields.communication')
          )}
          
          {renderRatingQuestion(
            'host_interaction', 
            t('feedback.fields.hostInteraction')
          )}
          
          {renderRatingQuestion(
            'volunteer_support', 
            t('feedback.fields.volunteerSupport')
          )}
          
          {renderRatingQuestion(
            'task_clarity', 
            t('feedback.fields.taskClarity')
          )}
          
          {renderRatingQuestion(
            'impact_awareness', 
            t('feedback.fields.impactAwareness')
          )}
          
          {renderRatingQuestion(
            'inclusivity', 
            t('feedback.fields.inclusivity')
          )}
          
          {renderRatingQuestion(
            'time_management', 
            t('feedback.fields.timeManagement')
          )}
          
          {renderRatingQuestion(
            'recognition', 
            t('feedback.fields.recognition')
          )}
        </div>
        
        <div className="feedback-section">
          <h3 className="section-title">{t('feedback.sections.textFeedback')}</h3>
          
          {/* Text feedback areas */}
          <div className="feedback-text-question">
            <label htmlFor="strengths" className="feedback-label">
              {t('feedback.fields.strengths')}
            </label>
            <textarea
              id="strengths"
              name="strengths"
              value={feedbackData.strengths}
              onChange={handleTextChange}
              placeholder={t('feedback.placeholders.strengths')}
              rows={4}
              className="feedback-textarea"
            ></textarea>
          </div>
          
          <div className="feedback-text-question">
            <label htmlFor="improvements" className="feedback-label">
              {t('feedback.fields.improvements')}
            </label>
            <textarea
              id="improvements"
              name="improvements"
              value={feedbackData.improvements}
              onChange={handleTextChange}
              placeholder={t('feedback.placeholders.improvements')}
              rows={4}
              className="feedback-textarea"
            ></textarea>
          </div>
          
          <div className="feedback-text-question">
            <label htmlFor="additional_comments" className="feedback-label">
              {t('feedback.fields.additionalComments')}
            </label>
            <textarea
              id="additional_comments"
              name="additional_comments"
              value={feedbackData.additional_comments}
              onChange={handleTextChange}
              placeholder={t('feedback.placeholders.additionalComments')}
              rows={4}
              className="feedback-textarea"
            ></textarea>
          </div>
        </div>
        
        <div className="feedback-section">
          <h3 className="section-title">{t('feedback.sections.futureParticipation')}</h3>
          
          {/* Would volunteer again checkbox */}
          <div className="feedback-checkbox-question">
            <input
              type="checkbox"
              id="would_volunteer_again"
              name="would_volunteer_again"
              checked={feedbackData.would_volunteer_again}
              onChange={handleCheckboxChange}
              className="feedback-checkbox"
            />
            <label htmlFor="would_volunteer_again" className="feedback-checkbox-label">
              {t('feedback.fields.wouldVolunteerAgain')}
            </label>
          </div>
        </div>
        
        <div className="feedback-actions">
          <button 
            type="submit" 
            className="feedback-submit-btn" 
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? t('feedback.submitting') : t('feedback.submit')}
          </button>
          
          <button 
            type="button"
            className="feedback-cancel-btn"
            onClick={handleBackToEvents}
          >
            {t('feedback.cancel')}
          </button>
        </div>
        
        {submitSuccess && (
          <div className="feedback-success" role="alert">
            <p>{t('feedback.submitSuccess')}</p>
          </div>
        )}
      </form>
    </div>
  );
};

export default FeedbackForm;