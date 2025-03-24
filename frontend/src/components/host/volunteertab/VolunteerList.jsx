import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventVolunteers, searchVolunteers } from '../../../apiservice/volunteer';
import '../../../styles/host/volunteer/VolunteerList.css';

/**
 * Component to display a list of volunteers for an event with search functionality
 * 
 * @param {Object} props Component props
 * @param {string|number} [props.eventId] Optional event ID to filter volunteers
 * @param {Function} [props.onVolunteerSelect] Optional callback when a volunteer is selected
 * @param {boolean} [props.showControls=true] Whether to show control buttons
 * @param {boolean} [props.isEmbedded=false] Whether the component is embedded in another view
 * @param {boolean} [props.isSimpleList=false] Whether to show a simplified volunteer list
 * @param {string|number} [props.selectedVolunteerId] ID of the currently selected volunteer
 */
const VolunteerList = ({
  eventId: propEventId,
  onVolunteerSelect,
  showControls = true,
  isEmbedded = false,
  isSimpleList = false,
  selectedVolunteerId = null
}) => {
  const { t } = useTranslation();
  const { eventId: paramEventId } = useParams();
  const navigate = useNavigate();
  
  // Use prop eventId if provided, otherwise use URL param
  const eventId = propEventId || paramEventId;
  
  const [volunteers, setVolunteers] = useState([]);
  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const searchInputRef = useRef(null);
  
  // Fetch volunteers when component mounts or eventId changes
  useEffect(() => {
    const fetchVolunteers = async () => {
      if (!eventId) {
        setError(t('volunteerList.errors.noEventId'));
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await getEventVolunteers(eventId);
        
        if (response.success) {
		//   console.log(response.data.volunteers);
          setVolunteers(response.data.volunteers);
          setEventName(response.data.eventName);
        } else {
          setError(response.error || t('volunteerList.errors.fetchFailed'));
        }
      } catch (err) {
        console.error('Error fetching volunteers:', err);
        setError(t('volunteerList.errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };
    
    if (!isSearchMode) {
      fetchVolunteers();
    }
  }, [eventId, t, isSearchMode]);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    
    // If search field is cleared, exit search mode
    if (!e.target.value.trim()) {
      setIsSearchMode(false);
      setSearchResults([]);
    }
  };
  
  // Handle search form submission
  const handleSearch = async (e) => {
    e?.preventDefault();
    
    if (!searchQuery.trim()) {
      setIsSearchMode(false);
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      setIsSearchMode(true);
      
      const response = await searchVolunteers({
        query: searchQuery,
        eventId: eventId // Limit search to current event
      });
      
      if (response.success) {
        setSearchResults(response.data.volunteers);
      } else {
        setError(response.error || t('volunteerList.errors.searchFailed'));
      }
    } catch (err) {
      console.error('Error searching volunteers:', err);
      setError(t('volunteerList.errors.searchFailed'));
    } finally {
      setIsSearching(false);
    }
  };
  
  // Clear search and show all volunteers
  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearchMode(false);
    setSearchResults([]);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  // Handle volunteer selection
  const handleVolunteerClick = (volunteer) => {
    if (onVolunteerSelect) {
      onVolunteerSelect(volunteer);
    }
  };
  
  // Format skills for display
  const formatSkills = (skillsString) => {
    if (!skillsString) return [];
    return skillsString.split(',').map(skill => skill.trim()).filter(Boolean);
  };
  
  // Get volunteers to display (either search results or all volunteers)
  const displayVolunteers = isSearchMode ? searchResults : volunteers;
  
  // Render the component
  return (
    <div className={`volunteer-list-container ${isEmbedded ? 'embedded' : ''} ${isSimpleList ? 'simple-list' : ''}`}>
      {/* Header with event name and search */}
      <div className="volunteer-list-header">
        <div className="volunteer-list-title">
          <h2>{eventName ? `${t('volunteerList.volunteersFor')} ${eventName}` : t('volunteerList.volunteers')}</h2>
          {displayVolunteers.length > 0 && (
            <span className="volunteer-count">
              {displayVolunteers.length} {displayVolunteers.length === 1 
                ? t('volunteerList.volunteer') 
                : t('volunteerList.volunteersCount')}
            </span>
          )}
        </div>
        
        <div className="volunteer-search-container">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder={t('volunteerList.searchPlaceholder')}
                aria-label={t('volunteerList.searchAriaLabel')}
                className="volunteer-search-input"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  className="clear-search-button"
                  onClick={handleClearSearch}
                  aria-label={t('volunteerList.clearSearch')}
                >
                  ×
                </button>
              )}
            </div>
            <button 
              type="submit"
              className="search-button"
              disabled={isSearching}
              aria-label={t('volunteerList.search')}
            >
              {isSearching ? (
                <span className="search-spinner" aria-hidden="true" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
      
      {/* Search active indicator */}
	  {isSearchMode && (
		  <div className="search-active-indicator">
		    <span>
		      {searchResults.length > 0 
		        ? `${t('volunteerList.foundResults', { count: searchResults.length })} "${searchQuery}"`
		        : `${t('volunteerList.noResults')} "${searchQuery}"`}
		    </span>
		    <button 
		      className="show-all-button"
		      onClick={handleClearSearch}
		    >
		      {t('volunteerList.showAllVolunteers')}
		    </button>
		  </div>
		)}
      
      {/* Error message */}
      {error && (
        <div className="volunteer-list-error" role="alert">
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
        <div className="volunteer-list-loading">
          <div className="loading-spinner" role="status"></div>
          <span>{t('volunteerList.loading')}</span>
        </div>
      )}
      
      {/* No volunteers message */}
      {!loading && !error && displayVolunteers.length === 0 && (
        <div className="no-volunteers-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <p>
            {isSearchMode 
              ? t('volunteerList.noSearchResults', { query: searchQuery })
              : t('volunteerList.noVolunteers')}
          </p>
        </div>
      )}
      

{/* Volunteer list */}
{!loading && !error && displayVolunteers.length > 0 && (
  <div className={`volunteers-list ${isSimpleList ? 'simple' : 'grid'}`}>
    {displayVolunteers.map(volunteer => (
      <div 
        key={volunteer.id} 
        className={`volunteer-item ${isSimpleList ? 'simple' : 'card'} ${selectedVolunteerId === volunteer.id ? 'selected' : ''}`}
        onClick={() => handleVolunteerClick(volunteer)}
      >
        {isSimpleList ? (
          // Simple list item with name, skills, and assigned task count
          // Updated to align content to the right
          <>
            <div className="volunteer-simple-header">
              <div className="volunteer-avatar">
                {volunteer.name ? volunteer.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="volunteer-simple-info">
                <h3 className="volunteer-name">{volunteer.name}</h3>
                
                {/* Display assigned tasks count */}
                <div className="volunteer-assigned-tasks">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  <span>
                    {volunteer.assigned_task_count === 0
                      ? t('volunteerList.noAssignedTasks')
                      : t('volunteerList.assignedTasksCount', { count: volunteer.assigned_task_count })}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Fixed skills display */}
            {volunteer.skills && (
              <div className="volunteer-skills simple">
                {formatSkills(volunteer.skills).slice(0, 3).map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))}
                {formatSkills(volunteer.skills).length > 3 && (
                  <span className="skill-tag more-skills">+{formatSkills(volunteer.skills).length - 3}</span>
                )}
              </div>
            )}
          </>
        ) : (
          // Original card design for non-simple view
          <>
            <div className="volunteer-card-header">
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
            </div>
            
            {/* Fixed skills display */}
            {volunteer.skills && (
              <div className="volunteer-skills">
                {formatSkills(volunteer.skills).slice(0, 3).map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))}
                {formatSkills(volunteer.skills).length > 3 && (
                  <span className="skill-tag more-skills">+{formatSkills(volunteer.skills).length - 3}</span>
                )}
              </div>
            )}
            
            {volunteer.assigned_task_count !== undefined && (
              <div className="volunteer-task-info">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span>
                  {volunteer.assigned_task_count === 0
                    ? t('volunteerList.noAssignedTasks')
                    : t('volunteerList.assignedTasksCount', { count: volunteer.assigned_task_count })}
                </span>
              </div>
            )}
            
            {volunteer.skill_match_percent !== undefined && (
              <div className="volunteer-skill-match">
                <div className="skill-match-label">
                  {t('volunteerList.skillMatch')}:
                </div>
                <div className="skill-match-value">
                  {volunteer.skill_match_percent}%
                </div>
              </div>
            )}
            
            {showControls && (
              <div className="volunteer-card-actions">
                <button className="view-profile-btn">
                  {t('volunteerList.viewProfile')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    ))}
  </div>
)}
    </div>
  );
};

export default VolunteerList;