import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  getAvailableVolunteersForTask, 
  assignVolunteersToTask 
} from '../../../apiservice/volunteer';
import '../../../styles/host/taskdetail/availablevolunteers.css';

/**
 * Component that displays available volunteers for a task and allows assigning them
 * @param {Object} props Component props
 * @param {string|number} props.taskId ID of the task
 * @param {string|number} props.eventId ID of the event (for context)
 * @param {string} props.taskName Name of the task
 * @param {string} props.eventName Name of the event
 * @param {Function} props.onClose Callback for when the component should close
 * @param {Function} props.onVolunteersAdded Callback for when volunteers are added
 */
const AvailableVolunteers = ({ 
  taskId, 
  eventId, 
  taskName, 
  eventName, 
  onClose, 
  onVolunteersAdded 
}) => {
  const { t } = useTranslation();
  
  // State
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVolunteers, setSelectedVolunteers] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVolunteers, setFilteredVolunteers] = useState([]);
  
  // Fetch available volunteers when component mounts
  useEffect(() => {
    fetchAvailableVolunteers();
  }, [taskId]);
  
  // Filter volunteers when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVolunteers(volunteers);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = volunteers.filter(volunteer => {
      return (
        volunteer.name?.toLowerCase().includes(query) ||
        volunteer.skills?.toLowerCase().includes(query) ||
        volunteer.organization?.toLowerCase().includes(query) ||
        volunteer.location?.toLowerCase().includes(query)
      );
    });
    
    setFilteredVolunteers(filtered);
  }, [searchQuery, volunteers]);
  
  // Fetch available volunteers
  const fetchAvailableVolunteers = async () => {
    if (!taskId) {
      setError(t('availableVolunteers.errors.noTaskId'));
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await getAvailableVolunteersForTask(taskId);
      
      if (response.success) {
        setVolunteers(response.data.volunteers || []);
        setFilteredVolunteers(response.data.volunteers || []);
      } else {
        setError(response.error || t('availableVolunteers.errors.fetchFailed'));
      }
    } catch (err) {
      console.error('Error fetching available volunteers:', err);
      setError(t('availableVolunteers.errors.fetchFailed'));
    } finally {
      setLoading(false);
    }
  };
  
  // Handle volunteer selection
  const handleVolunteerSelect = (volunteerId) => {
    setSelectedVolunteers(prev => {
      if (prev.includes(volunteerId)) {
        return prev.filter(id => id !== volunteerId);
      } else {
        return [...prev, volunteerId];
      }
    });
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
  };
  
  // Assign selected volunteers
  const handleAssignVolunteers = async () => {
    if (selectedVolunteers.length === 0) {
      return;
    }
    
    try {
      setAssigning(true);
      
      const response = await assignVolunteersToTask(taskId, selectedVolunteers);
      
      if (response.success) {
        if (onVolunteersAdded) {
          onVolunteersAdded();
        }
        onClose();
      } else {
        setError(response.error || t('availableVolunteers.errors.assignFailed'));
      }
    } catch (err) {
      console.error('Error assigning volunteers:', err);
      setError(t('availableVolunteers.errors.assignFailed'));
    } finally {
      setAssigning(false);
    }
  };
  
  // Format skills for display
  const formatSkills = (skills) => {
    if (!skills) return [];
    
    if (Array.isArray(skills)) {
      return skills;
    }
    
    if (typeof skills === 'string') {
      return skills.split(',').map(skill => skill.trim()).filter(Boolean);
    }
    
    return [];
  };
  
  return (
    <div className="available-volunteers-container">
      <div className="available-volunteers-header">
        <button 
          className="close-button"
          onClick={onClose}
          aria-label={t('availableVolunteers.close')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <h2>{t('availableVolunteers.title')}</h2>
        <p className="task-context">
          {t('availableVolunteers.forTask')} <strong>{taskName}</strong> {t('availableVolunteers.inEvent')} <strong>{eventName}</strong>
        </p>
      </div>
      
      <div className="search-container">
        <div className="search-input-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder={t('availableVolunteers.searchPlaceholder')}
            className="search-input"
          />
          {searchQuery && (
            <button 
              className="clear-search-button"
              onClick={handleClearSearch}
              aria-label={t('availableVolunteers.clearSearch')}
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      <div className="selection-info">
        <span>{t('availableVolunteers.selectedCount', { count: selectedVolunteers.length })}</span>
        {selectedVolunteers.length > 0 && (
          <button 
            className="clear-selection-button"
            onClick={() => setSelectedVolunteers([])}
          >
            {t('availableVolunteers.clearSelection')}
          </button>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <div className="available-volunteers-error" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <div className="available-volunteers-loading">
          <div className="spinner" role="status" aria-hidden="true"></div>
          <span>{t('availableVolunteers.loading')}</span>
        </div>
      )}
      
      {/* No volunteers message */}
      {!loading && !error && filteredVolunteers.length === 0 && (
        <div className="no-available-volunteers">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <p>
            {searchQuery 
              ? t('availableVolunteers.noSearchResults', { query: searchQuery })
              : t('availableVolunteers.noAvailableVolunteers')}
          </p>
        </div>
      )}
      
      {/* Volunteers list */}
      {!loading && !error && filteredVolunteers.length > 0 && (
        <div className="volunteers-selection-container">
          <ul className="available-volunteers-list">
            {filteredVolunteers.map(volunteer => (
              <li 
                key={volunteer.id} 
                className={`volunteer-item ${selectedVolunteers.includes(volunteer.id) ? 'selected' : ''}`}
                onClick={() => handleVolunteerSelect(volunteer.id)}
              >
                <div className="volunteer-selection">
                  <input 
                    type="checkbox" 
                    checked={selectedVolunteers.includes(volunteer.id)}
                    onChange={() => handleVolunteerSelect(volunteer.id)}
                    id={`volunteer-${volunteer.id}`}
                    aria-label={t('availableVolunteers.selectVolunteer', { name: volunteer.name })}
                  />
                </div>
                
                <div className="volunteer-details">
                  <div className="volunteer-avatar">
                    {volunteer.name ? volunteer.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  
                  <div className="volunteer-info">
                    <h3 className="volunteer-name">{volunteer.name}</h3>
                    
                    {volunteer.organization && (
                      <span className="volunteer-organization">{volunteer.organization}</span>
                    )}
                    
                    {volunteer.location && (
                      <span className="volunteer-location">{volunteer.location}</span>
                    )}
                  </div>
                  
                  {/* Task assignment info */}
                  {volunteer.assigned_task_count !== undefined && (
                    <div className="assigned-task-count">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      <span>
                        {volunteer.assigned_task_count === 0
                          ? t('availableVolunteers.noAssignedTasks')
                          : t('availableVolunteers.assignedTasksCount', { count: volunteer.assigned_task_count })}
                      </span>
                    </div>
                  )}
                  
                  {/* Skill match */}
                  {volunteer.skill_match_percent !== undefined && (
                    <div className="volunteer-skill-match">
                      <div className="skill-match-progress">
                        <div 
                          className="skill-match-bar" 
                          style={{ width: `${volunteer.skill_match_percent}%` }}
                          aria-label={t('availableVolunteers.skillMatchPercent', { percent: volunteer.skill_match_percent })}
                        ></div>
                      </div>
                      <span className="skill-match-label">
                        {t('availableVolunteers.skillMatch')}: {volunteer.skill_match_percent}%
                      </span>
                    </div>
                  )}
                  
                  {/* Volunteer skills */}
                  {volunteer.skills && (
                    <div className="volunteer-skills">
                      {formatSkills(volunteer.skills).slice(0, 3).map((skill, index) => (
                        <span key={index} className="skill-tag">
                          {skill}
                        </span>
                      ))}
                      {formatSkills(volunteer.skills).length > 3 && (
                        <span className="more-skills">
                          +{formatSkills(volunteer.skills).length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Matching skills */}
                  {volunteer.matching_skills && volunteer.matching_skills.length > 0 && (
                    <div className="matching-skills">
                      <span className="matching-skills-label">{t('availableVolunteers.matchingSkills')}:</span>
                      <div className="matching-skills-tags">
                        {volunteer.matching_skills.map((skill, index) => (
                          <span key={index} className="matching-skill-tag">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="available-volunteers-actions">
        <button 
          className="cancel-button"
          onClick={onClose}
        >
          {t('availableVolunteers.cancel')}
        </button>
        <button 
          className={`assign-button ${assigning ? 'loading' : ''} ${selectedVolunteers.length === 0 ? 'disabled' : ''}`}
          onClick={handleAssignVolunteers}
          disabled={selectedVolunteers.length === 0 || assigning}
        >
          {assigning ? (
            <>
              <div className="button-spinner"></div>
              {t('availableVolunteers.assigning')}
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <polyline points="17 11 19 13 23 9"></polyline>
              </svg>
              {t('availableVolunteers.assignSelected', { count: selectedVolunteers.length })}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AvailableVolunteers;