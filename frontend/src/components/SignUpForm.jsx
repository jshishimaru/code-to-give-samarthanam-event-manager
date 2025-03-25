import { useState, useEffect, useRef } from 'react';
import "../styles/SignUpForm.css";
import { signup } from "../apiservice/auth"; 
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Predefined list of skills
const AVAILABLE_SKILLS = [
  "Web Development", "Mobile Development", "UI/UX Design", "Project Management",
  "Teaching", "Content Writing", "Social Media", "Photography", "Event Planning",
  "Public Speaking", "Graphic Design", "Data Analysis", "Translation",
  "Accounting", "Legal Support", "Healthcare", "Mentoring", "Marketing"
];

const SignUpForm = ({ onSubmit }) => {
  // Existing state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    contact: "",
    age: "",
    location: "",
    organization: "",
    skills: [],
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [filteredSkills, setFilteredSkills] = useState([]);
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [focusedSkillIndex, setFocusedSkillIndex] = useState(-1);
  const skillDropdownRef = useRef(null);
  const skillInputRef = useRef(null);
  const skillsContainerRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Filter available skills based on input
  useEffect(() => {
    if (skillInput.trim() === "") {
      setFilteredSkills(AVAILABLE_SKILLS.filter(skill => !formData.skills.includes(skill)));
    } else {
      const filtered = AVAILABLE_SKILLS.filter(
        skill => skill.toLowerCase().includes(skillInput.toLowerCase()) && 
                 !formData.skills.includes(skill)
      );
      setFilteredSkills(filtered);
    }
    // Reset focused index when filtered skills change
    setFocusedSkillIndex(-1);
  }, [skillInput, formData.skills]);
  
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ""
      });
    }
  };

  // Handle skill selection from dropdown
const handleSelectSkill = (skill) => {
  if (!formData.skills.includes(skill)) {
    setFormData({
      ...formData,
      skills: [...formData.skills, skill]
    });
    setSkillInput("");
    
    // Close the dropdown after selection
    setShowSkillDropdown(false);
    
    // Clear any skills error
    if (errors.skills) {
      setErrors({
        ...errors,
        skills: ""
      });
    }
    
    // Focus back on the input after selection
    if (skillInputRef.current) {
      skillInputRef.current.focus();
    }
  }
};

// Handle removing a skill tag
const handleRemoveSkill = (skillToRemove) => {
  setFormData({
    ...formData,
    skills: formData.skills.filter(skill => skill !== skillToRemove)
  });
};

// Handle input for skill search
const handleSkillInputChange = (e) => {
  setSkillInput(e.target.value);
  // Only show dropdown if there's input text
  setShowSkillDropdown(e.target.value.trim().length > 0);
};

