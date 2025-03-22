import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import '../styles/AccessibilityButton.css';

const AccessibilityButton = () => {
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
        aria-label="Accessibility options"
      >
        <span className="accessibility-icon" aria-hidden="true">💀</span>
        <span className="sr-only">Accessibility</span>
      </button>
      
      {isMenuOpen && (
        <>
          <div 
            ref={menuRef}
            className="accessibility-panel" 
            role="menu"
            aria-label="Accessibility options menu"
          >
            <div className="panel-header">
              <h2 className="panel-title">Accessibility Options</h2>
              <button 
                className="close-button" 
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close accessibility menu"
              >
                ×
              </button>
            </div>
            
            <div className="panel-section">
              <h3 className="section-title">Theme</h3>
              <div className="theme-switcher">
                <button 
                  className={`theme-button ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => toggleTheme('light')}
                  aria-pressed={theme === 'light'}
                  aria-label="Light theme"
                >
                  <span className="theme-icon">☀️</span>
                  <span className="theme-label">Light</span>
                </button>
                <button 
                  className={`theme-button ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => toggleTheme('dark')}
                  aria-pressed={theme === 'dark'}
                  aria-label="Dark theme"
                >
                  <span className="theme-icon">🌙</span>
                  <span className="theme-label">Dark</span>
                </button>
                <button 
                  className={`theme-button ${theme === 'high-contrast-light' ? 'active' : ''}`}
                  onClick={() => toggleTheme('high-contrast-light')}
                  aria-pressed={theme === 'high-contrast-light'}
                  aria-label="High contrast light theme"
                >
                  <span className="theme-icon">🔆</span>
                  <span className="theme-label">High Contrast Light</span>
                </button>
                <button 
                  className={`theme-button ${theme === 'high-contrast-dark' ? 'active' : ''}`}
                  onClick={() => toggleTheme('high-contrast-dark')}
                  aria-pressed={theme === 'high-contrast-dark'}
                  aria-label="High contrast dark theme"
                >
                  <span className="theme-icon">🔅</span>
                  <span className="theme-label">High Contrast Dark</span>
                </button>
              </div>
            </div>
            
            <div className="panel-section">
              <h3 className="section-title">Font Size</h3>
              <div className="theme-switcher">
                <button 
                  className={`theme-button ${fontSize === 'normal' ? 'active' : ''}`}
                  onClick={() => changeFontSize('normal')}
                  aria-pressed={fontSize === 'normal'}
                  aria-label="Normal font size"
                >
                  <span className="theme-icon">A</span>
                  <span className="theme-label">Normal</span>
                </button>
                <button 
                  className={`theme-button ${fontSize === 'large' ? 'active' : ''}`}
                  onClick={() => changeFontSize('large')}
                  aria-pressed={fontSize === 'large'}
                  aria-label="Large font size"
                >
                  <span className="theme-icon" style={{ fontSize: '1.2em' }}>A</span>
                  <span className="theme-label">Large</span>
                </button>
                <button 
                  className={`theme-button ${fontSize === 'x-large' ? 'active' : ''}`}
                  onClick={() => changeFontSize('x-large')}
                  aria-pressed={fontSize === 'x-large'}
                  aria-label="Extra large font size"
                >
                  <span className="theme-icon" style={{ fontSize: '1.4em' }}>A</span>
                  <span className="theme-label">X-Large</span>
                </button>
              </div>
            </div>
            
            <div className="panel-section">
              <h3 className="section-title">Font Weight</h3>
              <div className="theme-switcher">
                <button 
                  className={`theme-button ${fontWeight === 'normal' ? 'active' : ''}`}
                  onClick={() => changeFontWeight('normal')}
                  aria-pressed={fontWeight === 'normal'}
                  aria-label="Normal font weight"
                >
                  <span className="theme-label">Normal</span>
                </button>
                <button 
                  className={`theme-button ${fontWeight === 'bold' ? 'active' : ''}`}
                  onClick={() => changeFontWeight('bold')}
                  aria-pressed={fontWeight === 'bold'}
                  aria-label="Bold font weight"
                >
                  <span className="theme-label" style={{ fontWeight: 'bold' }}>Bold</span>
                </button>
                <button 
                  className={`theme-button ${fontWeight === 'bolder' ? 'active' : ''}`}
                  onClick={() => changeFontWeight('bolder')}
                  aria-pressed={fontWeight === 'bolder'}
                  aria-label="Bolder font weight"
                >
                  <span className="theme-label" style={{ fontWeight: 'bolder' }}>Bolder</span>
                </button>
              </div>
            </div>
            
            <div className="panel-section">
              <h3 className="section-title">Text Contrast</h3>
              <div className="theme-switcher">
                <button 
                  className={`theme-button ${textContrast === 'normal' ? 'active' : ''}`}
                  onClick={() => changeTextContrast('normal')}
                  aria-pressed={textContrast === 'normal'}
                  aria-label="Default text contrast"
                >
                  <span className="theme-label">Normal</span>
                </button>
                <button 
                  className={`theme-button ${textContrast === 'high-black' ? 'active' : ''}`}
                  onClick={() => changeTextContrast('high-black')}
                  aria-pressed={textContrast === 'high-black'}
                  aria-label="High contrast black text"
                >
                  <span className="theme-label" style={{ color: '#000', backgroundColor: '#fff' }}>High Black</span>
                </button>
                <button 
                  className={`theme-button ${textContrast === 'high-white' ? 'active' : ''}`}
                  onClick={() => changeTextContrast('high-white')}
                  aria-pressed={textContrast === 'high-white'}
                  aria-label="High contrast white text"
                >
                  <span className="theme-label" style={{ color: '#fff', backgroundColor: '#222' }}>High White</span>
                </button>
                <button 
                  className={`theme-button ${textContrast === 'yellow-black' ? 'active' : ''}`}
                  onClick={() => changeTextContrast('yellow-black')}
                  aria-pressed={textContrast === 'yellow-black'}
                  aria-label="Yellow text on black background"
                >
                  <span className="theme-label" style={{ color: '#ff0', backgroundColor: '#000' }}>Yellow on Black</span>
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