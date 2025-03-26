import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getEventFeedbackCharts, downloadSvgChart, getChartTypes } from '../../../apiservice/eventdata';
import '../../../styles/host/stats/charts.css';

const EventAnalytics = ({ eventId, eventName: initialEventName }) => {
  const { t } = useTranslation();
  
  const [charts, setCharts] = useState({});
  const [eventName, setEventName] = useState(initialEventName || '');
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChartType, setSelectedChartType] = useState('all');
  
  const chartTypes = getChartTypes();
  
  useEffect(() => {
    const fetchCharts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await getEventFeedbackCharts(eventId, selectedChartType);
        
        if (result.success) {
          setCharts(result.data.charts || {});
          if (!initialEventName) {
            setEventName(result.data.event_name || '');
          }
          setFeedbackCount(result.data.feedback_count || 0);
        } else {
          setError(result.error || t('eventAnalytics.fetchError'));
        }
      } catch (err) {
        setError(t('eventAnalytics.unexpectedError'));
        console.error('Error fetching charts:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (eventId) {
      fetchCharts();
    }
  }, [eventId, selectedChartType, t, initialEventName]);
  
  const handleDownload = (chartName, svgContent) => {
    downloadSvgChart(svgContent, `${eventName}_${chartName}.svg`);
  };
  
  const handleChartTypeChange = (e) => {
    setSelectedChartType(e.target.value);
  };
  
  return (
    <div className="event-analytics-container">
      <div className="analytics-header">
        <h3 className="section-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          {t('eventAnalytics.title', 'Feedback Analytics')}
        </h3>
        
        <div className="analytics-info">
          <p>{t('eventAnalytics.feedbackCount', 'Feedback responses')}: <strong>{feedbackCount}</strong></p>
        </div>
        
        <div className="chart-selector">
          <label htmlFor="chart-type-select">{t('eventAnalytics.selectChartType', 'Chart type')}:</label>
          <select 
            id="chart-type-select" 
            value={selectedChartType} 
            onChange={handleChartTypeChange}
          >
            {chartTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t('eventAnalytics.loading', 'Loading charts...')}</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>{t('eventAnalytics.errorTitle', 'Error loading charts')}</h3>
          <p>{error}</p>
          <button onClick={() => setSelectedChartType('all')}>
            {t('eventAnalytics.tryAgain', 'Try Again')}
          </button>
        </div>
      ) : Object.keys(charts).length === 0 ? (
        <div className="no-data-container">
          <div className="no-data-icon">📊</div>
          <h3>{t('eventAnalytics.noDataTitle', 'No Chart Data Available')}</h3>
          <p>{t('eventAnalytics.noDataDescription', 'There is no feedback data available to generate charts for this event.')}</p>
        </div>
      ) : (
        <div className="charts-grid">
          {Object.entries(charts).map(([chartName, svgContent]) => (
            <div key={chartName} className="chart-card">
              <h3>{formatChartName(chartName)}</h3>
              <div className="chart-container">
                <div dangerouslySetInnerHTML={{ __html: svgContent }} />
              </div>
              <div className="chart-actions">
                <button onClick={() => handleDownload(chartName, svgContent)}>
                  <i className="fas fa-download"></i> {t('eventAnalytics.downloadSVG', 'Download SVG')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper to format chart names for display
const formatChartName = (chartName) => {
  return chartName
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default EventAnalytics;