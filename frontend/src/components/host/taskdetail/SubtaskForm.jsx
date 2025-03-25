import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { addSubtask, updateTask } from '../../../apiservice/task';
import '../../../styles/host/taskdetail/SubtaskForm.css';

/**
 * Form component for adding or editing subtasks
 * @param {Object} props
 * @param {number} props.taskId - ID of the parent task
 * @param {string} props.mode - 'create' or 'edit'
 * @param {Object} props.subtask - Subtask data for editing (required in edit mode)
 * @param {Function} props.onSuccess - Callback when form is successfully submitted
 * @param {Function} props.onCancel - Callback when form is cancelled
 * @param {Object} props.parentTaskInfo - Optional parent task information
 */
const SubtaskForm = ({ 
  taskId, 
  mode = 'create', 
  subtask = null,
  onSuccess, 
  onCancel,
  parentTaskInfo = null
}) => {
  const { t } = useTranslation();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    status: 'Pending'
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Set initial form data when editing
  useEffect(() => {
    if (mode === 'edit' && subtask) {
      // Format dates for input fields
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
      };

      setFormData({
        title: subtask.title || '',
        description: subtask.description || '',
        start_time: formatDateForInput(subtask.start_time),
        end_time: formatDateForInput(subtask.end_time),
        status: subtask.status || 'Pending'
      });
    } else if (parentTaskInfo) {
      // For new subtasks, set default dates based on parent task
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
      };

      setFormData(prev => ({
        ...prev,
        start_time: formatDateForInput(parentTaskInfo.start_time),
        end_time: formatDateForInput(parentTaskInfo.end_time)
      }));
    }
  }, [mode, subtask, parentTaskInfo]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field-specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = t('subtaskForm.errors.titleRequired');
    }
    
    if (!formData.start_time) {
      errors.start_time = t('subtaskForm.errors.startTimeRequired');
    }
    
    if (!formData.end_time) {
      errors.end_time = t('subtaskForm.errors.endTimeRequired');
    }
    
    // Validate start time is before end time
    if (formData.start_time && formData.end_time) {
      const startTime = new Date(formData.start_time);
      const endTime = new Date(formData.end_time);
      
      if (startTime > endTime) {
        errors.end_time = t('subtaskForm.errors.endTimeBeforeStart');
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Process dates
      const processedData = {
        ...formData,
        start_time: formData.start_time ? new Date(formData.start_time).toISOString() : null,
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null
      };
      
      let response;
      
      if (mode === 'create') {
        // Add new subtask
        response = await addSubtask({
          task_id: taskId,
          ...processedData
        });
      } else {
        // Update existing subtask
        response = await updateTask({
          task_id: subtask.id,
          ...processedData,
          is_subtask: true // Flag to indicate this is a subtask update
        });
      }
      
      if (response.success) {
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        setError(response.error || t('subtaskForm.errors.submissionFailed'));
      }
    } catch (err) {
      console.error('Error submitting subtask form:', err);
      setError(t('subtaskForm.errors.submissionFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subtask-form-container">
      <div className="subtask-form-header">
        <h2>
          {mode === 'create' 
            ? t('subtaskForm.createTitle') 
            : t('subtaskForm.editTitle')}
        </h2>
        <button 
          className="close-form-button"
          onClick={onCancel}
          aria-label={t('subtaskForm.close')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      
      {error && (
        <div className="form-error">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="subtask-form">
        <div className="form-group">
          <label htmlFor="subtask-title">
            {t('subtaskForm.title')}
            <span className="required">*</span>
          </label>
          <input
            id="subtask-title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder={t('subtaskForm.titlePlaceholder')}
            className={formErrors.title ? 'error' : ''}
            required
          />
          {formErrors.title && <div className="field-error">{formErrors.title}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="subtask-description">{t('subtaskForm.description')}</label>
          <textarea
            id="subtask-description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={t('subtaskForm.descriptionPlaceholder')}
            rows="3"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="subtask-start-time">
              {t('subtaskForm.startTime')}
              <span className="required">*</span>
            </label>
            <input
              id="subtask-start-time"
              type="datetime-local"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              className={formErrors.start_time ? 'error' : ''}
              required
            />
            {formErrors.start_time && <div className="field-error">{formErrors.start_time}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="subtask-end-time">
              {t('subtaskForm.endTime')}
              <span className="required">*</span>
            </label>
            <input
              id="subtask-end-time"
              type="datetime-local"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              className={formErrors.end_time ? 'error' : ''}
              required
            />
            {formErrors.end_time && <div className="field-error">{formErrors.end_time}</div>}
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="subtask-status">{t('subtaskForm.status')}</label>
          <select
            id="subtask-status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="Pending">{t('subtaskForm.statuses.pending')}</option>
            <option value="In Progress">{t('subtaskForm.statuses.inProgress')}</option>
            <option value="Completed">{t('subtaskForm.statuses.completed')}</option>
            <option value="Cancelled">{t('subtaskForm.statuses.cancelled')}</option>
            <option value="Delayed">{t('subtaskForm.statuses.delayed')}</option>
          </select>
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={onCancel}
            disabled={loading}
          >
            {t('subtaskForm.cancel')}
          </button>
          
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                {t('subtaskForm.submitting')}
              </>
            ) : (
              mode === 'create' 
                ? t('subtaskForm.create') 
                : t('subtaskForm.update')
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SubtaskForm;