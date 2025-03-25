import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { checkAuth } from '../../../apiservice/auth';
import { 
  downloadEventVolunteersExcel, 
  checkEventVolunteersForExport 
} from '../../../apiservice/userdata';
import '../../../styles/host/stats/exportdata.css';

/**
 * ExportData component - provides buttons for hosts to download event data
 * 
 * @param {Object} props Component props
 * @param {number} props.eventId - The ID of the event
 * @param {string} props.eventName - Name of the event (used for filename)
 * @param {function} props.onError - Callback when an error occurs (optional)
 */
const ExportData = ({ eventId, eventName, onError }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [volunteerStats, setVolunteerStats] = useState({
    count: 0,
    hasVolunteers: false,
    canExport: false
  });

  // Log props to debug
  useEffect(() => {
    console.log("ExportData props:", { eventId, eventName });
  }, [eventId, eventName]);

  // Check if user is a host and get volunteer stats
  useEffect(() => {
    const verifyHostAndGetStats = async () => {
      try {
        console.log("Verifying host status for event:", eventId);
        
        // Verify the user is a host
        const authResponse = await checkAuth();
        console.log("Auth response:", authResponse);
        
        if (!authResponse.success || !authResponse.data.authenticated) {
          setError(t('exportData.notAuthenticated', 'You must be logged in to access this feature.'));
          setIsHost(false);
          return;
        }

        // Check if user is a host
        const user = authResponse.data.user;
        console.log("User data:", user);
        
        // More permissive host check - consider any host-like property
        const userIsHost = user && (
          user.is_host === true || 
          user.is_event_host === true || 
          user.host === true ||
          user.role === 'host' ||
          user.isHost === true ||
          user.user_type === 'host'
        );

        console.log("Is host:", userIsHost);
        setIsHost(userIsHost);

        if (!userIsHost) {
          setError(t('exportData.notAuthorized', 'Only hosts can export event data.'));
          return;
        }

        // Only check stats if we have an event ID and user is a host
        if (eventId && userIsHost) {
          // Get volunteer stats to know if export is possible
          console.log("Checking volunteer stats for event:", eventId);
          const statsResponse = await checkEventVolunteersForExport(eventId);
          console.log("Volunteer stats response:", statsResponse);
          
          if (statsResponse.success) {
            setVolunteerStats({
              count: statsResponse.data.volunteerCount || 0,
              hasVolunteers: (statsResponse.data.volunteerCount > 0) || (statsResponse.data.hasVolunteers === true),
              // Allow export even if there are no volunteers - could still be useful to get an empty template
              canExport: true
            });
          } else {
            console.error("Failed to get volunteer stats:", statsResponse.error);
            // Still enable export even if stats check fails
            setVolunteerStats({
              count: 0,
              hasVolunteers: false,
              canExport: true // Allow export anyway
            });
          }
        }
      } catch (err) {
        console.error("Error checking host status:", err);
        setError(t('exportData.verificationError', 'Error verifying permissions.'));
        if (onError) onError(err);
        
        // Still enable export if there was an error checking
        setVolunteerStats(prev => ({
          ...prev,
          canExport: true
        }));
      }
    };

    if (eventId) {
      verifyHostAndGetStats();
    }
  }, [eventId, t, onError]);

  // Handle volunteer data export
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
      
      console.log("Starting export for event:", eventId);
      
      // Generate filename using event name if available
      const filename = eventName 
        ? `${eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_volunteers.xlsx`
        : `event_${eventId}_volunteers.xlsx`;
      
      console.log("Using filename:", filename);
      
      const result = await downloadEventVolunteersExcel(eventId, filename);
      console.log("Download result:", result);
      
      if (!result.success) {
        setError(result.error || t('exportData.downloadFailed', 'Failed to download file.'));
        if (onError) onError(result.error);
      }
    } catch (err) {
      console.error("Error exporting volunteers:", err);
      setError(t('exportData.exportError', 'Error exporting volunteer data.'));
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  // Render debug info when debugging
  const renderDebugInfo = () => {
    return (
      <div className="debug-info" style={{fontSize: '12px', color: '#666', border: '1px solid #ccc', padding: '10px', margin: '10px 0'}}>
        <p>Debug Info:</p>
        <ul>
          <li>Event ID: {eventId || 'Not set'}</li>
          <li>Event Name: {eventName || 'Not set'}</li>
          <li>Is Host: {isHost ? 'Yes' : 'No'}</li>
          <li>Volunteer Count: {volunteerStats.count}</li>
          <li>Has Volunteers: {volunteerStats.hasVolunteers ? 'Yes' : 'No'}</li>
          <li>Can Export: {volunteerStats.canExport ? 'Yes' : 'No'}</li>
        </ul>
      </div>
    );
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
        {renderDebugInfo()}
      </div>
    );
  }

  return (
    <div className="export-data-container">
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
              {t('exportData.exportVolunteers', 'Export Volunteer Data')}
            </>
          )}
        </button>
        
        {!volunteerStats.hasVolunteers && (
          <p className="export-note">
            {t('exportData.noVolunteers', 'This event has no volunteers to export, but you can still download an empty template.')}
          </p>
        )}
        
        {volunteerStats.hasVolunteers && (
          <p className="export-info">
            {t('exportData.volunteerCount', {
              count: volunteerStats.count,
              defaultValue: `{{count}} volunteer(s) enrolled in this event`
            })}
          </p>
        )}
      </div>
      
      <div className="export-description">
        <p>{t('exportData.description', 'The export includes volunteer details, task assignments, skill matching, and overall participation data.')}</p>
      </div>
      
      {renderDebugInfo()}
    </div>
  );
};

export default ExportData;