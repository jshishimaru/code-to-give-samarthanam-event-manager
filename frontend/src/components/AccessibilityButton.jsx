import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/AccessibilityButton.css';
import { FaUniversalAccess, FaTimes, FaSun, FaMoon, FaAdjust, FaFont } from 'react-icons/fa';

const AccessibilityButton = () => {
  const { t } = useTranslation();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');
  const [fontSize, setFontSize] = useState('medium');
  const [fontWeight, setFontWeight] = useState('normal');
  const [textContrast, setTextContrast] = useState('default');
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  
  // Load saved preferences on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedFontSize = localStorage.getItem('fontSize') || 'medium';
    const savedFontWeight = localStorage.getItem('fontWeight') || 'normal';
    const savedTextContrast = localStorage.getItem('textContrast') || 'default';
    
    setCurrentTheme(savedTheme);
    setFontSize(savedFontSize);
    setFontWeight(savedFontWeight);
    setTextContrast(savedTextContrast);
    
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.setAttribute('data-font-size', savedFontSize);
    document.documentElement.setAttribute('data-font-weight', savedFontWeight);
    document.documentElement.setAttribute('data-text-contrast', savedTextContrast);
  }, []);
  
  // Handle Insert key press to focus on accessibility button
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.keyCode === 45 || e.key === 'Insert') {
        e.preventDefault();
        buttonRef.current?.focus();
        announceToScreenReader(t('accessibility.buttonFocused', 'Accessibility options focused. Press Enter to open.'));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [t]);
  
  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isPanelOpen && 
          panelRef.current && 
          !panelRef.current.contains(event.target) &&
          buttonRef.current && 
          !buttonRef.current.contains(event.target)) {
        setIsPanelOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPanelOpen]);
  
  // Helper function to announce messages to screen readers
  const announceToScreenReader = (message) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('role', 'status');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => document.body.removeChild(announcement), 3000);
  };
  
  // Handler functions for preference changes
  const updatePreference = (type, value) => {
    switch(type) {
      case 'theme':
        setCurrentTheme(value);
        document.documentElement.setAttribute('data-theme', value);
        localStorage.setItem('theme', value);
        announceToScreenReader(t('accessibility.themeChanged', `Theme changed to ${value}`));
        break;
      case 'fontSize':
        setFontSize(value);
        document.documentElement.setAttribute('data-font-size', value);
        localStorage.setItem('fontSize', value);
        announceToScreenReader(t('accessibility.fontSizeChanged', `Font size changed to ${value}`));
        break;
      case 'fontWeight':
        setFontWeight(value);
        document.documentElement.setAttribute('data-font-weight', value);
        localStorage.setItem('fontWeight', value);
        announceToScreenReader(t('accessibility.fontWeightChanged', `Font weight changed to ${value}`));
        break;
      case 'textContrast':
        setTextContrast(value);
        document.documentElement.setAttribute('data-text-contrast', value);
        localStorage.setItem('textContrast', value);
        announceToScreenReader(t('accessibility.contrastChanged', `Text contrast changed to ${value}`));
        break;
      default:
        break;
    }
  };
  
  return (
    <div className="accessibility-wrapper">
      {isPanelOpen && <div 
        className="accessibility-backdrop" 
        onClick={() => setIsPanelOpen(false)} 
        aria-hidden="true"
      />}
      
      <div className="accessibility-container">
        <button 
          ref={buttonRef}
          className="accessibility-toggle-button" 
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          aria-label={t('accessibility.togglePanel', 'Toggle accessibility options')}
          aria-expanded={isPanelOpen}
          aria-controls="accessibility-panel"
        >
          <FaUniversalAccess aria-hidden="true" />
          <span className="sr-only">{t('accessibility.openPanel', 'Open accessibility options')}</span>
        </button>
        
        {isPanelOpen && (
          <section 
            ref={panelRef}
            id="accessibility-panel"
            className="accessibility-panel" 
            role="dialog" 
            aria-labelledby="accessibility-heading"
            aria-modal="true"
          >
            <header className="panel-header">
              <h2 id="accessibility-heading" className="panel-title">
                {t('accessibility.title', 'Accessibility Options')}
              </h2>
              <button 
                className="close-button" 
                onClick={() => setIsPanelOpen(false)}
                aria-label={t('accessibility.closePanel', 'Close accessibility panel')}
              >
                <FaTimes aria-hidden="true" />
              </button>
            </header>
            
            <div className="panel-content">
              {/* Theme selection */}
              <section className="option-section">
                <h3 id="theme-heading" className="section-title">
                  {t('accessibility.theme.title', 'Theme')}
                </h3>
                <div className="option-grid" role="radiogroup" aria-labelledby="theme-heading">
                  {[
                    { id: 'light', icon: <FaSun aria-hidden="true" />, label: t('accessibility.theme.light', 'Light') },
                    { id: 'dark', icon: <FaMoon aria-hidden="true" />, label: t('accessibility.theme.dark', 'Dark') },
                    { id: 'high-contrast-light', icon: <FaAdjust aria-hidden="true" />, label: t('accessibility.theme.highContrastLight', 'High Contrast Light') },
                    { id: 'high-contrast-dark', icon: <FaAdjust aria-hidden="true" />, label: t('accessibility.theme.highContrastDark', 'High Contrast Dark') }
                  ].map(theme => (
                    <button 
                      key={theme.id}
                      className={`option-button ${currentTheme === theme.id ? 'active' : ''}`}
                      onClick={() => updatePreference('theme', theme.id)}
                      aria-pressed={currentTheme === theme.id}
                      role="radio"
                      aria-checked={currentTheme === theme.id}
                    >
                      <span className="option-icon">{theme.icon}</span>
                      <span className="option-label">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </section>
              
              {/* Font size selection */}
              <section className="option-section">
                <h3 id="font-size-heading" className="section-title">
                  {t('accessibility.fontSize.title', 'Font Size')}
                </h3>
                <div className="option-grid" role="radiogroup" aria-labelledby="font-size-heading">
                  {[
                    { id: 'small', label: t('accessibility.fontSize.small', 'Small') },
                    { id: 'medium', label: t('accessibility.fontSize.medium', 'Medium') },
                    { id: 'large', label: t('accessibility.fontSize.large', 'Large') },
                    { id: 'x-large', label: t('accessibility.fontSize.xLarge', 'X-Large') }
                  ].map(size => (
                    <button 
                      key={size.id}
                      className={`option-button ${fontSize === size.id ? 'active' : ''}`}
                      onClick={() => updatePreference('fontSize', size.id)}
                      aria-pressed={fontSize === size.id}
                      role="radio"
                      aria-checked={fontSize === size.id}
                    >
                      <span className={`option-icon font-${size.id}`}>A</span>
                      <span className="option-label">{size.label}</span>
                    </button>
                  ))}
                </div>
              </section>
              
              {/* Font weight selection */}
              <section className="option-section">
                <h3 id="font-weight-heading" className="section-title">
                  {t('accessibility.fontWeight.title', 'Font Weight')}
                </h3>
                <div className="option-grid" role="radiogroup" aria-labelledby="font-weight-heading">
                  {[
                    { id: 'normal', label: t('accessibility.fontWeight.normal', 'Normal') },
                    { id: 'bold', label: t('accessibility.fontWeight.bold', 'Bold') },
                    { id: 'bolder', label: t('accessibility.fontWeight.bolder', 'Bolder') }
                  ].map(weight => (
                    <button 
                      key={weight.id}
                      className={`option-button ${fontWeight === weight.id ? 'active' : ''}`}
                      onClick={() => updatePreference('fontWeight', weight.id)}
                      aria-pressed={fontWeight === weight.id}
                      role="radio"
                      aria-checked={fontWeight === weight.id}
                    >
                      <span className={`option-icon weight-${weight.id}`}>
                        <FaFont aria-hidden="true" />
                      </span>
                      <span className={`option-label weight-${weight.id}`}>{weight.label}</span>
                    </button>
                  ))}
                </div>
              </section>
              
              {/* Text contrast selection */}
              <section className="option-section">
                <h3 id="contrast-heading" className="section-title">
                  {t('accessibility.textContrast.title', 'Text Contrast')}
                </h3>
                <div className="option-grid" role="radiogroup" aria-labelledby="contrast-heading">
                  {[
                    { id: 'default', label: t('accessibility.textContrast.default', 'Default') },
                    { id: 'high-black', label: t('accessibility.textContrast.highBlack', 'Black Text') },
                    { id: 'high-white', label: t('accessibility.textContrast.highWhite', 'White Text') },
                    { id: 'yellow-black', label: t('accessibility.textContrast.yellowBlack', 'Yellow on Black') }
                  ].map(contrast => (
                    <button 
                      key={contrast.id}
                      className={`option-button contrast-${contrast.id} ${textContrast === contrast.id ? 'active' : ''}`}
                      onClick={() => updatePreference('textContrast', contrast.id)}
                      aria-pressed={textContrast === contrast.id}
                      role="radio"
                      aria-checked={textContrast === contrast.id}
                    >
                      <span className="option-label">{contrast.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AccessibilityButton;