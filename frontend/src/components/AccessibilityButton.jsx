import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import '../styles/AccessibilityButton.css';
import accessibilityIcon from '../assets/accessibility-icon.png';


const AccessibilityButton = () => {
  const { theme, handleThemeChange, isThemeSwitcherOpen, toggleThemeSwitcher } = useTheme();
  const [fontSize, setFontSize] = useState('medium');
  const [fontWeight, setFontWeight] = useState('normal');
  const [textContrast, setTextContrast] = useState('default');
  
  
  useEffect(() => {
    // Load saved settings from localStorage
    const savedFontSize = localStorage.getItem('preferred-font-size') || 'medium';
    const savedFontWeight = localStorage.getItem('preferred-font-weight') || 'normal';
    const savedTextContrast = localStorage.getItem('preferred-text-contrast') || 'default';
    
    setFontSize(savedFontSize);
    setFontWeight(savedFontWeight);
    setTextContrast(savedTextContrast);
    
    // Apply settings to document
    document.documentElement.setAttribute('data-font-size', savedFontSize);
    document.documentElement.setAttribute('data-font-weight', savedFontWeight);
    document.documentElement.setAttribute('data-text-contrast', savedTextContrast);
  }, []);

  // Handlers for changing accessibility settings
  const handleFontSizeChange = (size) => {
    setFontSize(size);
    document.documentElement.setAttribute('data-font-size', size);
    localStorage.setItem('preferred-font-size', size);
  };
  
  const handleFontWeightChange = (weight) => {
    setFontWeight(weight);
    document.documentElement.setAttribute('data-font-weight', weight);
    localStorage.setItem('preferred-font-weight', weight);
  };
  
  const handleTextContrastChange = (contrast) => {
    setTextContrast(contrast);
    document.documentElement.setAttribute('data-text-contrast', contrast);
    localStorage.setItem('preferred-text-contrast', contrast);
  };

  return (
    <div className="accessibility-container">
      <button 
        className="accessibility-button"
        onClick={toggleThemeSwitcher}
        aria-expanded={isThemeSwitcherOpen}
        aria-label="Accessibility options"
      >
        <span className="accessibility-icon" aria-hidden="true"></span>
        <span className="sr-only">Accessibility</span>
        
      </button>
      
      {isThemeSwitcherOpen && (
        <div className="accessibility-panel">
          <div className="panel-header">
            <h2 className="panel-title">Accessibility Options</h2>
            <button 
              className="close-button"
              onClick={toggleThemeSwitcher}
              aria-label="Close accessibility panel"
            >
              ×
            </button>
          </div>
          
          {/* Theme section */}
          <div className="panel-section">
            <h3 className="section-title">Theme Preferences</h3>
            <div className="theme-switcher" role="group" aria-label="Theme preferences">
              <button 
                type="button"
                className={`theme-button ${theme === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeChange('light')}
                aria-pressed={theme === 'light'}
                aria-label="Light theme"
              >
                <span className="theme-icon">☀️</span>
                <span className="theme-label">Light</span>
              </button>
              <button 
                type="button"
                className={`theme-button ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeChange('dark')}
                aria-pressed={theme === 'dark'}
                aria-label="Dark theme"
              >
                <span className="theme-icon">🌙</span>
                <span className="theme-label">Dark</span>
              </button>
              <button 
                type="button"
                className={`theme-button ${theme === 'high-contrast-light' ? 'active' : ''}`}
                onClick={() => handleThemeChange('high-contrast-light')}
                aria-pressed={theme === 'high-contrast-light'}
                aria-label="High contrast light theme"
              >
                <span className="theme-icon">🔆</span>
                <span className="theme-label">High Contrast Light</span>
              </button>
              <button 
                type="button"
                className={`theme-button ${theme === 'high-contrast-dark' ? 'active' : ''}`}
                onClick={() => handleThemeChange('high-contrast-dark')}
                aria-pressed={theme === 'high-contrast-dark'}
                aria-label="High contrast dark theme"
              >
                <span className="theme-icon">⚫</span>
                <span className="theme-label">High Contrast Dark</span>
              </button>
            </div>
          </div>
          
          {/* Font size section */}
          <div className="panel-section">
            <h3 className="section-title">Font Size</h3>
            <div className="theme-switcher" role="group" aria-label="Font size options">
              <button 
                type="button"
                className={`theme-button ${fontSize === 'small' ? 'active' : ''}`}
                onClick={() => handleFontSizeChange('small')}
                aria-pressed={fontSize === 'small'}
                aria-label="Small font size"
              >
                <span className="theme-icon">A</span>
                <span className="theme-label">Small</span>
              </button>
              <button 
                type="button"
                className={`theme-button ${fontSize === 'medium' ? 'active' : ''}`}
                onClick={() => handleFontSizeChange('medium')}
                aria-pressed={fontSize === 'medium'}
                aria-label="Medium font size"
              >
                <span className="theme-icon" style={{fontSize: '1.1em'}}>A</span>
                <span className="theme-label">Medium</span>
              </button>
              <button 
                type="button"
                className={`theme-button ${fontSize === 'large' ? 'active' : ''}`}
                onClick={() => handleFontSizeChange('large')}
                aria-pressed={fontSize === 'large'}
                aria-label="Large font size"
              >
                <span className="theme-icon" style={{fontSize: '1.2em'}}>A</span>
                <span className="theme-label">Large</span>
              </button>
              <button 
                type="button"
                className={`theme-button ${fontSize === 'x-large' ? 'active' : ''}`}
                onClick={() => handleFontSizeChange('x-large')}
                aria-pressed={fontSize === 'x-large'}
                aria-label="Extra large font size"
              >
                <span className="theme-icon" style={{fontSize: '1.3em'}}>A</span>
                <span className="theme-label">X-Large</span>
              </button>
            </div>
          </div>
          
          {/* Font Weight section */}
          <div className="panel-section">
            <h3 className="section-title">Font Weight</h3>
            <div className="theme-switcher" role="group" aria-label="Font weight options">
              <button 
                type="button"
                className={`theme-button ${fontWeight === 'normal' ? 'active' : ''}`}
                onClick={() => handleFontWeightChange('normal')}
                aria-pressed={fontWeight === 'normal'}
                aria-label="Normal font weight"
              >
                <span className="theme-label">Normal</span>
              </button>
              <button 
                type="button"
                className={`theme-button ${fontWeight === 'bold' ? 'active' : ''}`}
                onClick={() => handleFontWeightChange('bold')}
                aria-pressed={fontWeight === 'bold'}
                aria-label="Bold font weight"
              >
                <span className="theme-label" style={{fontWeight: 'bold'}}>Bold</span>
              </button>
              <button 
                type="button"
                className={`theme-button ${fontWeight === 'bolder' ? 'active' : ''}`}
                onClick={() => handleFontWeightChange('bolder')}
                aria-pressed={fontWeight === 'bolder'}
                aria-label="Bolder font weight"
              >
                <span className="theme-label" style={{fontWeight: '900'}}>Bolder</span>
              </button>
            </div>
          </div>
          
          {/* Text Contrast section */}
          <div className="panel-section">
            <h3 className="section-title">Text Contrast</h3>
            <div className="theme-switcher" role="group" aria-label="Text contrast options">
              <button 
                type="button"
                className={`theme-button ${textContrast === 'default' ? 'active' : ''}`}
                onClick={() => handleTextContrastChange('default')}
                aria-pressed={textContrast === 'default'}
                aria-label="Default text contrast"
              >
                <span className="theme-label">Default</span>
              </button>
              <button 
                type="button"
                className={`theme-button ${textContrast === 'high-black' ? 'active' : ''}`}
                onClick={() => handleTextContrastChange('high-black')}
                aria-pressed={textContrast === 'high-black'}
                aria-label="High contrast black text"
              >
                <span className="theme-label" style={{color: 'black'}}>Black Text</span>
              </button>
              <button 
                type="button"
                className={`theme-button ${textContrast === 'high-white' ? 'active' : ''}`}
                onClick={() => handleTextContrastChange('high-white')}
                aria-pressed={textContrast === 'high-white'}
                aria-label="High contrast white text"
                style={{backgroundColor: textContrast === 'high-white' ? 'var(--primary-color)' : '#333'}}
              >
                <span className="theme-label" style={{color: 'white'}}>White Text</span>
              </button>
              <button 
                type="button"
                className={`theme-button ${textContrast === 'yellow-black' ? 'active' : ''}`}
                onClick={() => handleTextContrastChange('yellow-black')}
                aria-pressed={textContrast === 'yellow-black'}
                aria-label="Yellow text on black background"
                style={{backgroundColor: textContrast === 'yellow-black' ? 'var(--primary-color)' : '#000'}}
              >
                <span className="theme-label" style={{color: 'yellow'}}>Yellow on Black</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {isThemeSwitcherOpen && <div className="backdrop" onClick={toggleThemeSwitcher}></div>}
    </div>
  );
};

export default AccessibilityButton;