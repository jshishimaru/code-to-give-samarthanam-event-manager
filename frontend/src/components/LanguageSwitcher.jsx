import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get current language display name
  const getCurrentLanguageLabel = () => {
    switch(i18n.language) {
      case 'en': return 'EN';
      case 'hi': return 'हिं';
      case 'kn': return 'ಕನ್';
      case 'te': return 'తెలు';
      default: return 'EN';
    }
  };

  return (
    <div className="language-switcher-container" ref={dropdownRef}>
      <button 
        className="language-dropdown-button" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {getCurrentLanguageLabel()} <span className="dropdown-arrow">▼</span>
      </button>
      
      {isOpen && (
        <ul className="language-dropdown-menu" role="listbox">
          <li role="option" aria-selected={i18n.language === 'en'}>
            <button 
              className={i18n.language === 'en' ? 'active' : ''}
              onClick={() => changeLanguage('en')}
            >
              English
            </button>
          </li>
          <li role="option" aria-selected={i18n.language === 'hi'}>
            <button 
              className={i18n.language === 'hi' ? 'active' : ''}
              onClick={() => changeLanguage('hi')}
            >
              हिंदी
            </button>
          </li>
          <li role="option" aria-selected={i18n.language === 'kn'}>
            <button 
              className={i18n.language === 'kn' ? 'active' : ''}
              onClick={() => changeLanguage('kn')}
            >
              ಕನ್ನಡ
            </button>
          </li>
          <li role="option" aria-selected={i18n.language === 'te'}>
            <button 
              className={i18n.language === 'te' ? 'active' : ''}
              onClick={() => changeLanguage('te')}
            >
              తెలుగు
            </button>
          </li>
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;