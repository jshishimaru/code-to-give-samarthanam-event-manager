import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getUserProfile } from '../../../apiservice/auth';
import '../../../styles/host/volunteer/VolunteerProfile.css';

/**
 * A component to display volunteer profile information in a concise window
 * @param {Object} props Component props
 * @param {string|number} props.userId The ID of the volunteer to display
 * @param {Function} props.onClose Optional callback function when the user closes the profile
 * @param {boolean} props.showActions Whether to show action buttons like contact, message, etc.
 * @param {boolean} props.compact Whether to show the profile in a compact mode (smaller)
 */
const VolunteerProfile = ({ userId, onClose, showActions = true, compact = false }) => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setError(t('profile.errors.missingId'));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getUserProfile(userId);
        
        if (response.success) {
          setProfile(response.data.profile);
          setError(null);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError(t('profile.errors.fetchFailed'));
        console.error('Error fetching volunteer profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, t]);

  // Format the skills into an array
  const formatSkills = (skillsString) => {
    if (!skillsString) return [];
    return skillsString.split(',').map(skill => skill.trim()).filter(Boolean);
  };

  // Format the date to a more readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`volunteer-profile-card loading ${compact ? 'compact' : ''}`}>
        <div className="profile-loading-spinner" role="status">
          <span className="sr-only">{t('common.loading')}</span>
        </div>
        <p className="loading-text">{t('profile.loadingProfile')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`volunteer-profile-card error ${compact ? 'compact' : ''}`}>
        <div className="error-icon">❌</div>
        <h3 className="error-title">{t('profile.errorTitle')}</h3>
        <p className="error-message">{error}</p>
        {onClose && (
          <button className="close-profile-btn" onClick={onClose}>
            {t('common.close')}
          </button>
        )}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`volunteer-profile-card not-found ${compact ? 'compact' : ''}`}>
        <div className="not-found-icon">🔍</div>
        <h3 className="not-found-title">{t('profile.notFound')}</h3>
        <p className="not-found-message">{t('profile.volunteerNotFound')}</p>
        {onClose && (
          <button className="close-profile-btn" onClick={onClose}>
            {t('common.close')}
          </button>
        )}
      </div>
    );
  }

  const skills = formatSkills(profile.skills);

  return (
    <div className={`volunteer-profile-card ${compact ? 'compact' : ''}`}>
      {onClose && (
        <button 
          className="close-profile-btn" 
          onClick={onClose}
          aria-label={t('profile.closeProfile')}
        >
          ×
        </button>
      )}
      
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
        </div>
        <div className="profile-identity">
          <h2 className="profile-name">{profile.name}</h2>
          <div className="profile-label">
            {profile.role 
              ? t(`profile.roles.${profile.role.toLowerCase()}`) 
              : t('profile.volunteer')}
          </div>
        </div>
      </div>

      <div className="profile-body">
        <div className="profile-section">
          <h3 className="section-title">{t('profile.contactInfo')}</h3>
          <div className="profile-field">
            <span className="field-label">{t('profile.email')}:</span>
            <span className="field-value">{profile.email}</span>
          </div>
          {profile.contact && (
            <div className="profile-field">
              <span className="field-label">{t('profile.contact')}:</span>
              <span className="field-value">{profile.contact}</span>
            </div>
          )}
        </div>

        {!compact && (
          <div className="profile-section">
            <h3 className="section-title">{t('profile.personalInfo')}</h3>
            {profile.location && (
              <div className="profile-field">
                <span className="field-label">{t('profile.location')}:</span>
                <span className="field-value">{profile.location}</span>
              </div>
            )}
            {profile.organization && (
              <div className="profile-field">
                <span className="field-label">{t('profile.organization')}:</span>
                <span className="field-value">{profile.organization}</span>
              </div>
            )}
            {profile.age && (
              <div className="profile-field">
                <span className="field-label">{t('profile.age')}:</span>
                <span className="field-value">{profile.age}</span>
              </div>
            )}
            <div className="profile-field">
              <span className="field-label">{t('profile.memberSince')}:</span>
              <span className="field-value">{formatDate(profile.date_joined)}</span>
            </div>
          </div>
        )}

        {skills.length > 0 && (
          <div className="profile-section skills-section">
            <h3 className="section-title">{t('profile.skills')}</h3>
            <div className="skills-container">
              {compact 
                ? skills.slice(0, 3).map((skill, index) => (
                    <span key={index} className="skill-badge">
                      {skill}
                    </span>
                  ))
                : skills.map((skill, index) => (
                    <span key={index} className="skill-badge">
                      {skill}
                    </span>
                  ))
              }
              {compact && skills.length > 3 && (
                <span className="skill-badge more-skills">
                  +{skills.length - 3}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {showActions && (
        <div className="profile-actions">
          <button className="action-button contact">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            {t('profile.actions.contact')}
          </button>
          <button className="action-button message">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            {t('profile.actions.message')}
          </button>
          <button className="action-button view-events">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {t('profile.actions.viewEvents')}
          </button>
        </div>
      )}
    </div>
  );
};

export default VolunteerProfile;