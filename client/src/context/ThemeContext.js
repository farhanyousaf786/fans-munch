import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Colors, Gradients } from '../constants/colors';
import { stadiumStorage } from '../utils/storage';
import { applyThemeFromStadium, getDefaultTheme } from '../utils/stadiumTheme';
import { refreshSelectedStadiumFromFirestore } from '../utils/stadiumSync';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    const stadium = stadiumStorage.getSelectedStadium();
    return stadium ? applyThemeFromStadium(stadium) : getDefaultTheme();
  });

  const applyStadiumTheme = useCallback((stadium) => {
    const theme = applyThemeFromStadium(stadium);
    setCurrentTheme(theme);
    return theme;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const merged = await refreshSelectedStadiumFromFirestore();
      if (cancelled) return;
      if (merged) {
        applyStadiumTheme(merged);
      } else {
        const stadium = stadiumStorage.getSelectedStadium();
        if (stadium) applyStadiumTheme(stadium);
      }
    })();
    return () => { cancelled = true; };
  }, [applyStadiumTheme]);

  useEffect(() => {
    const onStadiumChanged = (event) => {
      applyStadiumTheme(event.detail || null);
    };
    window.addEventListener('stadium-changed', onStadiumChanged);
    return () => window.removeEventListener('stadium-changed', onStadiumChanged);
  }, [applyStadiumTheme]);

  const value = {
    currentTheme,
    applyStadiumTheme,
    Colors,
    Gradients,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
