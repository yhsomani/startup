/**
 * Analytics Context
 * 
 * React Context for providing analytics data and analytics utilities
 * Handles user behavior tracking, performance metrics, and analytics features
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Logger } from '../../../shared/logger';

// Initial context state
const initialState = {
  // User analytics
  userAnalytics: {
    pageViews: [],
    sessionDuration: 0,
    scrollDepth: 0,
    clicks: [],
    formInteractions: [],
    errors: [],
    conversions: [],
  },
  
  // Performance analytics
  performance: {
    pageLoadTime: null,
    renderTime: null,
    apiResponseTime: [],
    bundleSize: null,
    memoryUsage: null,
    resourceTiming: [],
  },
  
  // Business analytics
  businessAnalytics: {
    funnelSteps: [],
    conversionRate: 0,
    userRetention: 0,
    featureUsage: {},
    revenueMetrics: {
      total: 0,
      bySource: {},
      byPlan: {},
    },
  },
  
  // Real-time analytics
  realtime: {
    activeUsers: [],
    currentSessions: [],
    events: [],
    heatmap: {},
    engagement: {},
  },
  
  // Settings
  settings: {
    trackPageViews: true,
    trackClicks: true,
    trackScrollDepth: true,
    trackFormInteractions: true,
    trackErrors: true,
    trackConversions: true,
    enableRealtime: true,
    sampleRate: 100, // 100% sampling in development, lower in production
    apiEndpoint: process.env.REACT_APP_ANALYTICS_API || '/api/v1/analytics',
  },
  
  // Status
  isTracking: false,
  error: null,
  lastSync: null,
};

// Create context
const AnalyticsContext = createContext(initialState);

// Context Provider Component
export const AnalyticsProvider = ({ children }) => {
  const [state, setState] = useState(initialState);
  const auth = useSelector(state => state.auth);
  
  // Initialize analytics tracking
  useEffect(() => {
    if (!state.settings.trackPageViews && auth.isAuthenticated) {
      return;
    }
    
    // Set up page view tracking
    const trackPageView = () => {
      if (!state.settings.trackPageViews) return;
      
      const pageView = {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: auth.user?.id,
        sessionId: getSessionId(),
      };
      
      setState(prev => ({
        ...prev,
        userAnalytics: {
          ...prev.userAnalytics,
          pageViews: [...prev.userAnalytics.pageViews, pageView],
        },
      }));
      
      // Send to analytics API
      sendAnalyticsData('page_view', pageView);
    };
    
    // Set up click tracking
    const trackClick = (event) => {
      if (!state.settings.trackClicks) return;
      
      const clickData = {
        element: event.target.tagName,
        elementId: event.target.id,
        elementClass: event.target.className,
        text: event.target.textContent?.substring(0, 100),
        href: event.target.href,
        coordinates: { x: event.clientX, y: event.clientY },
        timestamp: new Date().toISOString(),
        userId: auth.user?.id,
        sessionId: getSessionId(),
        pageUrl: window.location.href,
      };
      
      setState(prev => ({
        ...prev,
        userAnalytics: {
          ...prev.userAnalytics,
          clicks: [...prev.userAnalytics.clicks, clickData],
        },
      }));
      
      // Send to analytics API
      sendAnalyticsData('click', clickData);
    };
    
    // Set up scroll depth tracking
    let maxScrollDepth = 0;
    const trackScroll = () => {
      if (!state.settings.trackScrollDepth) return;
      
      const currentDepth = Math.max(
        document.documentElement.scrollTop,
        document.body.scrollTop
      );
      
      if (currentDepth > maxScrollDepth) {
        maxScrollDepth = currentDepth;
        
        setState(prev => ({
          ...prev,
          userAnalytics: {
            ...prev.userAnalytics,
            scrollDepth: currentDepth,
          },
        }));
        
        // Send to analytics API
        sendAnalyticsData('scroll_depth', {
          depth: currentDepth,
          timestamp: new Date().toISOString(),
          userId: auth.user?.id,
          sessionId: getSessionId(),
          pageUrl: window.location.href,
        });
      }
    };
    
    // Set up form interaction tracking
    const trackFormInteraction = (event) => {
      if (!state.settings.trackFormInteractions) return;
      
      const formData = {
        formType: event.target.form?.id || event.target.closest('form')?.id || 'unknown',
        fieldName: event.target.name || event.target.getAttribute('name'),
        fieldType: event.target.type,
        interaction: event.type,
        value: event.target.value || event.target.checked,
        timestamp: new Date().toISOString(),
        userId: auth.user?.id,
        sessionId: getSessionId(),
      };
      
      setState(prev => ({
        ...prev,
        userAnalytics: {
          ...prev.userAnalytics,
          formInteractions: [...prev.userAnalytics.formInteractions, formData],
        },
      }));
      
      // Send to analytics API
      sendAnalyticsData('form_interaction', formData);
    };
    
    // Set up error tracking
    const trackError = (error, context = 'application') => {
      if (!state.settings.trackErrors) return;
      
      const errorData = {
        message: error.message || error.toString(),
        stack: error.stack,
        context,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userId: auth.user?.id,
        sessionId: getSessionId(),
        userAgent: navigator.userAgent,
      };
      
      setState(prev => ({
        ...prev,
        userAnalytics: {
          ...prev.userAnalytics,
          errors: [...prev.userAnalytics.errors, errorData],
        },
        isTracking: false,
        error: errorData,
      }));
      
      // Send to analytics API
      sendAnalyticsData('error', errorData);
    };
    
    // Set up conversion tracking
    const trackConversion = (conversionData) => {
      if (!state.settings.trackConversions) return;
      
      const data = {
        ...conversionData,
        timestamp: new Date().toISOString(),
        userId: auth.user?.id,
        sessionId: getSessionId(),
        pageUrl: window.location.href,
      };
      
      setState(prev => ({
        ...prev,
        businessAnalytics: {
          ...prev.businessAnalytics,
          conversions: [...prev.businessAnalytics.conversions, data],
        },
      }));
      
      // Send to analytics API
      sendAnalyticsData('conversion', data);
    };
    
    // Generate session ID
    function getSessionId() {
      let sessionId = sessionStorage.getItem('analytics_session_id');
      
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('analytics_session_id', sessionId);
      }
      
      return sessionId;
    }
    
    // Send data to analytics API
    const sendAnalyticsData = async (eventType, data) => {
      try {
        setState(prev => ({ ...prev, isTracking: true }));
        
        const response = await fetch(state.settings.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.token}`,
          },
          body: JSON.stringify({
            type: eventType,
            data,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Analytics API error: ${response.status}`);
        }
        
        setState(prev => ({ 
          ...prev, 
          lastSync: new Date().toISOString(),
          isTracking: false 
        }));
        
      } catch (error) {
        logger.error('Analytics tracking error', { error, eventType, data });
        setState(prev => ({ 
          ...prev, 
          error: error.message,
          isTracking: false 
        }));
      }
    };
    
    // Performance monitoring
    const trackPerformance = () => {
      if (window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0];
        
        if (navigation) {
          setState(prev => ({
            ...prev,
            performance: {
              ...prev.performance,
              pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
              resourceTiming: {
                server: {
                  connect: navigation.connectEnd - navigation.connectStart,
                  ssl: navigation.secureConnectionStart - navigation.secureConnectionEnd,
                },
                dom: navigation.domContentLoadedEventStart - navigation.domLoadingEventStart,
              },
            },
          }));
        }
      }
    };
    
    // Memory monitoring
    const trackMemoryUsage = () => {
      if ('memory' in performance) {
        const memoryInfo = performance.memory;
        
        setState(prev => ({
          ...prev,
          performance: {
            ...prev.performance,
            memoryUsage: {
              used: memoryInfo.usedJSHeapSize,
              total: memoryInfo.totalJSHeapSize,
              limit: memoryInfo.jsHeapSizeLimit,
            },
          },
        }));
      }
    };
    
    // Add event listeners
    document.addEventListener('click', trackClick);
    window.addEventListener('scroll', trackScroll);
    window.addEventListener('beforeunload', () => {
      // Track session end
      sendAnalyticsData('session_end', {
        duration: Date.now() - parseInt(sessionStorage.getItem('session_start') || Date.now()),
        pageViews: state.userAnalytics.pageViews.length,
        clicks: state.userAnalytics.clicks.length,
        formInteractions: state.userAnalytics.formInteractions.length,
        userId: auth.user?.id,
        sessionId: getSessionId(),
      });
    });
    
    window.addEventListener('error', (event) => {
      trackError(event.error, event.error?.type || 'javascript');
    });
    
    // Performance monitoring
    window.addEventListener('load', () => {
      trackPerformance();
      trackMemoryUsage();
      
      // Set session start time
      sessionStorage.setItem('session_start', Date.now().toString());
    });
    
    // Cleanup function
    const cleanup = () => {
      document.removeEventListener('click', trackClick);
      window.removeEventListener('scroll', trackScroll);
      window.removeEventListener('beforeunload', () => {});
      window.removeEventListener('load', trackPerformance);
      window.removeEventListener('load', trackMemoryUsage);
    };
    
    // Cleanup on unmount
    useEffect(() => {
      return cleanup;
    }, []);
    
    const contextValue = {
      ...state,
      
      // Analytics functions
      trackPageView: () => {
        trackPageView();
      },
      
      trackEvent: (eventType, data) => {
        if (eventType === 'form_interaction') {
          trackFormInteraction(data);
        } else if (eventType === 'conversion') {
          trackConversion(data);
        } else if (eventType === 'error') {
          trackError(data.error, data.context);
        }
      },
      
      trackPerformance: () => {
        trackPerformance();
      },
      
      trackMemory: () => {
        trackMemoryUsage();
      },
      
      clearData: () => {
        setState(initialState);
        sessionStorage.removeItem('analytics_session_id');
      },
      
      updateSettings: (newSettings) => {
        setState(prev => ({ ...prev, settings: { ...prev.settings, ...newSettings } }));
      },
      
      getAnalyticsData: () => ({
        userAnalytics: state.userAnalytics,
        performance: state.performance,
        businessAnalytics: state.businessAnalytics,
        realtime: state.realtime,
        settings: state.settings,
      }),
      
      clearError: () => {
        setState(prev => ({ ...prev, error: null, isTracking: false }));
      },
    };
  
  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Custom hook for using analytics context
export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  
  return context;
};

export default AnalyticsContext;