// Toggle the dropdown visibility
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
    // Tab - special handling to allow keyboard navigation
    else if (e.key === 'Tab' && showSkillDropdown && focusedSkillIndex >= 0) {
      e.preventDefault();
      handleSelectSkill(filteredSkills[focusedSkillIndex]);
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = "Full name is required";
    
    if (!formData.contact.trim()) {
      newErrors.contact = "Contact number is required";
    } else if (!/^\d{10}$/.test(formData.contact)) {
      newErrors.contact = "Contact number must be 10 digits";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email address is invalid";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    if (!formData.age.trim()) {
      newErrors.age = "Age is required";
    } else if (isNaN(formData.age) || parseInt(formData.age) < 18) {
      newErrors.age = "Age must be at least 18";
    }
    
    if (!formData.organization.trim()) newErrors.organization = "Organization/University/College is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    
    if (formData.skills.length < 2) {
      newErrors.skills = "Please select at least 2 skills";
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      toast.error("Please fix the errors in the form.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const skillsString = formData.skills.join(", ");
      const { name, password, email, contact, age, location, organization } = formData;
      
      const response = await signup(name, password, email, contact, skillsString, age, location, organization);
      
      if (response && response.success) {
        toast.success("Signup successful!");
        
        if (onSubmit) onSubmit(formData);
        
        setFormData({
          name: "",
          email: "",
          password: "",
          contact: "",
          age: "",
          location: "",
          organization: "",
          skills: []
        });
        setErrors({});
        navigate('/login');
      } else {
        const errorMessage = response?.data?.message || "Failed to sign up. Please try again.";
        
        if (errorMessage.includes("Email already registered")) {
          setErrors(prev => ({ ...prev, email: "This email is already registered" }));
          toast.error("This email is already registered. Please use a different email or login to your existing account.");
        } 
        else if (errorMessage.includes("Contact already registered")) {
          setErrors(prev => ({ ...prev, contact: "This contact number is already registered" }));
          toast.error("This contact number is already registered. Please use a different number or login to your existing account.");
        }
        else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      
      let errorMessage = "Failed to sign up. Please try again.";
      
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <main className="signup-container" id="main-content">
        <ToastContainer position="top-right" autoClose={5000} />

        <header className="signup-header">
          <h1 className="signup-title">Sign Up</h1>
        </header>
        
        <form className="signup-form" onSubmit={handleSubmit} noValidate aria-labelledby="signup-title">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                <span className="required-field" aria-hidden="true">*</span> Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                tabIndex="1"
              />
              {errors.name && (
                <div id="name-error" className="error-message" role="alert">
                  {errors.name}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <span className="required-field" aria-hidden="true">*</span> Email ID
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                aria-required="true"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                tabIndex="2"
              />
              {errors.email && (
                <div id="email-error" className="error-message" role="alert">
                  {errors.email}
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <span className="required-field" aria-hidden="true">*</span> Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password (min 8 characters)"
                aria-required="true"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                tabIndex="3"
              />
              {errors.password && (
                <div id="password-error" className="error-message" role="alert">
                  {errors.password}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="contact" className="form-label">
                <span className="required-field" aria-hidden="true">*</span> Contact Number
              </label>
              <input
                type="tel"
                id="contact"
                name="contact"
                className={`form-input ${errors.contact ? 'input-error' : ''}`}
                value={formData.contact}
                onChange={handleChange}
                placeholder="10-digit contact number"
                pattern="[0-9]{10}"
                aria-required="true"
                aria-invalid={!!errors.contact}
                aria-describedby={errors.contact ? "contact-error" : undefined}
                tabIndex="4"
              />
              {errors.contact && (
                <div id="contact-error" className="error-message" role="alert">
                  {errors.contact}
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="age" className="form-label">
                <span className="required-field" aria-hidden="true">*</span> Age
              </label>
              <input
                type="number"
                id="age"
                name="age"
                className={`form-input ${errors.age ? 'input-error' : ''}`}
                value={formData.age}
                onChange={handleChange}
                placeholder="Must be 18 or older"
                min="18"
                aria-required="true"
                aria-invalid={!!errors.age}
                aria-describedby={errors.age ? "age-error" : undefined}
                tabIndex="5"
              />
              {errors.age && (
                <div id="age-error" className="error-message" role="alert">
                  {errors.age}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="location" className="form-label">
                <span className="required-field" aria-hidden="true">*</span> Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                className={`form-input ${errors.location ? 'input-error' : ''}`}
                value={formData.location}
                onChange={handleChange}
                placeholder="City, State"
                aria-required="true"
                aria-invalid={!!errors.location}
                aria-describedby={errors.location ? "location-error" : undefined}
                tabIndex="6"
              />
              {errors.location && (
                <div id="location-error" className="error-message" role="alert">
                  {errors.location}
                </div>
              )}
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="organization" className="form-label">
              <span className="required-field" aria-hidden="true">*</span> Organization/University/College
            </label>
            <input
              type="text"
              id="organization"
              name="organization"
              className={`form-input ${errors.organization ? 'input-error' : ''}`}
              value={formData.organization}
              onChange={handleChange}
              placeholder="Enter your organization, university, or college"
              aria-required="true"
              aria-invalid={!!errors.organization}
              aria-describedby={errors.organization ? "organization-error" : undefined}
              tabIndex="7"
            />
            {errors.organization && (
              <div id="organization-error" className="error-message" role="alert">
                {errors.organization}
              </div>
            )}
          </div>

          <div className="form-group skills-container full-width" ref={skillsContainerRef}>
            <label htmlFor="skillInput" className="form-label">
              <span className="required-field" aria-hidden="true">*</span> Skills (select at least 2)
            </label>
            
            <div className="selected-skills" aria-live="polite">
              {formData.skills.map((skill, index) => (
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
            
            <div className="skills-input-container">
              <input
                type="text"
                id="skillInput"
                ref={skillInputRef}
                className={`form-input skills-input ${errors.skills ? 'input-error' : ''}`}
                value={skillInput}
                onChange={handleSkillInputChange}
                onFocus={() => setShowSkillDropdown(true)}
                onKeyDown={handleSkillInputKeyDown}
                placeholder="Type to search skills"
                aria-required="true"
                aria-invalid={!!errors.skills}
                aria-describedby="skills-help skills-error"
                aria-controls="skills-dropdown"
                aria-expanded={showSkillDropdown}
                autoComplete="off"
                tabIndex="8"
              />
              <button 
                type="button"
                className="dropdown-toggle-btn"
                onClick={toggleSkillDropdown}
                aria-label={showSkillDropdown ? "Close skills dropdown" : "Open skills dropdown"}
                tabIndex="0"
              >
                <span className={`dropdown-arrow ${showSkillDropdown ? 'open' : ''}`} aria-hidden="true">▼</span>
              </button>
              {showSkillDropdown && filteredSkills.length > 0 && (
                <div 
                  id="skills-dropdown"
                  ref={skillDropdownRef}
                  className="skills-dropdown" 
                  role="listbox" 
                  aria-label="Available skills"
                >
                  {filteredSkills.map((skill, index) => (
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
                  ))}
                </div>
              )}
            </div>
            
            {errors.skills && (
              <div id="skills-error" className="error-message" role="alert">
                {errors.skills}
              </div>
            )}
            <div id="skills-help" className="skills-help-text">
              Use up/down arrows to navigate skills, Enter to select, Escape to close dropdown
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="signup-button"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              tabIndex="9"
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
            
            <div className="login-link-container">
              Already have an account? <Link to="/login" className="login-link" tabIndex="10">Login</Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default SignUpForm;