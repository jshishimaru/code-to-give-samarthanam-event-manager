import { useState } from 'react';
import "../styles/LoginForm.css";
import { login, loginHost } from "../apiservice/auth";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logoImage from "../assets/logo.png"; 
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';


const LoginForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "volunteer" // Default role
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleRoleChange = (role) => {
    setFormData((prevData) => ({
      ...prevData,
      role
    }));
  };

  // Update the handleSubmit function in LoginForm.jsx

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Determine which login function to use based on role
      const loginFn = formData.role === 'volunteer' ? login : loginHost;
      
      console.log(`Using ${formData.role === 'volunteer' ? 'login' : 'loginHost'} function for role: ${formData.role}`);
      
      const response = await loginFn(formData.email, formData.password);
    
      console.log('Login response:', response);

      if (response.success) {
        // Store token in localStorage
        localStorage.setItem('token', 'authenticated');
        localStorage.setItem('userRole', formData.role);
        if (response.data.user_id) {
          localStorage.setItem('userId', response.data.user_id);
        }
        
        toast.success("Login successful!");
        
        if (formData.role === 'volunteer') {
          setTimeout(() => navigate('/events'), 1000);
        } else {
          setTimeout(() => navigate('/host/events'), 1000);
        }
        
        if (onSubmit) onSubmit(response, formData.role);
      } else {
        toast.error(response.data || "Login failed. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again later.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Implement forgot password functionality
    toast.info("Password reset link will be sent to your email.");
  };

  return (
    <div className="page-container">
      <div className="logo-container">
        <img 
          src={logoImage} 
          alt="Company Logo" 
          className="logo-image"
        />
        <h2 className="logo-tagline">Welcome back</h2>
      </div>
      <main className="login-container">
        <ToastContainer position="top-right" autoClose={3000} />
        
        <section className="login-card">
          <h1 id="login-heading">Account Login</h1>
          
          <form onSubmit={handleSubmit} aria-labelledby="login-heading">
            <fieldset className="role-selection">
              <legend className="visually-hidden">Select your role</legend>
              <div className="role-buttons" role="radiogroup" aria-label="User role">
                <button 
                  type="button"
                  onClick={() => handleRoleChange('volunteer')}
                  className={`role-button ${formData.role === 'volunteer' ? 'active' : ''}`}
                  aria-pressed={formData.role === 'volunteer'}
                  aria-label="Login as volunteer"
                >
                  Volunteer
                </button>
                <button 
                  type="button"
                  onClick={() => handleRoleChange('organiser')}
                  className={`role-button ${formData.role === 'organiser' ? 'active' : ''}`}
                  aria-pressed={formData.role === 'organiser'}
                  aria-label="Login as organiser"
                >
                  Organiser
                </button>
              </div>
            </fieldset>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                aria-required="true"
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                aria-required="true"
                placeholder="Enter your password"
              />
            </div>

            <button 
              type="submit" 
              className="login-button" 
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>

            {formData.role === 'volunteer' && (
              <a href="/signup" className="signup-button" role="button">
                Sign Up
              </a>
            )}

            <button 
              type="button" 
              className="forgot-password-button" 
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default LoginForm;