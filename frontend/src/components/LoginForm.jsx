import { useState } from 'react';
import "../styles/LoginForm.css";
import { login, loginHost } from "../apiservice/auth";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoginForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'volunteer' // Default role
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user types in a field with an error
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleRoleChange = (role) => {
    setFormData({
      ...formData,
      role
    });
  };

  const handleCheckboxChange = (e) => {
    setRememberMe(e.target.checked);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("button pressed");
    
    // Validate form before submission
    // if (!validateForm()) {
      //   return;
      // }
      
      setIsLoading(true);
    
    try {
      // Choose the appropriate login function based on role
      const authFunction = formData.role === 'organiser' ? loginHost : login;
      const response = await authFunction(formData.email, formData.password);
      
      if (response && response.success === true) {
        // Success case
        console.log("Login successful!");
        toast.success("Login successful!");
        
        // If onSubmit prop is provided, call it with the data
        if (onSubmit) {
          onSubmit(response.data);
        }
        
        // Navigate to homepage or next page
        // Commenting out for now as it was commented in original code
        // navigate('/homepage/assignments');
      } else {
        // Error case - the API returned a response but with success = false
        const errorMessage = response?.data || "Invalid credentials. Please try again.";
        toast.error(errorMessage);
        
        // Set general error that will be displayed at the top
        setErrors({
          ...errors,
          general: errorMessage
        });
      }
    } catch (error) {
      // Handle unexpected errors
      console.error("Login error:", error);
      const errorMessage = "An error occurred during login. Please try again later.";
      toast.error(errorMessage);
      
      setErrors({
        ...errors,
        general: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="login-container">
      {/* Add ToastContainer for notifications */}
      <ToastContainer 
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <h1 className="login-title" tabIndex="0">Log In</h1>
      
      {/* Display general error if any */}
      {/* {errors.general && (
        <div className="general-error" role="alert">
          {errors.general}
        </div>
      )} */}
      
      <div className="login-role-selection">
        <button
          type="button"
          className={`role-button ${formData.role === 'organiser' ? 'active' : ''}`}
          onClick={() => handleRoleChange('organiser')}
          aria-label="Log in as organiser"
          tabIndex="1"
        >
          Organiser
        </button>
        <span className="role-separator" aria-hidden="true"></span>
        <button
          type="button"
          className={`role-button ${formData.role === 'volunteer' ? 'active' : ''}`}
          onClick={() => handleRoleChange('volunteer')}
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
          {/* {errors.email && (
            <p id="email-error" className="error-message" role="alert">
              {errors.email}
            </p>
          )} */}
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
          {/* {errors.password && (
            <p id="password-error" className="error-message" role="alert">
              {errors.password}
            </p>
          )} */}
        </div>

        <button
          type="submit"
          className="submit-button"
          aria-label="Sign in to your account"
          disabled={isLoading}
          tabIndex="5"
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      
      {formData.role === 'volunteer' && (
        <div className="sign-up">
          <a href="#" className="sign-up-link" tabIndex="7">
            Sign Up
          </a>
        </div>
      )}
      
      <div className="forgot-password">
        <a href="#" className="forgot-link" tabIndex="6">
          Forgot password?
        </a>
      </div>
    </section>
  );
};

export default LoginForm;