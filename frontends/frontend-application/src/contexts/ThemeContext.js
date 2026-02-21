/**
 * ThemeContext - Centralized theme management for TalentSphere
 * Provides dark/light mode theme switching and system preference detection
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// Theme types
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

const ThemeActionTypes = {
  TOGGLE_THEME: 'TOGGLE_THEME',
  SET_THEME: 'SET_THEME',
  SET_SYSTEM_THEME: 'SET_SYSTEM_THEME'
};

// Initial state
const initialState = {
  currentTheme: THEMES.LIGHT,
  systemPreference: THEMES.LIGHT,
  isSystemMode: false
};

// Theme reducer
const themeReducer = (state, action) => {
  switch (action.type) {
    case ThemeActionTypes.TOGGLE_THEME:
      return {
        ...state,
        currentTheme: state.currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT,
        isSystemMode: false
      };
      
    case ThemeActionTypes.SET_THEME:
      return {
        ...state,
        currentTheme: action.payload,
        isSystemMode: false
      };
      
    case ThemeActionTypes.SET_SYSTEM_THEME:
      return {
        ...state,
        systemPreference: action.payload,
        currentTheme: state.isSystemMode ? action.payload : state.currentTheme
      };
      
    default:
      return state;
  }
};

// Create context
const ThemeContext = createContext({
  state: initialState,
  dispatch: () => {}
});

// Theme provider component
const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);
  
  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = (e) => {
      const systemTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
      dispatch({ type: ThemeActionTypes.SET_SYSTEM_THEME, payload: systemTheme });
    };
    
    // Initial check
    updateSystemTheme(mediaQuery);
    
    // Listen for changes
    mediaQuery.addEventListener('change', updateSystemTheme);
    
    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', updateSystemTheme);
    };
  }, [dispatch]);
  
  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const theme = state.currentTheme;
    
    // Remove existing theme classes
    root.classList.remove(THEMES.LIGHT, THEMES.DARK);
    
    // Add current theme class
    root.classList.add(theme);
    
    // Set data attribute for CSS targeting
    root.setAttribute('data-theme', theme);
    
    // Update meta theme-color for mobile browsers
    const themeColor = theme === THEMES.DARK ? '#1a1a1a' : '#ffffff';
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.content = themeColor;
  }, [state.currentTheme]);
  
  // Save theme preference to localStorage
  useEffect(() => {
    try {
      if (state.isSystemMode) {
        localStorage.removeItem('talentsphere-theme');
      } else {
        localStorage.setItem('talentsphere-theme', state.currentTheme);
      }
    } catch (error) {
      // Fail silently for privacy settings
      console.warn('Could not save theme preference:', error);
    }
  }, [state.currentTheme, state.isSystemMode]);
  
  // Load saved theme preference on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('talentsphere-theme');
      
      if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
        dispatch({ type: ThemeActionTypes.SET_THEME, payload: savedTheme });
      }
    } catch (error) {
      console.warn('Could not load theme preference:', error);
    }
  }, [dispatch]);
  
  const contextValue = {
    state,
    dispatch,
    // Convenience functions
    toggleTheme: useCallback(() => {
      dispatch({ type: ThemeActionTypes.TOGGLE_THEME });
    }, [dispatch]),
    
    setTheme: useCallback((theme) => {
      if (Object.values(THEMES).includes(theme)) {
        dispatch({ type: ThemeActionTypes.SET_THEME, payload: theme });
      }
    }, [dispatch]),
    
    setSystemTheme: useCallback(() => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const systemTheme = mediaQuery.matches ? THEMES.DARK : THEMES.LIGHT;
      dispatch({ type: ThemeActionTypes.SET_SYSTEM_THEME, payload: systemTheme });
    }, [dispatch]),
    
    // Theme getters
    isLightTheme: state.currentTheme === THEMES.LIGHT,
    isDarkTheme: state.currentTheme === THEMES.DARK,
    isSystemMode: state.isSystemMode
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

// Theme utilities
const themeUtils = {
  THEMES,
  ThemeActionTypes,
  
  // Get theme variables
  getThemeValue: (variable, theme = THEMES.LIGHT) => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    return computedStyle.getPropertyValue(`--color-${variable}-${theme}`);
  },
  
  // Check if theme is supported
  isValidTheme: (theme) => {
    return Object.values(THEMES).includes(theme);
  },
  
  // Get CSS custom properties for current theme
  getCurrentThemeStyles: () => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    const styles = {};
    
    // Get all CSS custom properties
    for (let i = 0; i < computedStyle.length; i++) {
      const property = computedStyle[i];
      if (property.startsWith('--color-') || property.startsWith('--spacing-') || property.startsWith('--font-')) {
        styles[property] = computedStyle.getPropertyValue(property);
      }
    }
    
    return styles;
  },
  
  // Generate theme-aware className
  getThemeClassName: (baseClass, theme = THEMES.LIGHT) => {
    return `${baseClass} ${baseClass}--${theme}`;
  }
};

export { 
  ThemeProvider, 
  useTheme, 
  themeUtils, 
  THEMES,
  ThemeActionTypes 
};

export default ThemeContext;