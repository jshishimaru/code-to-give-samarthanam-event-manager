import { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('preferred-theme');
    if (savedTheme) return savedTheme;
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });
  
  const [isThemeSwitcherOpen, setIsThemeSwitcherOpen] = useState(false);
  
  useEffect(() => {
    // Set the theme attribute on the document root (html tag)
    document.documentElement.setAttribute('data-theme', theme);
    // Save to localStorage for persistence
    localStorage.setItem('preferred-theme', theme);
    
    // Apply appropriate contrast mode for assistive technologies
    if (theme === 'high-contrast-light' || theme === 'high-contrast-dark') {
      document.documentElement.style.setProperty('forced-colors', 'active');
    } else {
      document.documentElement.style.removeProperty('forced-colors');
    }
  }, [theme]);
  
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };
  
  const toggleThemeSwitcher = () => {
    setIsThemeSwitcherOpen(!isThemeSwitcherOpen);
  };
  
  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        handleThemeChange, 
        isThemeSwitcherOpen, 
        toggleThemeSwitcher 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);