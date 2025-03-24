import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext'; 
import '../styles/Navbar.css';
import logoImage from '../assets/logo.png';
import { checkAuth } from '../apiservice/auth';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import VolunteerProfile from './host/volunteer/VolunteerProfile';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const profileButtonRef = useRef(null);
  
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
    // const handleScroll = () => {
    //   if (window.scrollY > 50) {
    //     setScrolled(true);
    //   } else {
    //     setScrolled(false);
    //   }
    // };
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
        document.body.classList.add('navbar-scrolled');
      } else {
        setScrolled(false);
        document.body.classList.remove('navbar-scrolled');
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
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
          const user = response.data.user;
          setUserInfo({
            ...user,
            // Ensure role is set based on isHost property if not already present
            role: user.role || (user.isHost ? 'organiser' : 'volunteer')
          });

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

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isProfileOpen &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  // Close profile dropdown when pressing Escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isProfileOpen) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProfileOpen]);

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
        setIsProfileOpen(false);
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

  const toggleProfileDropdown = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  // Check if user is an organiser
  const isOrganiser = userInfo?.role === 'organiser';
  
  // Get initials for avatar
  const getInitials = () => {
    if (!userInfo || !userInfo.name) return '?';
    
    const names = userInfo.name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
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
            {/* Only show My Events link if user is an organiser */}
            {(isLoggedIn && isOrganiser) && (
              <li role="none">
                <Link 
                  to="/host/MyEvents"
                  onClick={closeMenu}
                  role="menuitem"
                  aria-current={location.pathname.includes('/my-events') ? 'page' : undefined}
                >
                  {t('navbar.myEvents')}
                </Link>
              </li>
            )}

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
            
          </ul>

          <div 
            className="auth-buttons"
            role="region"
            aria-label="User authentication"
          >
            {isLoggedIn ? (
              <div className="profile-container">
                <button
                  ref={profileButtonRef}
                  className="profile-avatar-button"
                  onClick={toggleProfileDropdown}
                  aria-expanded={isProfileOpen}
                  aria-haspopup="dialog"
                  aria-label={t('navbar.openProfile', 'Open profile menu')}
                >
                  <div className="navbar-avatar">
                    {getInitials()}
                  </div>
                </button>
                
                {isProfileOpen && (
				  <div 
				    ref={profileDropdownRef}
				    className="profile-dropdown"
				    role="dialog"
				    aria-label={t('navbar.profileMenu', 'Profile menu')}
				  >
				    <div className="profile-dropdown-content">
				      <VolunteerProfile 
				        userId={userInfo.id} 
				        showActions={false} 
				        compact={true}
				      />
				      
				      <div className="dropdown-footer">
				        <button 
				          className="btn-profile-action logout full-width"
				          onClick={handleLogout}
				        >
				          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
				            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
				            <polyline points="16 17 21 12 16 7"></polyline>
				            <line x1="21" y1="12" x2="9" y2="12"></line>
				          </svg>
				          {t('navbar.logout')}
				        </button>
				      </div>
				    </div>
				  </div>
				)}
              </div>
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