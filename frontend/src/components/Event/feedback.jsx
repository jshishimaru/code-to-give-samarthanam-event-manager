import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import '../../styles/Event/feedback.css';
import { checkFeedbackEligibility, getFeedbackDetails, submitFeedback } from '../../apiservice/feedback.js';

const Feedback = () => {
  const { t } = useTranslation();
  const { eventId } = useParams();
  
  // States for managing component behavior
  const [isEligible, setIsEligible] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [ineligibilityReason, setIneligibilityReason] = useState('');
  
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

  // Check eligibility when component mounts
  useEffect(() => {
    const checkEligibility = async () => {
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

    if (eventId) {
      checkEligibility();
    }
  }, [eventId, t]);

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

  // Loading state
  if (!eligibilityChecked) {
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
        <h2 className="feedback-title">{t('feedback.errorTitle')}</h2>
        <p>{error}</p>
      </div>
    );
  }

  // If user has already submitted feedback, show the existing feedback
  if (existingFeedback) {
    return (
      <div className="feedback-container feedback-submitted">
        <h2 className="feedback-title">{t('feedback.submittedTitle')}</h2>
        <div className="feedback-summary">
          <p>{t('feedback.submittedDescription')}</p>
          
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
              <p>{t('feedback.submittedOn', { 
                date: new Date(existingFeedback.created_at).toLocaleDateString() 
              })}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If user is not eligible, show reason
  if (!isEligible) {
    return (
      <div className="feedback-container feedback-not-eligible">
        <h2 className="feedback-title">{t('feedback.notEligibleTitle')}</h2>
        <p>{ineligibilityReason}</p>
      </div>
    );
  }

  // Main feedback form
  return (
    <div className="feedback-container">
      <h2 className="feedback-title">{t('feedback.title')}</h2>
      {/* Rest of the form remains unchanged */}
    </div>
  );
};

export default Feedback;