/**
 * TalentSphere Theme Configuration
 * Material-UI theme customization for TalentSphere brand
 */

import { createTheme } from '@mui/material/styles';

// Brand colors
const brandColors = {
  primary: {
    main: '#0066cc',    // TalentSphere blue
    light: '#3385ff',
    dark: '#0052a3',
    contrastText: '#ffffff'
  },
  secondary: {
    main: '#f50057',    // TalentSphere accent
    light: '#f53371',
    dark: '#c50e3d',
    contrastText: '#ffffff'
  },
  accent: {
    main: '#00bcd4',    // Success green
    light: '#4dd0e1',
    dark: '#00897b',
    contrastText: '#ffffff'
  },
  warning: {
    main: '#ff9800',    // Warning orange
    light: '#ffb74d',
    dark: '#f57c00',
    contrastText: '#000000'
  },
  error: {
    main: '#f44336',    // Error red
    light: '#e57373',
    dark: '#d32f2f',
    contrastText: '#ffffff'
  },
  info: {
    main: '#2196f3',    // Info blue
    light: '#64b5f6',
    dark: '#1976d2',
    contrastText: '#ffffff'
  },
  neutral: {
    main: '#757575',    // Neutral gray
    light: '#bdbdbd',
    dark: '#424242',
    contrastText: '#ffffff'
  }
};

// Typography configuration
const typography = {
  fontFamily: [
    'Roboto',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif'
  ].join(','),
  
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em'
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em'
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '0em'
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '0em'
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: '0em'
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.6,
    letterSpacing: '0.01em'
  },
  subtitle1: {
    fontSize: '1.1rem',
    fontWeight: 500,
    lineHeight: 1.5
  },
  subtitle2: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.5
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.6
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.5
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.5,
    textTransform: 'none'
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.4
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.4,
    textTransform: 'uppercase'
  }
};

// Shape configuration
const shape = {
  borderRadius: 8,
  borderRadiusSmall: 4,
  borderRadiusLarge: 12,
  borderRadiusExtraLarge: 16,
  borderRadiusNone: 0
};

// Spacing configuration
const spacing = (factor = 1) => ({
  xs: factor * 4,
  sm: factor * 8,
  md: factor * 16,
  lg: factor * 24,
  xl: factor * 32,
  xxl: factor * 48
});

// Breakpoints configuration
const breakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
    xxl: 1920
  },
  unit: 'px'
};

// Component overrides
const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        borderRadius: shape.borderRadius,
        fontWeight: 500,
        padding: '8px 16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.16)'
        },
        '&:active': {
          transform: 'translateY(0)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.12)'
        }
      },
      contained: {
        background: brandColors.primary.main,
        color: brandColors.primary.contrastText,
        '&:hover': {
          background: brandColors.primary.dark,
        }
      },
      outlined: {
        borderColor: brandColors.primary.main,
        color: brandColors.primary.main,
        '&:hover': {
          borderColor: brandColors.primary.dark,
          background: 'rgba(0, 102, 204, 0.04)'
        }
      }
    },
    sizeLarge: {
      padding: '12px 24px',
      fontSize: '1rem'
    },
    sizeSmall: {
      padding: '6px 12px',
      fontSize: '0.875rem'
    }
  },
  
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: shape.borderRadiusLarge,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
        }
      }
    }
  },
  
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: shape.borderRadius
      }
    }
  },
  
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: shape.borderRadiusSmall,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: brandColors.primary.light
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: brandColors.primary.main
          }
        }
      }
    }
  },
  
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: shape.borderRadiusLarge,
        fontWeight: 500,
        '&.MuiChip-colorPrimary': {
          backgroundColor: brandColors.primary.main,
          color: brandColors.primary.contrastText
        },
        '&.MuiChip-colorSecondary': {
          backgroundColor: brandColors.secondary.main,
          color: brandColors.secondary.contrastText
        },
        '&.MuiChip-colorDefault': {
          backgroundColor: brandColors.neutral.main,
          color: brandColors.neutral.contrastText
        }
      }
    }
  },
  
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: brandColors.primary.main,
        color: brandColors.primary.contrastText,
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
      }
    }
  },
  
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }
    }
  },
  
  MuiListItem: {
    styleOverrides: {
      root: {
        borderRadius: shape.borderRadiusSmall,
        '&:hover': {
          backgroundColor: 'rgba(0, 102, 204, 0.04)'
        }
      },
      button: {
        '&:hover': {
          backgroundColor: brandColors.primary.light
        }
      }
    }
  },
  
  MuiTableCell: {
    styleOverrides: {
      head: {
        backgroundColor: brandColors.neutral.light,
        fontWeight: 600,
        borderBottom: `2px solid ${brandColors.neutral.main}`
      },
      body: {
        borderBottom: `1px solid ${brandColors.neutral.light}`
      }
    }
  },
  
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: shape.borderRadiusSmall,
        '&:hover': {
          backgroundColor: brandColors.primary.light
        }
      }
    }
  },
  
  MuiLink: {
    styleOverrides: {
      root: {
        color: brandColors.primary.main,
        textDecoration: 'none',
        fontWeight: 500,
        '&:hover': {
          color: brandColors.primary.dark,
          textDecoration: 'underline'
        }
      }
    }
  }
};

// Light theme
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: brandColors.primary,
    secondary: brandColors.secondary,
    accent: brandColors.accent,
    warning: brandColors.warning,
    error: brandColors.error,
    info: brandColors.info,
    neutral: brandColors.neutral,
    background: {
      default: '#ffffff',
      paper: '#ffffff'
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)'
    },
    divider: brandColors.neutral.light
  },
  typography,
  shape,
  spacing,
  breakpoints,
  components
});

// Dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: brandColors.primary,
    secondary: brandColors.secondary,
    accent: brandColors.accent,
    warning: brandColors.warning,
    error: brandColors.error,
    info: brandColors.info,
    neutral: brandColors.neutral,
    background: {
      default: '#121212',
      paper: '#1e1e1e'
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)'
    },
    divider: 'rgba(255, 255, 255, 0.12)'
  },
  typography,
  shape,
  spacing,
  breakpoints,
  components: {
    ...components,
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          border: `1px solid ${brandColors.neutral.dark}`
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e'
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            color: '#ffffff',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: brandColors.neutral.dark
            }
          }
        }
      }
    }
  }
});

// Theme utilities
const getTheme = (mode = 'light') => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

const themeModes = {
  light: 'light',
  dark: 'dark',
  auto: 'auto'
};

const customTheme = {
  ...lightTheme,
  custom: {
    colors: brandColors,
    gradients: {
      primary: `linear-gradient(45deg, ${brandColors.primary.light} 0%, ${brandColors.primary.main} 100%)`,
      secondary: `linear-gradient(45deg, ${brandColors.secondary.light} 0%, ${brandColors.secondary.main} 100%)`,
      success: `linear-gradient(45deg, ${brandColors.accent.light} 0%, ${brandColors.accent.main} 100%)`
    },
    shadows: {
      card: '0 4px 20px rgba(0, 102, 204, 0.08)',
      elevated: '0 8px 30px rgba(0, 102, 204, 0.12)',
      floating: '0 16px 40px rgba(0, 102, 204, 0.16)'
    }
  }
};

export {
  lightTheme,
  darkTheme,
  getTheme,
  themeModes,
  customTheme,
  brandColors,
  typography,
  shape,
  spacing
};