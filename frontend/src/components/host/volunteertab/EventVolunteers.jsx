import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import VolunteerList from './VolunteerList';
import VolunteerProfile from './VolunteerProfile';
import TaskWindow from './TaskWindow';
import '../../../styles/host/volunteer/EventVolunteers.css';

/**
 * A container component that displays volunteers for an event,
 * allows viewing volunteer profiles and assigning tasks
 */
const EventVolunteers = ({ eventId }) => {
  const { t } = useTranslation();

  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [isTaskWindowOpen, setIsTaskWindowOpen] = useState(false);

  const handleVolunteerSelect = (volunteer) => {
    setSelectedVolunteer(volunteer);
    setIsTaskWindowOpen(false);
  };

  const handleOpenTaskWindow = () => {
    setIsTaskWindowOpen(true);
  };

  const handleCloseTaskWindow = () => {
    setIsTaskWindowOpen(false);
  };

  const handleTaskAssigned = () => {
    setIsTaskWindowOpen(false);
    // Optionally refresh volunteer data if necessary
  };

  return (
    <div className="event-volunteers-container">
      <div className="event-volunteers-content">
        {/* Left column: Volunteer List - Takes more space */}
        <div className="volunteers-column">
          <VolunteerList 
            eventId={eventId} 
            onVolunteerSelect={handleVolunteerSelect}
            showControls={false}
            isSimpleList={true}
            selectedVolunteerId={selectedVolunteer?.id}
          />
        </div>

        {/* Right column: Profile and Task Window - Takes less space */}
        <div className="profile-column">
          {selectedVolunteer ? (
            <div className="profile-with-actions">
              <VolunteerProfile 
                userId={selectedVolunteer.id}
                showActions={false}
                compact={true}
              />
              
              <div className="profile-action-buttons">
                <button 
                  className="assign-task-button"
                  onClick={handleOpenTaskWindow}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                  {t('eventVolunteers.assignTask')}
                </button>
              </div>
            </div>
          ) : (
            <div className="no-volunteer-selected">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <p>{t('eventVolunteers.selectVolunteerPrompt')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Task assignment window */}
      {isTaskWindowOpen && selectedVolunteer && (
        <div className="task-window-overlay">
          <TaskWindow 
            eventId={eventId}
            volunteerId={selectedVolunteer.id}
            volunteerName={selectedVolunteer.name}
            onClose={handleCloseTaskWindow}
            onTaskAssigned={handleTaskAssigned}
          />
        </div>
      )}
    </div>
  );
};

export default EventVolunteers;