import { useState,useEffect } from 'react';
import "../styles/SignUpForm.css";
import { signup } from "../apiservice/auth"; // Changed from signUp to signup to match auth.js
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logoImage from "../assets/logo.png";

const SignUpForm = ({ onSubmit }) => {
  // Updated state to match the parameters expected by the signup function in auth.js
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    contact: "",
    age: "",
    location: "",
    organization: "",
    skills: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  
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
    if (!formData.skills.trim()) newErrors.skills = "Skills are required";
    
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
      // Destructure the formData to match the expected parameters
      const { name, password, email, contact, skills, age, location, organization } = formData;
      
      // Call the signup function with the parameters in the correct order
      const response = await signup(name, password, email, contact, skills, age, location, organization);
      
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
          skills: ""
        });
        setErrors({});
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
                <label htmlFor="name" className="form-label">Full Name</label>
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
                <label htmlFor="contact" className="form-label">Contact Number</label>
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
                <label htmlFor="email" className="form-label">Email ID</label>
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
                <label htmlFor="password" className="form-label">Password</label>
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
                <label htmlFor="age" className="form-label">Age</label>
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
                <label htmlFor="location" className="form-label">Location</label>
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
                <label htmlFor="organization" className="form-label">Organization/University/College</label>
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

            <div className="form-group">
                <label htmlFor="skills" className="form-label">Skills</label>
                <textarea
                id="skills"
                name="skills"
                className={`form-input ${errors.skills ? 'input-error' : ''}`}
                value={formData.skills}
                onChange={handleChange}
                placeholder="Enter your skills (e.g., programming, design, teaching)"
                aria-required="true"
                aria-invalid={!!errors.skills}
                aria-describedby={errors.skills ? "skills-error" : undefined}
                rows="3"
                ></textarea>
                {errors.skills && (
                <div id="skills-error" className="error-message" role="alert">
                    {errors.skills}
                </div>
                )}
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
            </div>
            </form>
        </section>
        </main>
    </div>

  );
};
export default SignUpForm;