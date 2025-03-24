import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { addTaskToEvent, updateTask } from '../../../apiservice/task';
import '../../../styles/host/hosttask/TaskForm.css';

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
    required_skills: ''
  });
  
  // Track validation errors and submission state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Initialize form data in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      // Format dates for date inputs
      const formattedData = {
        ...initialData,
        start_time: initialData.start_time ? formatDateForInput(initialData.start_time) : '',
        end_time: initialData.end_time ? formatDateForInput(initialData.end_time) : '',
        required_skills: Array.isArray(initialData.skills_list) 
          ? initialData.skills_list.join(', ')
          : initialData.required_skills || ''
      };
      setFormData(formattedData);
    }
  }, [isEditMode, initialData]);
  
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
      
      if (isEditMode) {
        // Update existing task
        response = await updateTask({
          task_id: initialData.id,
          ...formData
        });
      } else {
        // Create new task
        response = await addTaskToEvent({
          event_id: eventId,
          ...formData
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
            
            <div className="form-group">
              <label htmlFor="required_skills">{t('taskForm.fields.requiredSkills')}</label>
              <input
                type="text"
                id="required_skills"
                name="required_skills"
                value={formData.required_skills}
                onChange={handleChange}
                placeholder={t('taskForm.placeholders.requiredSkills')}
                aria-describedby="skills_help"
              />
              <div className="field-help" id="skills_help">
                {t('taskForm.help.skills')}
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