import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext'; 
import '../styles/Navbar.css';
import logoImage from '../assets/logo.png';
import { checkAuth } from '../apiservice/auth';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, fontSize, fontWeight, textContrast } = useTheme();

  // Check authentication status when component mounts
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await checkAuth();
        
        if (response.success && response.data.authenticated) {
          setIsLoggedIn(true);
          setUserInfo(response.data.user);
        } else {
          setIsLoggedIn(false);
          setUserInfo(null);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsLoggedIn(false);
        setUserInfo(null);
      }
    };

    checkAuthStatus();

    // Also listen for storage events to handle logout in other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'token' && !e.newValue) {
        setIsLoggedIn(false);
        setUserInfo(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Add scroll event listener
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Also check auth on location change
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await checkAuth();
        
        if (response.success && response.data.authenticated) {
          setIsLoggedIn(true);
          setUserInfo(response.data.user);
        } else {
          setIsLoggedIn(false);
          setUserInfo(null);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsLoggedIn(false);
        setUserInfo(null);
      }
    };

    checkAuthStatus();
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/logout/', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUserInfo(null);
        navigate('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  
  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`} role="banner">
      <div className="skip-link-container">
        <a 
          href="#main-content" 
          className="skip-link" 
          onClick={(e) => {
            e.preventDefault();
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
              mainContent.setAttribute('tabindex', '-1');
              mainContent.focus();
              window.scrollTo({
                top: mainContent.offsetTop - 100,
                behavior: 'smooth'
              });
            }
          }}
          aria-label="Skip to main content"
        >  
          Skip to main content
        </a>
      </div>
      
      <div className="navbar-container">
        <div className={`navbar-logo ${scrolled ? 'small' : ''}`}>
          <Link to="/events" aria-label="Samarthanam Trust homepage">
            <img src={logoImage} alt="Samarthanam Trust Logo" />
          </Link>
        </div>

        <button 
          className="menu-toggle" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-haspopup="menu"
        >
          <span className="sr-only">Menu</span>
          <div className="hamburger-icon" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>

        <nav 
          className={`primary-navigation ${isMenuOpen ? 'active' : ''}`} 
          id="primary-navigation"
          aria-label="Primary navigation"
          role="navigation"
        >
          <ul 
            className="nav-links" 
            role="menubar"
            aria-orientation="horizontal"
          >
            <li role="none">
              <Link 
                to="/events" 
                onClick={closeMenu}
                role="menuitem"
                aria-current={location.pathname.includes('/events') ? 'page' : undefined}
              >
                Events
              </Link>
            </li>
            <li role="none">
              <a 
                href="https://samarthanam.org/about-us/" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={closeMenu}
                role="menuitem"
                aria-label="About Us - Opens in a new tab"
              >
                About Us
              </a>
            </li>
            <li role="none">
              <Link 
                to="/contact"
                onClick={closeMenu}
                role="menuitem"
                aria-current={location.pathname === '/contact' ? 'page' : undefined}
              >
                Contact
              </Link>
            </li>
          </ul>

          <div 
            className="auth-buttons"
            role="region"
            aria-label="User authentication"
          >
            {isLoggedIn ? (
              <>
                <span className="user-greeting">Hello, {userInfo?.name?.split(' ')[0] || 'User'}</span>
                <button 
                  className="btn btn-logout" 
                  onClick={handleLogout}
                  aria-label="Log out of your account"
                  type="button"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="btn btn-login"
                onClick={closeMenu}
                aria-label="Log in to your account"
                role="button"
              >
                Login
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;