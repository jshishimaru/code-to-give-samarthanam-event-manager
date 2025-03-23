import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext'; 
import '../styles/Navbar.css';
import logoImage from '../assets/logo.png';
import { checkAuth } from '../apiservice/auth';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, fontSize, fontWeight, textContrast } = useTheme();
  const { t } = useTranslation();

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

  const handleSkipToMainContent = (e) => {
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
          onClick={handleSkipToMainContent}
          aria-label={t('navbar.skipToMainContent')}
        >  
          {t('navbar.skipToMainContent')}
        </a>
      </div>
      
      <div className="navbar-container">
        <div className={`navbar-logo ${scrolled ? 'small' : ''}`}>
          <Link to="/events" aria-label={t('navbar.logoAlt')}>
            <img src={logoImage} alt={t('navbar.logoAlt')} />
          </Link>
        </div>

        <button 
          className="menu-toggle" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
          aria-label={isMenuOpen ? t('navbar.menuClose') : t('navbar.menuOpen')}
          aria-haspopup="menu"
        >
          <span className="sr-only">{t('navbar.menu')}</span>
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
                {t('navbar.events')}
              </Link>
            </li>
            {/* <li role="none">
              <Link 
                to="/my-events"
                onClick={closeMenu}
                role="menuitem"
                aria-current={location.pathname.includes('/my-events') ? 'page' : undefined}
              >
                {t('navbar.myEvents')}
              </Link>
            </li> */}
            <li role="none">
              <a 
                href="https://samarthanam.org/about-us/" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={closeMenu}
                role="menuitem"
                aria-label="About Us - Opens in a new tab"
              >
                {t('navbar.about')}
              </a>
              {/* <Link
                to="/about"
                onClick={closeMenu}
                role="menuitem"
                aria-current={location.pathname.includes('/about') ? 'page' : undefined}
              >
                {t('navbar.about')}
              </Link> */}
            </li>
            <li role="none">
              <a 
                href="https://samarthanam.org/contact-us/" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={closeMenu}
                role="menuitem"
                aria-label="Contact Us - Opens in a new tab"
              >
                {t('navbar.contact')}
              </a>
            </li>
            {/* <li role="none">
              <Link
                to="/contact"
                onClick={closeMenu}
                role="menuitem"
                aria-current={location.pathname.includes('/contact') ? 'page' : undefined}
              >
                {t('navbar.contact')}
              </Link>
            </li> */}
          </ul>

          <div 
            className="auth-buttons"
            role="region"
            aria-label="User authentication"
          >
            {isLoggedIn ? (
              <>
                <span className="user-greeting">Hello, { userInfo?.name?.split(' ')[0] }</span>
                <button 
                  className="btn btn-logout" 
                  onClick={handleLogout}
                  aria-label={t('navbar.logoutAria')}
                  type="button"
                >
                  {t('navbar.logout')}
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="btn btn-login"
                  onClick={closeMenu}
                  aria-label={t('navbar.loginAria')}
                  role="button"
                >
                  {t('navbar.login')}
                </Link>
                <Link 
                  to="/signup" 
                  className="btn btn-primary"
                  onClick={closeMenu}
                  aria-label={t('navbar.registerAria')}
                  role="button"
                >
                  {t('navbar.register')}
                </Link>
              </>
            )}
          </div>
          
          {/* Language Switcher Component */}
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
};

export default Navbar;