import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
  };

  return (
    <div className="language-switcher">
      <button 
        className={`language-button ${i18n.language === 'en' ? 'active' : ''}`} 
        onClick={() => changeLanguage('en')}
        aria-label="Switch to English"
      >
        EN
      </button>
      <button 
        className={`language-button ${i18n.language === 'hi' ? 'active' : ''}`} 
        onClick={() => changeLanguage('hi')}
        aria-label="हिंदी में बदलें"
      >
        हिं
      </button>
      <button 
        className={`language-button ${i18n.language === 'kn' ? 'active' : ''}`} 
        onClick={() => changeLanguage('kn')}
        aria-label="ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಿ"
      >
        ಕನ್
      </button>
      <button 
        className={`language-button ${i18n.language === 'te' ? 'active' : ''}`} 
        onClick={() => changeLanguage('te')}
        aria-label="తెలుగులోకి మార్చండి"
      >
        తెలు
      </button>
    </div>
  );
};

export default LanguageSwitcher;