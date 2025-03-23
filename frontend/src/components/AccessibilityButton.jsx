import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import '../styles/AccessibilityButton.css';
import { useTranslation } from 'react-i18next';

const AccessibilityButton = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  
  const { 
    theme, 
    toggleTheme, 
    fontSize, 
    changeFontSize,
    fontWeight,
    changeFontWeight,
    textContrast,
    changeTextContrast
  } = useTheme();
  
  const handleToggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleClickOutside = (event) => {
    if (
      menuRef.current && 
      !menuRef.current.contains(event.target) &&
      buttonRef.current && 
      !buttonRef.current.contains(event.target)
    ) {
      setIsMenuOpen(false);
    }
  };

  // Add event listener for clicks outside the menu
  useEffect(() => {
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);
  
  return (
    <div className="accessibility-container">
      <button 
        ref={buttonRef}
        className="accessibility-button" 
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        onClick={handleToggleMenu}
        aria-label={t('accessibility.accessibilityOptions')}
      >
        <span className="accessibility-icon" aria-hidden="true">💀</span>
        <span className="sr-only">{t('accessibility.accessibility')}</span>
      </button>
      
      {isMenuOpen && (
        <>
          <div 
            ref={menuRef}
            className="accessibility-panel" 
            role="menu"
            aria-label={t('accessibility.accessibilityOptionsMenu')}
          >
            <div className="panel-header">
              <h2 className="panel-title">{t('accessibility.accessibilityOptions')}</h2>
              <button 
                className="close-button" 
                onClick={() => setIsMenuOpen(false)}
                aria-label={t('accessibility.closeAccessibilityMenu')}
              >
                ×
              </button>
            </div>
            
            <div className="panel-section">
              <h3 className="section-title">{t('accessibility.theme')}</h3>
              <div className="theme-switcher">
                <button 
                  className={`theme-button ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => toggleTheme('light')}
                  aria-pressed={theme === 'light'}
                  aria-label={t('accessibility.lightTheme')}
                >
                  <span className="theme-icon">☀️</span>
                  <span className="theme-label">{t('accessibility.light')}</span>
                </button>
                <button 
                  className={`theme-button ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => toggleTheme('dark')}
                  aria-pressed={theme === 'dark'}
                  aria-label={t('accessibility.darkTheme')}
                >
                  <span className="theme-icon">🌙</span>
                  <span className="theme-label">{t('accessibility.dark')}</span>
                </button>
                <button 
                  className={`theme-button ${theme === 'high-contrast-light' ? 'active' : ''}`}
                  onClick={() => toggleTheme('high-contrast-light')}
                  aria-pressed={theme === 'high-contrast-light'}
                  aria-label={t('accessibility.highContrastLightTheme')}
                >
                  <span className="theme-icon">🔆</span>
                  <span className="theme-label">{t('accessibility.highContrastLight')}</span>
                </button>
                <button 
                  className={`theme-button ${theme === 'high-contrast-dark' ? 'active' : ''}`}
                  onClick={() => toggleTheme('high-contrast-dark')}
                  aria-pressed={theme === 'high-contrast-dark'}
                  aria-label={t('accessibility.highContrastDarkTheme')}
                >
                  <span className="theme-icon">🔅</span>
                  <span className="theme-label">{t('accessibility.highContrastDark')}</span>
                </button>
              </div>
            </div>
            
            <div className="panel-section">
              <h3 className="section-title">{t('accessibility.fontSize')}</h3>
              <div className="theme-switcher">
                <button 
                  className={`theme-button ${fontSize === 'normal' ? 'active' : ''}`}
                  onClick={() => changeFontSize('normal')}
                  aria-pressed={fontSize === 'normal'}
                  aria-label={t('accessibility.normalFontSize')}
                >
                  <span className="theme-icon">A</span>
                  <span className="theme-label">{t('accessibility.normal')}</span>
                </button>
                <button 
                  className={`theme-button ${fontSize === 'large' ? 'active' : ''}`}
                  onClick={() => changeFontSize('large')}
                  aria-pressed={fontSize === 'large'}
                  aria-label={t('accessibility.largeFontSize')}
                >
                  <span className="theme-icon" style={{ fontSize: '1.2em' }}>A</span>
                  <span className="theme-label">{t('accessibility.large')}</span>
                </button>
                <button 
                  className={`theme-button ${fontSize === 'x-large' ? 'active' : ''}`}
                  onClick={() => changeFontSize('x-large')}
                  aria-pressed={fontSize === 'x-large'}
                  aria-label={t('accessibility.extraLargeFontSize')}
                >
                  <span className="theme-icon" style={{ fontSize: '1.4em' }}>A</span>
                  <span className="theme-label">{t('accessibility.larger')}</span>
                </button>
              </div>
            </div>
            
            <div className="panel-section">
              <h3 className="section-title">{t('accessibility.fontWeight')}</h3>
              <div className="theme-switcher">
                <button 
                  className={`theme-button ${fontWeight === 'normal' ? 'active' : ''}`}
                  onClick={() => changeFontWeight('normal')}
                  aria-pressed={fontWeight === 'normal'}
                  aria-label={t('accessibility.normalFontWeight')}
                >
                  <span className="theme-label">{t('accessibility.normal')}</span>
                </button>
                <button 
                  className={`theme-button ${fontWeight === 'bold' ? 'active' : ''}`}
                  onClick={() => changeFontWeight('bold')}
                  aria-pressed={fontWeight === 'bold'}
                  aria-label={t('accessibility.boldFontWeight')}
                >
                  <span className="theme-label" style={{ fontWeight: 'bold' }}>{t('accessibility.bold')}</span>
                </button>
                <button 
                  className={`theme-button ${fontWeight === 'bolder' ? 'active' : ''}`}
                  onClick={() => changeFontWeight('bolder')}
                  aria-pressed={fontWeight === 'bolder'}
                  aria-label={t('accessibility.bolderFontWeight')}
                >
                  <span className="theme-label" style={{ fontWeight: 'bolder' }}>{t('accessibility.bolder')}</span>
                </button>
              </div>
            </div>
            
            <div className="panel-section">
              <h3 className="section-title">{t('accessibility.textContrast')}</h3>
              <div className="theme-switcher">
                <button 
                  className={`theme-button ${textContrast === 'normal' ? 'active' : ''}`}
                  onClick={() => changeTextContrast('normal')}
                  aria-pressed={textContrast === 'normal'}
                  aria-label={t('accessibility.defaultContrast')}
                >
                  <span className="theme-label">{t('accessibility.normal')}</span>
                </button>
                <button 
                  className={`theme-button ${textContrast === 'high-black' ? 'active' : ''}`}
                  onClick={() => changeTextContrast('high-black')}
                  aria-pressed={textContrast === 'high-black'}
                  aria-label={t('accessibility.highBlackContrast')}
                >
                  <span className="theme-label" style={{ color: '#000', backgroundColor: '#fff' }}>{t('accessibility.highBlack')}</span>
                </button>
                <button 
                  className={`theme-button ${textContrast === 'high-white' ? 'active' : ''}`}
                  onClick={() => changeTextContrast('high-white')}
                  aria-pressed={textContrast === 'high-white'}
                  aria-label={t('accessibility.highWhiteContrast')}
                >
                  <span className="theme-label" style={{ color: '#fff', backgroundColor: '#222' }}>{t('accessibility.highWhite')}</span>
                </button>
                <button 
                  className={`theme-button ${textContrast === 'yellow-black' ? 'active' : ''}`}
                  onClick={() => changeTextContrast('yellow-black')}
                  aria-pressed={textContrast === 'yellow-black'}
                  aria-label={t('accessibility.yellowBlackContrast')}
                >
                  <span className="theme-label" style={{ color: '#ff0', backgroundColor: '#000' }}>{t('accessibility.yellowBlack')}</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="backdrop" onClick={() => setIsMenuOpen(false)} aria-hidden="true"></div>
        </>
      )}
    </div>
  );
};

export default AccessibilityButton;