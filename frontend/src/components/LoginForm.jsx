import { useState } from 'react';
import "../styles/LoginForm.css";

const LoginForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCheckboxChange = (e) => {
    setRememberMe(e.target.checked);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (Object.keys(newErrors).length === 0) {
      // If no errors, proceed with submission
      onSubmit?.({ ...formData, rememberMe });
    } else {
      setErrors(newErrors);
      // Add shake animation to form on error
      document.querySelector('.login-form').classList.add('form-error-shake');
      setTimeout(() => {
        document.querySelector('.login-form').classList.remove('form-error-shake');
      }, 500);
    }
  };

  return (
    <section className="login-container">
      <h1 className="login-title" tabIndex="0">Log In</h1>
      
      <div className="login-role-selection">
        <button
          type="button"
          className={`role-button ${formData.role === 'organiser' ? 'selected' : ''}`}
          onClick={() => setFormData({ ...formData, role: 'organiser' })}
          aria-label="Log in as organiser"
          tabIndex="1"
        >
          Organiser
        </button>
        <span className="role-separator" aria-hidden="true"></span>
        <button
          type="button"
          className={`role-button ${formData.role === 'volunteer' ? 'selected' : ''}`}
          onClick={() => setFormData({ ...formData, role: 'volunteer' })}
          aria-label="Log in as volunteer"
          tabIndex="2"
        >
          Volunteer
        </button>
      </div>
        
      <form onSubmit={handleSubmit} noValidate className="login-form">
        <div className="form-group">
          <label 
            htmlFor="email" 
            className="form-label"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`form-input ${errors.email ? 'input-error' : ''}`}
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            tabIndex="3"
            autoComplete="email"
          />
          {errors.email && (
            <p id="email-error" className="error-message" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        <div className="form-group">
          <label 
            htmlFor="password" 
            className="form-label"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`form-input ${errors.password ? 'input-error' : ''}`}
            aria-required="true"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            tabIndex="4"
            autoComplete="current-password"
          />
          {errors.password && (
            <p id="password-error" className="error-message" role="alert">
              {errors.password}
            </p>
          )}
        </div>

        {/* <div className="remember-me">
          <input
            type="checkbox"
            id="remember"
            name="remember"
            className="checkbox"
            checked={rememberMe}
            onChange={handleCheckboxChange}
            tabIndex="5"
          />
          <label htmlFor="remember" className="checkbox-label">
            Remember me
          </label>
        </div> */}

        <button
          type="submit"
          className="submit-button"
          aria-label="Sign in to your account"
          tabIndex="5"
        >
          Log In
        </button>
      </form>
      
      <div className="forgot-password">
        <a href="#" className="forgot-link" tabIndex="6">
          Forgot password?
        </a>
      </div>

      <div className="sign-up">
          <a href="#" className="sign-up-link" tabIndex="7">
            Sign Up
          </a>
      </div>
    </section>
  );
};

export default LoginForm;