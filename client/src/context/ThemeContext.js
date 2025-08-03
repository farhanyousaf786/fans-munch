import React, { createContext, useContext, useState, useEffect } from 'react';
import { Colors, Gradients } from '../constants/colors';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState({
    primary: Colors.primaryColor,
    secondary: Colors.primaryDarkColor,
    light: Colors.primaryLightColor,
    background: Colors.bgColor,
    appName: 'Food Munch'
  });

  // Initialize CSS custom properties on mount
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', currentTheme.primary);
    root.style.setProperty('--theme-secondary', currentTheme.secondary);
    root.style.setProperty('--theme-light', currentTheme.light);
    root.style.setProperty('--theme-background', currentTheme.background);
    root.style.setProperty('--theme-gradient', Gradients.primary);
  }, [currentTheme]);

  const value = {
    currentTheme,
    Colors,
    Gradients
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
