import { useTheme } from '../context/ThemeContext';
import '../styles/AccessibilityButton.css';

const AccessibilityButton = () => {
  const { theme, handleThemeChange, isThemeSwitcherOpen, toggleThemeSwitcher } = useTheme();
  
  return (
    <div className="accessibility-container">
      <button 
        className="accessibility-button"
        onClick={toggleThemeSwitcher}
        aria-expanded={isThemeSwitcherOpen}
        aria-label="Accessibility options"
      >
        <span className="accessibility-icon">⚙️</span>
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
        </div>
      )}
      
      {isThemeSwitcherOpen && <div className="backdrop" onClick={toggleThemeSwitcher}></div>}
    </div>
  );
};

export default AccessibilityButton;