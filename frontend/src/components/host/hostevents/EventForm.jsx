import React, { useState, useEffect } from 'react';
import '../../../styles/host/hostevents/EventForm.css';

const EventForm = ({ initialValues, onSubmit, isEditing = false }) => {
  // Default empty values
  const defaultValues = {
    event_name: '',
    overview: '',
    description: '',
    start_time: '',
    end_time: '',
    required_volunteers: '',
    status: 'Draft',
    location: '',
    image: null,
  };

  // Use provided initial values or defaults
  const [formData, setFormData] = useState({ ...defaultValues, ...initialValues });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Update form if initialValues changes
  useEffect(() => {
    if (initialValues) {
        // Format dates for datetime-local input if they exist
        const formattedValues = { ...initialValues };
        if (formattedValues.start_time) {
          formattedValues.start_time = formatDateForInput(formattedValues.start_time);
        }
        if (formattedValues.end_time) {
          formattedValues.end_time = formatDateForInput(formattedValues.end_time);
        }
        
        // Set the preview image if an existing URL is provided
        if (initialValues.existingImageUrl) {
          setPreviewImage(initialValues.existingImageUrl);
        }
        
        setFormData({ ...defaultValues, ...formattedValues });
      }
    }, [initialValues]);

  // Helper to format date strings for datetime-local input
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Format: YYYY-MM-DDThh:mm
    return date.toISOString().slice(0, 16);
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      // Handle file input
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file }));
      
      // Create image preview
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewImage(null);
      }
    } else if (type === 'number') {
      // Handle number inputs
      setFormData(prev => ({ ...prev, [name]: value === '' ? '' : parseInt(value, 10) }));
    } else {
      // Handle other inputs
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.event_name?.trim()) newErrors.event_name = 'Event name is required';
    if (!formData.overview?.trim()) newErrors.overview = 'Overview is required';
    if (!formData.description?.trim()) newErrors.description = 'Description is required';
    if (!formData.start_time) newErrors.start_time = 'Start time is required';
    if (!formData.end_time) newErrors.end_time = 'End time is required';
    if (!formData.location?.trim()) newErrors.location = 'Location is required';
    
    // Volunteers number validation
    if (formData.required_volunteers === '') {
      newErrors.required_volunteers = 'Required volunteers field is required';
    } else if (formData.required_volunteers < 1) {
      newErrors.required_volunteers = 'At least 1 volunteer is required';
    }
    
    // Date validation
    if (formData.start_time && formData.end_time) {
      const start = new Date(formData.start_time);
      const end = new Date(formData.end_time);
      
      if (end <= start) {
        newErrors.end_time = 'End time must be after start time';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      // Prepare form data for API
      const apiFormData = new FormData();
      
      // Add all form fields to FormData
      Object.entries(formData).forEach(([key, value]) => {
        // Skip null or empty values except for boolean values
        if (value !== null && value !== undefined && value !== '') {
          // Don't append empty image
          if (key === 'image' && !value) return;
          apiFormData.append(key, value);
        }
      });
      
      await onSubmit(apiFormData);
      
      // Only reset form after successful submission if not editing
      if (!isEditing) {
        setFormData(defaultValues);
        setPreviewImage(null);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      // Handle error response
    } finally {
      setIsSubmitting(false);
    }
  };

  const setToday = (timeField) => {
    const today = new Date();
    today.setMinutes(Math.ceil(today.getMinutes() / 15) * 15); // Round to nearest 15 min
    
    const formattedDate = today.toISOString().slice(0, 16);
    setFormData(prev => ({ ...prev, [timeField]: formattedDate }));
    
    // Clear error when field is set
    if (errors[timeField]) {
      setErrors(prev => ({ ...prev, [timeField]: null }));
    }
  };

  const setTomorrow = (timeField) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // Set to 9:00 AM
    
    const formattedDate = tomorrow.toISOString().slice(0, 16);
    setFormData(prev => ({ ...prev, [timeField]: formattedDate }));
    
    // Clear error when field is set
    if (errors[timeField]) {
      setErrors(prev => ({ ...prev, [timeField]: null }));
    }
  };

  const setEndTime = () => {
    if (!formData.start_time) {
      setErrors(prev => ({ 
        ...prev, 
        end_time: "Please set a start time first" 
      }));
      return;
    }
    
    const startTime = new Date(formData.start_time);
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 2); // Default to 2 hours later
    
    const formattedDate = endTime.toISOString().slice(0, 16);
    setFormData(prev => ({ ...prev, end_time: formattedDate }));
    
    // Clear error when field is set
    if (errors.end_time) {
      setErrors(prev => ({ ...prev, end_time: null }));
    }
  };

  const formatReadableDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit'
    });
  };

  return (
    <div className="event-form-container">
      <form className="event-form" onSubmit={handleSubmit} noValidate>
        {errors.form && (
          <div className="form-error" role="alert">
            {errors.form}
          </div>
        )}
        
        <div className="form-grid">
          {/* Basic Event Information */}
          <div className="form-section">
            <h3 className="section-title">Event Details</h3>
            
            <div className="form-field">
              <label htmlFor="event_name">
                Event Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="event_name"
                name="event_name"
                value={formData.event_name}
                onChange={handleChange}
                aria-required="true"
                aria-invalid={!!errors.event_name}
                aria-describedby={errors.event_name ? "event_name-error" : undefined}
              />
              {errors.event_name && (
                <div className="error-message" id="event_name-error" role="alert">
                  {errors.event_name}
                </div>
              )}
            </div>
            
            <div className="form-field">
              <label htmlFor="location">
                Location <span className="required">*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                aria-required="true"
                aria-invalid={!!errors.location}
                aria-describedby={errors.location ? "location-error" : undefined}
              />
              {errors.location && (
                <div className="error-message" id="location-error" role="alert">
                  {errors.location}
                </div>
              )}
            </div>
            
            <div className="form-field">
              <label htmlFor="status">Event Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Draft">Draft</option>
                <option value="Upcoming">Upcoming</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          {/* Date and Time */}
          <div className="form-section">
            <h3 className="section-title">Date & Time</h3>
            
            <div className="form-field">
              <label htmlFor="start_time">
                Start Time <span className="required">*</span>
              </label>
              <input
                type="datetime-local"
                id="start_time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                aria-required="true"
                aria-invalid={!!errors.start_time}
                aria-describedby={errors.start_time ? "start_time-error" : undefined}
              />
              {errors.start_time && (
                <div className="error-message" id="start_time-error" role="alert">
                  {errors.start_time}
                </div>
              )}
            </div>
            
            <div className="form-field">
              <label htmlFor="end_time">
                End Time <span className="required">*</span>
              </label>
              <input
                type="datetime-local"
                id="end_time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                aria-required="true"
                aria-invalid={!!errors.end_time}
                aria-describedby={errors.end_time ? "end_time-error" : undefined}
              />
              {errors.end_time && (
                <div className="error-message" id="end_time-error" role="alert">
                  {errors.end_time}
                </div>
              )}
            </div>
            
            <div className="form-field">
              <label htmlFor="required_volunteers">
                Required Volunteers <span className="required">*</span>
              </label>
              <input
                type="number"
                id="required_volunteers"
                name="required_volunteers"
                min="1"
                value={formData.required_volunteers}
                onChange={handleChange}
                aria-required="true"
                aria-invalid={!!errors.required_volunteers}
                aria-describedby={errors.required_volunteers ? "required_volunteers-error" : undefined}
              />
              {errors.required_volunteers && (
                <div className="error-message" id="required_volunteers-error" role="alert">
                  {errors.required_volunteers}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Event Description */}
        <div className="form-section full-width">
          <h3 className="section-title">Event Description</h3>
          
          <div className="form-field">
            <label htmlFor="overview">
              Overview <span className="required">*</span>
              <span className="field-hint">(Brief summary of the event)</span>
            </label>
            <textarea
              id="overview"
              name="overview"
              value={formData.overview}
              onChange={handleChange}
              rows="3"
              aria-required="true"
              aria-invalid={!!errors.overview}
              aria-describedby={errors.overview ? "overview-error" : undefined}
            ></textarea>
            {errors.overview && (
              <div className="error-message" id="overview-error" role="alert">
                {errors.overview}
              </div>
            )}
          </div>
          
          <div className="form-field">
            <label htmlFor="description">
              Detailed Description <span className="required">*</span>
              <span className="field-hint">(Provide comprehensive details for volunteers)</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="6"
              aria-required="true"
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "description-error" : undefined}
            ></textarea>
            {errors.description && (
              <div className="error-message" id="description-error" role="alert">
                {errors.description}
              </div>
            )}
          </div>
        </div>
        
        {/* Event Image */}
        <div className="form-section full-width">
          <h3 className="section-title">Event Image</h3>
          
          <div className="form-field">
            <label htmlFor="image">
              Event Banner Image
              <span className="field-hint">(Recommended size: 1200 x 630px)</span>
            </label>
            
            <div className="image-upload-container">
              <input
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleChange}
                className="image-input"
              />
              
              <label htmlFor="image" className="image-upload-label">
                {previewImage ? "Change Image" : "Choose Image"}
              </label>
              
              {previewImage && (
                <div className="image-preview">
                  <img src={previewImage} alt="Event preview" />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="button" 
            className="btn-secondary"
            onClick={() => window.history.back()}
          >
            Cancel
          </button>
          
          <button 
            type="submit" 
            className="btn-primary"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting 
              ? 'Saving...' 
              : (isEditing ? 'Update Event' : 'Create Event')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventForm;