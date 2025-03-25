import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { checkAuth } from '../../../apiservice/auth';
import axios from 'axios';
import '../../../styles/host/stats/exportdata.css';

const APP_API_URL = 'http://127.0.0.1:8000/api/app/';

/**
 * ExportData component - provides buttons for hosts to download event data
 * 
 * @param {Object} props Component props
 * @param {number} props.eventId - The ID of the event
 * @param {string} props.eventName - Name of the event (used for filename)
 */
const ExportData = ({ eventId, eventName }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isHost, setIsHost] = useState(false);

  // Check if user is a host
  useEffect(() => {
    const verifyHostStatus = async () => {
      try {
        // Verify the user is a host
        const authResponse = await checkAuth();
        
        if (!authResponse.success || !authResponse.data.authenticated) {
          setError(t('exportData.notAuthenticated', 'You must be logged in to access this feature.'));
          setIsHost(false);
          return;
        }

        // Check if user is a host
        const user = authResponse.data.user;
        
        // Check for any host-like property
        const userIsHost = user && (
          user.is_host === true || 
          user.is_event_host === true || 
          user.host === true ||
          user.role === 'host' ||
          user.isHost === true ||
          user.user_type === 'host'
        );

        setIsHost(userIsHost);

        if (!userIsHost) {
          setError(t('exportData.notAuthorized', 'Only hosts can export event data.'));
        }
      } catch (err) {
        console.error("Error checking host status:", err);
        setError(t('exportData.verificationError', 'Error verifying permissions.'));
      }
    };

    verifyHostStatus();
  }, [t]);

  // Handle volunteer data export - Direct download
  const handleExportVolunteers = async () => {
    if (!isHost) {
      setError(t('exportData.notAuthorized', 'Only hosts can export event data.'));
      return;
    }

    if (!eventId) {
      setError(t('exportData.noEventId', 'Event ID is required for export.'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Direct download approach
      const downloadUrl = `${APP_API_URL}events/export-volunteers/?event_id=${eventId}`;
      
      // Open the download URL in a new tab/window
      window.open(downloadUrl, '_blank');
      
      // Set a timeout to consider the download started
      setTimeout(() => {
        setLoading(false);
      }, 1000);
      
    } catch (err) {
      console.error("Error exporting volunteers:", err);
      setError(t('exportData.exportError', 'Error exporting volunteer data.'));
      setLoading(false);
    }
  };

  // If not a host, show permission denied message
  if (!isHost) {
    return (
      <div className="export-data-container permission-denied">
        <div className="export-data-error">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>{t('exportData.permissionDenied', 'Only hosts can export event data.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="export-data-container">
      <h3 className="export-data-heading">{t('exportData.title', 'Export Event Data')}</h3>
      
      {error && (
        <div className="export-data-error">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>{error}</p>
        </div>
      )}
      
      <div className="export-buttons">
        <button 
          className="export-button volunteer-export"
          onClick={handleExportVolunteers}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              {t('exportData.exporting', 'Exporting...')}
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              {t('exportData.exportVolunteers', 'Export Volunteer Data (Excel)')}
            </>
          )}
        </button>
      </div>
      
      <div className="export-description">
        <p>{t('exportData.description', 'This will download an Excel file with volunteer information, task assignments, feedback, and event statistics.')}</p>
      </div>
    </div>
  );
};

export default ExportData;