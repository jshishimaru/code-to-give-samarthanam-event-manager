import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('preferred-theme');
    return savedTheme || 'light';
  });
  
  const [fontSize, setFontSize] = useState(() => {
    const savedFontSize = localStorage.getItem('preferred-font-size');
    return savedFontSize || 'normal';
  });
  
  const [fontWeight, setFontWeight] = useState(() => {
    const savedFontWeight = localStorage.getItem('preferred-font-weight');
    return savedFontWeight || 'normal';
  });
  
  const [textContrast, setTextContrast] = useState(() => {
    const savedTextContrast = localStorage.getItem('preferred-text-contrast');
    return savedTextContrast || 'normal';
  });

  // Update theme in localStorage and document when it changes
  useEffect(() => {
    localStorage.setItem('preferred-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Update font size in localStorage and document when it changes
  useEffect(() => {
    localStorage.setItem('preferred-font-size', fontSize);
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [fontSize]);

  // Update font weight in localStorage and document when it changes
  useEffect(() => {
    localStorage.setItem('preferred-font-weight', fontWeight);
    document.documentElement.setAttribute('data-font-weight', fontWeight);
  }, [fontWeight]);

  // Update text contrast in localStorage and document when it changes
  useEffect(() => {
    localStorage.setItem('preferred-text-contrast', textContrast);
    document.documentElement.setAttribute('data-text-contrast', textContrast);
  }, [textContrast]);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
  };

  const changeFontSize = (size) => {
    setFontSize(size);
  };

  const changeFontWeight = (weight) => {
    setFontWeight(weight);
  };

  const changeTextContrast = (contrast) => {
    setTextContrast(contrast);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        fontSize,
        changeFontSize,
        fontWeight,
        changeFontWeight,
        textContrast,
        changeTextContrast
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};