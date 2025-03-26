import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { generateEventReport, getEventFeedbackAnalytics } from '../../../apiservice/feedback_report';
import '../../../styles/host/stats/feedbackreport.css';

/**
 * Feedback Report Summary component
 * A concise view of event feedback data designed for embedding in other components
 * 
 * @param {Object} props Component props
 * @param {number} props.eventId - ID of the event
 * @param {string} props.eventName - Name of the event (optional)
 * @param {boolean} props.minimal - Whether to show minimal view (default: false)
 * @param {Function} props.onViewDetails - Callback when "View Details" is clicked
 */
const FeedbackReportSummary = ({ eventId, eventName, minimal = false, onViewDetails }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!eventId) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch analytics data
        const analyticsResult = await getEventFeedbackAnalytics(eventId);
        
        if (analyticsResult.success) {
          setAnalytics(analyticsResult.data.analytics);
          
          // Only fetch the full report if not in minimal mode
          if (!minimal) {
            const reportResult = await generateEventReport(eventId);
            if (reportResult.success) {
              setReportData(reportResult.data.report);
            }
          }
        } else {
          setError(analyticsResult.error);
        }
      } catch (err) {
        console.error('Error fetching feedback data:', err);
        setError(t('feedbackReport.error', 'Failed to load feedback data'));
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [eventId, minimal, t]);

  // Format retention percentage
  const formatRetention = (retention) => {
    if (!retention || typeof retention.percentage !== 'number') return '0%';
    return `${Math.round(retention.percentage)}%`;
  };

  // Calculate rating average
  const calculateAverageRating = (ratings) => {
    if (!ratings) return 0;
    const validRatings = Object.values(ratings).filter(val => typeof val === 'number');
    return validRatings.length > 0 
      ? (validRatings.reduce((sum, val) => sum + val, 0) / validRatings.length).toFixed(1)
      : 0;
  };

  // Get CSS class for a rating value
  const getRatingClass = (value) => {
    if (value >= 4.5) return 'excellent';
    if (value >= 3.5) return 'good';
    if (value >= 2.5) return 'average';
    return 'poor';
  };

  // Format completion rate
  const formatCompletion = (completion) => {
    if (!completion || typeof completion.completion_rate !== 'number') return '0%';
    return `${Math.round(completion.completion_rate)}%`;
  };

  if (loading) {
    return (
      <div className="feedback-report-summary loading">
        <div className="feedback-report-loading">
          <div className="loading-spinner"></div>
          <span>{t('feedbackReport.loading', 'Loading feedback data...')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feedback-report-summary error">
        <div className="feedback-report-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="feedback-report-summary empty">
        <div className="feedback-report-empty">
          <span className="empty-icon">📊</span>
          <span>{t('feedbackReport.noData', 'No feedback data available')}</span>
        </div>
      </div>
    );
  }

  const feedbackCount = analytics.feedback_count || 0;
  const avgRating = calculateAverageRating(analytics.average_ratings);
  const retentionRate = formatRetention(analytics.volunteer_retention);
  const completionRate = formatCompletion(analytics.task_completion);
  const ratingClass = getRatingClass(avgRating);

  return (
    <div className={`feedback-report-summary ${minimal ? 'minimal' : ''}`}>
      <div className="report-summary-header">
        <h4 className="report-summary-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          {t('feedbackReport.title', 'Feedback Summary')}
        </h4>
      </div>

      {feedbackCount === 0 ? (
        <div className="no-feedback-message">
          <p>{t('feedbackReport.noFeedback', 'No feedback has been submitted for this event yet.')}</p>
        </div>
      ) : (
        <>
          <div className="report-summary-metrics">
            <div className="metric-item">
              <div className="metric-value">{feedbackCount}</div>
              <div className="metric-label">{t('feedbackReport.responses', 'Responses')}</div>
            </div>
            
            <div className="metric-item">
              <div className={`metric-value rating ${ratingClass}`}>{avgRating}</div>
              <div className="metric-label">{t('feedbackReport.avgRating', 'Avg. Rating')}</div>
            </div>

            <div className="metric-item">
              <div className="metric-value">{retentionRate}</div>
              <div className="metric-label">{t('feedbackReport.retention', 'Would Volunteer Again')}</div>
            </div>

            <div className="metric-item">
              <div className="metric-value">{completionRate}</div>
              <div className="metric-label">{t('feedbackReport.completion', 'Tasks Completed')}</div>
            </div>
          </div>

		  {!minimal && analytics.average_ratings && (
		  <div className="rating-breakdown">
		    <h5>{t('feedbackReport.ratingBreakdown', 'Rating Breakdown')}</h5>
		    <div className="rating-items">
		      {Object.entries(analytics.average_ratings)
		        .filter(([key]) => key !== 'overall')
		        .sort(([,a], [,b]) => b - a)
		        .slice(0, 3)
		        .map(([key, value]) => (
		          <div key={key} className="rating-item">
		            <div className="rating-label">
		              {t(`feedbackReport.ratings.${key}`, formatRatingKey(key))}
		            </div>
		            <div className="rating-bar-container">
		              <div 
		                className={`rating-bar ${getRatingClass(value)}`}
		                style={{width: `${Math.max(0, Math.min(100, ((value / 5) * 100)))}%`}}
		              ></div>
		            </div>
		            <div className="rating-value">{value.toFixed(1)}</div>
		          </div>
		        ))
		      }
		    </div>
		  </div>
		)}
        </>
      )}
    </div>
  );
};

// Helper function to format rating keys for display
const formatRatingKey = (key) => {
  return key
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default FeedbackReportSummary;