import { useState, useEffect } from 'react';
import "../styles/SignUpForm.css";
import { signup } from "../apiservice/auth"; 
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logoImage from "../assets/logo.png";

// Predefined list of skills that users can select from
const AVAILABLE_SKILLS = [
  "Web Development", "Mobile Development", "UI/UX Design", "Project Management",
  "Teaching", "Content Writing", "Social Media", "Photography", "Event Planning",
  "Public Speaking", "Graphic Design", "Data Analysis", "Translation",
  "Accounting", "Legal Support", "Healthcare", "Mentoring", "Marketing"
];

const SignUpForm = ({ onSubmit }) => {
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
  }, [skillInput, formData.skills]);
  
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
    setFormData({
      ...formData,
      skills: [...formData.skills, skill]
    });
    setSkillInput("");
    
    // Clear any skills error
    if (errors.skills) {
      setErrors({
        ...errors,
        skills: ""
      });
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
    setShowSkillDropdown(true);
  };

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
    
    // Check that at least 2 skills are selected
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
      // Convert skills array to comma-separated string for the API
      const skillsString = formData.skills.join(", ");
      
      // Destructure the formData to match the expected parameters
      const { name, password, email, contact, age, location, organization } = formData;
      
      // Call the signup function with the parameters in the correct order
      const response = await signup(name, password, email, contact, skillsString, age, location, organization);
      
      if (response && response.success) {
        toast.success("Signup successful!");

        if (onSubmit) onSubmit(formData);
        
        // Clear form after successful submission
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
		setTimeout(() => {
		   navigate('/login');
		}, 2000);
      } else {
        toast.error(response?.data?.message || "Failed to sign up. Please try again.");
      }
    } catch (error) {
      toast.error(error.message || "Failed to sign up. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="logo-container">
        <img 
          src={logoImage} 
          alt="Company Logo" 
          className="logo-image"
        />
        <h2 className="logo-tagline">Join our community today</h2>
      </div>
      <main className="signup-container">
        <ToastContainer position="top-right" autoClose={5000} />



        <section aria-labelledby="signup-title">
          <h1 id="signup-title" className="signup-title">Sign Up</h1>
          <p className="signup-description">Please fill in your details to register</p>
          
          <form className="signup-form" onSubmit={handleSubmit} noValidate aria-label="Sign-up form">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                <span className="required-field">*</span> Full Name
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
              />
              {errors.name && (
                <div id="name-error" className="error-message" role="alert">
                  {errors.name}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="contact" className="form-label">
                <span className="required-field">*</span> Contact Number
              </label>
              <input
                type="tel"
                id="contact"
                name="contact"
                className={`form-input ${errors.contact ? 'input-error' : ''}`}
                value={formData.contact}
                onChange={handleChange}
                placeholder="Enter your 10-digit contact number"
                pattern="[0-9]{10}"
                aria-required="true"
                aria-invalid={!!errors.contact}
                aria-describedby={errors.contact ? "contact-error" : undefined}
              />
              {errors.contact && (
                <div id="contact-error" className="error-message" role="alert">
                  {errors.contact}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <span className="required-field">*</span> Email ID
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
              />
              {errors.email && (
                <div id="email-error" className="error-message" role="alert">
                  {errors.email}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <span className="required-field">*</span> Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                aria-required="true"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              {errors.password && (
                <div id="password-error" className="error-message" role="alert">
                  {errors.password}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="age" className="form-label">
                <span className="required-field">*</span> Age
              </label>
              <input
                type="number"
                id="age"
                name="age"
                className={`form-input ${errors.age ? 'input-error' : ''}`}
                value={formData.age}
                onChange={handleChange}
                placeholder="Enter your age"
                min="18"
                aria-required="true"
                aria-invalid={!!errors.age}
                aria-describedby={errors.age ? "age-error" : undefined}
              />
              {errors.age && (
                <div id="age-error" className="error-message" role="alert">
                  {errors.age}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="location" className="form-label">
                <span className="required-field">*</span> Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                className={`form-input ${errors.location ? 'input-error' : ''}`}
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter your location"
                aria-required="true"
                aria-invalid={!!errors.location}
                aria-describedby={errors.location ? "location-error" : undefined}
              />
              {errors.location && (
                <div id="location-error" className="error-message" role="alert">
                  {errors.location}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="organization" className="form-label">
                <span className="required-field">*</span> Organization/University/College
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
              />
              {errors.organization && (
                <div id="organization-error" className="error-message" role="alert">
                  {errors.organization}
                </div>
              )}
            </div>

            <div className="form-group skills-container">
              <label htmlFor="skillInput" className="form-label">
                <span className="required-field">*</span> Skills (select at least 2)
              </label>
              
              {/* Display selected skills as tags */}
              <div className="selected-skills" aria-live="polite">
                {formData.skills.map(skill => (
                  <span key={skill} className="skill-tag">
                    {skill}
                    <button 
                      type="button" 
                      className="remove-skill-btn"
                      onClick={() => handleRemoveSkill(skill)}
                      aria-label={`Remove ${skill} skill`}
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
                  className={`form-input skills-input ${errors.skills ? 'input-error' : ''}`}
                  value={skillInput}
                  onChange={handleSkillInputChange}
                  onFocus={() => setShowSkillDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSkillDropdown(false), 200)}
                  placeholder="Search and select skills"
                  aria-required="true"
                  aria-invalid={!!errors.skills}
                  aria-describedby={errors.skills ? "skills-error" : undefined}
                  autoComplete="off"
                />
                
                {showSkillDropdown && filteredSkills.length > 0 && (
                  <div className="skills-dropdown" role="listbox" aria-label="Available skills">
                    {filteredSkills.map(skill => (
                      <div 
                        key={skill} 
                        className="skill-option" 
                        role="option"
                        onClick={() => handleSelectSkill(skill)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSelectSkill(skill)}
                        tabIndex="0"
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
              <div className="skills-help-text">
                Select at least 2 skills that you can contribute with
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="signup-button"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Sign Up"}
              </button>
              <div className="login-link-container">
                Already have an account? <a href="/login" className="login-link">Login</a>
              </div>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default SignUpForm;