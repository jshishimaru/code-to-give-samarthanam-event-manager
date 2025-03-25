import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { addTaskToEvent, updateTask } from '../../../apiservice/task';
import '../../../styles/host/hosttask/TaskForm.css';

// Predefined list of skills that might be needed for tasks
const AVAILABLE_SKILLS = [
  "Web Development", "Mobile Development", "UI/UX Design", "Project Management",
  "Teaching", "Content Writing", "Social Media", "Photography", "Event Planning",
  "Public Speaking", "Graphic Design", "Data Analysis", "Translation",
  "Accounting", "Legal Support", "Healthcare", "Mentoring", "Marketing"
];

/**
 * TaskForm component for creating and editing tasks
 * @param {Object} props - Component props
 * @param {string} props.mode - 'create' or 'edit'
 * @param {Object} props.initialData - Initial task data for edit mode
 * @param {number} props.eventId - Event ID for create mode
 * @param {Function} props.onSuccess - Callback after successful submission
 * @param {Function} props.onCancel - Callback to handle cancellation
 */
const TaskForm = ({ 
  mode = 'create',
  initialData = null,
  eventId = null,
  onSuccess,
  onCancel
}) => {
  const { t } = useTranslation();
  const isEditMode = mode === 'edit';
  
  // Form state
  const [formData, setFormData] = useState({
    task_name: '',
    description: '',
    start_time: '',
    end_time: '',
    status: 'Pending',
    required_skills: [],
  });
  
  // Track validation errors and submission state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Skills selection state
  const [skillInput, setSkillInput] = useState("");
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [focusedSkillIndex, setFocusedSkillIndex] = useState(-1);
  const skillDropdownRef = useRef(null);
  const skillInputRef = useRef(null);
  const skillsContainerRef = useRef(null);
  
  // Initialize form data in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      // Format dates for date inputs
      const formattedData = {
        ...initialData,
        start_time: initialData.start_time ? formatDateForInput(initialData.start_time) : '',
        end_time: initialData.end_time ? formatDateForInput(initialData.end_time) : '',
        required_skills: Array.isArray(initialData.skills_list) 
          ? initialData.skills_list
          : initialData.required_skills 
            ? initialData.required_skills.split(',').map(skill => skill.trim())
            : []
      };
      setFormData(formattedData);
    }
  }, [isEditMode, initialData]);
  
  // Filter available skills based on input
  useEffect(() => {
    if (skillInput.trim() === "") {
      setFilteredSkills(AVAILABLE_SKILLS.filter(skill => !formData.required_skills.includes(skill)));
    } else {
      const filtered = AVAILABLE_SKILLS.filter(
        skill => skill.toLowerCase().includes(skillInput.toLowerCase()) && 
                 !formData.required_skills.includes(skill)
      );
      setFilteredSkills(filtered);
    }
    // Reset focused index when filtered skills change
    setFocusedSkillIndex(-1);
  }, [skillInput, formData.required_skills]);
  
  // Handle click outside skills dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        skillsContainerRef.current && 
        !skillsContainerRef.current.contains(event.target)
      ) {
        setShowSkillDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Focus the selected skill option when focused index changes
  useEffect(() => {
    if (focusedSkillIndex >= 0 && skillDropdownRef.current) {
      const options = skillDropdownRef.current.querySelectorAll('.skill-option');
      if (options[focusedSkillIndex]) {
        options[focusedSkillIndex].focus();
        options[focusedSkillIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedSkillIndex]);
  
  // Format ISO date string for datetime-local input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    // Remove the 'Z' and split at the milliseconds if present
    const dateTimeParts = dateString.replace('Z', '').split('.');
    return dateTimeParts[0]; // Returns YYYY-MM-DDTHH:MM:SS format
  };
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Skills input handlers
  const handleSkillInputChange = (e) => {
    setSkillInput(e.target.value);
    setShowSkillDropdown(true);
  };
  
  const handleSelectSkill = (skill) => {
    if (!formData.required_skills.includes(skill)) {
      setFormData({
        ...formData,
        required_skills: [...formData.required_skills, skill]
      });
      setSkillInput("");
      
      // Clear any skills error
      if (errors.required_skills) {
        setErrors({
          ...errors,
          required_skills: null
        });
      }
      
      // Focus back on the input after selection
      if (skillInputRef.current) {
        skillInputRef.current.focus();
      }
    }
    setShowSkillDropdown(false);
  };
  
  const handleRemoveSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      required_skills: formData.required_skills.filter(skill => skill !== skillToRemove)
    });
  };
  
  const toggleSkillDropdown = () => {
    setShowSkillDropdown(prev => !prev);
    // If opening the dropdown, focus the input
    if (!showSkillDropdown && skillInputRef.current) {
      skillInputRef.current.focus();
    }
  };
  
  // Handle keyboard navigation in skills dropdown
  const handleSkillInputKeyDown = (e) => {
    // If dropdown is not showing and user presses down, show it
    if (!showSkillDropdown && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault();
      setShowSkillDropdown(true);
      return;
    }
    
    if (!showSkillDropdown) return;
    
    // Down arrow
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedSkillIndex(prev => 
        prev < filteredSkills.length - 1 ? prev + 1 : prev
      );
    }
    // Up arrow
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedSkillIndex(prev => prev > 0 ? prev - 1 : 0);
    }
    // Enter
    else if (e.key === 'Enter' && focusedSkillIndex >= 0) {
      e.preventDefault();
      handleSelectSkill(filteredSkills[focusedSkillIndex]);
    }
    // Escape
    else if (e.key === 'Escape') {
      e.preventDefault();
      setShowSkillDropdown(false);
    }
  };
  
  // Handle keyboard navigation for skill options
  const handleSkillOptionKeyDown = (e, skill, index) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectSkill(skill);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (index < filteredSkills.length - 1) {
        setFocusedSkillIndex(index + 1);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) {
        setFocusedSkillIndex(index - 1);
      } else {
        // If at first item, return focus to input
        if (skillInputRef.current) {
          skillInputRef.current.focus();
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowSkillDropdown(false);
      if (skillInputRef.current) {
        skillInputRef.current.focus();
      }
    }
  };
  
  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.task_name.trim()) {
      newErrors.task_name = t('taskForm.errors.nameRequired');
    }
    
    if (!formData.start_time) {
      newErrors.start_time = t('taskForm.errors.startTimeRequired');
    }
    
    if (!formData.end_time) {
      newErrors.end_time = t('taskForm.errors.endTimeRequired');
    } else if (formData.start_time && new Date(formData.end_time) <= new Date(formData.start_time)) {
      newErrors.end_time = t('taskForm.errors.endTimeAfterStart');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      let response;
      // Convert skills array to string for API
      const skillsString = formData.required_skills.join(', ');
      
      if (isEditMode) {
        // Update existing task
        response = await updateTask({
          task_id: initialData.id,
          ...formData,
          required_skills: skillsString
        });
      } else {
        // Create new task
        response = await addTaskToEvent({
          event_id: eventId,
          ...formData,
          required_skills: skillsString
        });
      }
      
      if (response.success) {
        onSuccess?.(response.data);
      } else {
        setSubmitError(response.error || t('taskForm.errors.submitFailed'));
      }
    } catch (error) {
      console.error('Task form error:', error);
      setSubmitError(t('taskForm.errors.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="task-form-container">
      <h2 className="task-form-title">
        {isEditMode 
          ? t('taskForm.titles.edit') 
          : t('taskForm.titles.create')
        }
      </h2>
      
      {submitError && (
        <div className="form-error" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{submitError}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="task-form" aria-label={isEditMode ? t('taskForm.aria.editForm') : t('taskForm.aria.createForm')}>
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="task_name">
              {t('taskForm.fields.taskName')}
              <span className="required">*</span>
            </label>
            <input
              type="text"
              id="task_name"
              name="task_name"
              value={formData.task_name}
              onChange={handleChange}
              aria-required="true"
              aria-invalid={!!errors.task_name}
              aria-describedby={errors.task_name ? "task_name_error" : undefined}
              placeholder={t('taskForm.placeholders.taskName')}
            />
            {errors.task_name && (
              <div className="field-error" id="task_name_error" role="alert">
                {errors.task_name}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="description">{t('taskForm.fields.description')}</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder={t('taskForm.placeholders.description')}
            ></textarea>
          </div>
        </div>
        
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start_time">
                {t('taskForm.fields.startTime')}
                <span className="required">*</span>
              </label>
              <input
                type="datetime-local"
                id="start_time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                aria-required="true"
                aria-invalid={!!errors.start_time}
                aria-describedby={errors.start_time ? "start_time_error" : undefined}
              />
              {errors.start_time && (
                <div className="field-error" id="start_time_error" role="alert">
                  {errors.start_time}
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="end_time">
                {t('taskForm.fields.endTime')}
                <span className="required">*</span>
              </label>
              <input
                type="datetime-local"
                id="end_time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                aria-required="true"
                aria-invalid={!!errors.end_time}
                aria-describedby={errors.end_time ? "end_time_error" : undefined}
              />
              {errors.end_time && (
                <div className="field-error" id="end_time_error" role="alert">
                  {errors.end_time}
                </div>
              )}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">{t('taskForm.fields.status')}</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Pending">{t('taskForm.status.pending')}</option>
                <option value="In Progress">{t('taskForm.status.inProgress')}</option>
                <option value="Completed">{t('taskForm.status.completed')}</option>
                <option value="Cancelled">{t('taskForm.status.cancelled')}</option>
              </select>
            </div>
            
            <div className="form-group skills-container" ref={skillsContainerRef}>
              <label htmlFor="skillInput">{t('taskForm.fields.requiredSkills')}</label>
              
              {/* Selected skills tags */}
              <div className="selected-skills" aria-live="polite">
                {formData.required_skills.map((skill, index) => (
                  <span key={skill} className="skill-tag" tabIndex="0">
                    {skill}
                    <button 
                      type="button" 
                      className="remove-skill-btn"
                      onClick={() => handleRemoveSkill(skill)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRemoveSkill(skill)}
                      aria-label={`Remove ${skill}`}
                      tabIndex="0"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              
              {/* Skills dropdown input */}
              <div className="skills-input-container">
                <input
                  type="text"
                  id="skillInput"
                  ref={skillInputRef}
                  className="form-input skills-input"
                  value={skillInput}
                  onChange={handleSkillInputChange}
                  onFocus={() => setShowSkillDropdown(true)}
                  onKeyDown={handleSkillInputKeyDown}
                  placeholder={t('taskForm.placeholders.requiredSkills')}
                  aria-controls="skills-dropdown"
                  aria-expanded={showSkillDropdown}
                  autoComplete="off"
                />
                <button 
                  type="button"
                  className="dropdown-toggle-btn"
                  onClick={toggleSkillDropdown}
                  aria-label={showSkillDropdown ? t('taskForm.aria.closeSkillsDropdown') : t('taskForm.aria.openSkillsDropdown')}
                >
                  <span className={`dropdown-arrow ${showSkillDropdown ? 'open' : ''}`} aria-hidden="true">▼</span>
                </button>
                
                {/* Skills dropdown */}
                {showSkillDropdown && (
                  <div 
                    id="skills-dropdown"
                    ref={skillDropdownRef}
                    className="skills-dropdown" 
                    role="listbox" 
                    aria-label={t('taskForm.aria.availableSkills')}
                  >
                    {filteredSkills.length > 0 ? (
                      filteredSkills.map((skill, index) => (
                        <div 
                          key={skill} 
                          className={`skill-option ${focusedSkillIndex === index ? 'focused' : ''}`}
                          role="option"
                          aria-selected={focusedSkillIndex === index}
                          onClick={() => handleSelectSkill(skill)}
                          onKeyDown={(e) => handleSkillOptionKeyDown(e, skill, index)}
                          tabIndex={focusedSkillIndex === index ? "0" : "-1"}
                        >
                          {skill}
                        </div>
                      ))
                    ) : (
                      <div className="skills-dropdown-empty">
                        {t('taskForm.noMatchingSkills')}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="skills-help-text">
                {t('taskForm.skillsHelpText', 'Type to search or select skills from the dropdown')}
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label={t('taskForm.buttons.cancelAriaLabel')}
          >
            {t('taskForm.buttons.cancel')}
          </button>
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" aria-hidden="true"></span>
                {isEditMode 
                  ? t('taskForm.buttons.updating') 
                  : t('taskForm.buttons.creating')
                }
              </>
            ) : (
              isEditMode 
                ? t('taskForm.buttons.update') 
                : t('taskForm.buttons.create')
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;