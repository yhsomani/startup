/**
 * Analytics Slice
 * 
 * Redux Toolkit slice for analytics state management
 * Handles analytics data, charts, metrics, and reporting
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const fetchAnalyticsOverview = createAsyncThunk(
  'analytics/fetchOverview',
  async ({ period = '30d' }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/analytics/overview?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to fetch analytics overview');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch analytics overview');
    }
  }
);

export const fetchUserAnalytics = createAsyncThunk(
  'analytics/fetchUserAnalytics',
  async ({ period = '30d', userId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/analytics/users/${userId}?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to fetch user analytics');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch user analytics');
    }
  }
);

export const fetchJobAnalytics = createAsyncThunk(
  'analytics/fetchJobAnalytics',
  async ({ period = '30d', jobId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/analytics/jobs/${jobId}?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to fetch job analytics');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch job analytics');
    }
  }
);

export const fetchCompanyAnalytics = createAsyncThunk(
  'analytics/fetchCompanyAnalytics',
  async ({ period = '30d', companyId }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/analytics/companies/${companyId}?period=${period}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to fetch company analytics');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch company analytics');
    }
  }
);

// Initial state
const initialState = {
  overview: {
    totalUsers: 0,
    totalJobs: 0,
    totalApplications: 0,
    totalCompanies: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    newJobsThisMonth: 0,
    conversionRate: 0,
    averageResponseTime: 0,
  },
  userAnalytics: {
    profileViews: 0,
    jobViews: 0,
    applicationsSubmitted: 0,
    interviewsScheduled: 0,
    offersReceived: 0,
    skillsTrending: [],
    experienceLevel: 'unknown',
    completionScore: 0,
  },
  jobAnalytics: {
    views: 0,
    applications: 0,
    uniqueApplicants: 0,
    averageSalary: 0,
    skillsRequired: [],
    locationDistribution: [],
    experienceLevels: [],
    postingDuration: 0,
    conversionRate: 0,
  },
  companyAnalytics: {
    profileViews: 0,
    jobPostings: 0,
    totalApplications: 0,
    activeJobs: 0,
    averageTimeToHire: 0,
    growthRate: 0,
    employeeCount: 0,
    retentionRate: 0,
  },
  charts: {
    userGrowth: {
      labels: [],
      datasets: [],
    },
    jobPostings: {
      labels: [],
      datasets: [],
    },
    applicationFunnel: {
      labels: [],
      datasets: [],
    },
    revenue: {
      labels: [],
      datasets: [],
    },
  },
  filters: {
    period: '30d',
    startDate: null,
    endDate: null,
    comparison: 'none', // none, previous_period, previous_year
    category: 'all', // all, jobs, users, companies
  },
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Slice
const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setCharts: (state, action) => {
      state.charts = { ...state.charts, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch overview
      .addCase(fetchAnalyticsOverview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnalyticsOverview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.overview = action.payload.overview || initialState.overview;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchAnalyticsOverview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch user analytics
      .addCase(fetchUserAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userAnalytics = action.payload.userAnalytics || initialState.userAnalytics;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchUserAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch job analytics
      .addCase(fetchJobAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobAnalytics = action.payload.jobAnalytics || initialState.jobAnalytics;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchJobAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch company analytics
      .addCase(fetchCompanyAnalytics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompanyAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.companyAnalytics = action.payload.companyAnalytics || initialState.companyAnalytics;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchCompanyAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectOverview = (state) => state.analytics.overview;
export const selectUserAnalytics = (state) => state.analytics.userAnalytics;
export const selectJobAnalytics = (state) => state.analytics.jobAnalytics;
export const selectCompanyAnalytics = (state) => state.analytics.companyAnalytics;
export const selectCharts = (state) => state.analytics.charts;
export const selectFilters = (state) => state.analytics.filters;
export const selectAnalyticsLoading = (state) => state.analytics.isLoading;
export const selectAnalyticsError = (state) => state.analytics.error;
export const selectLastUpdated = (state) => state.analytics.lastUpdated;

export default analyticsSlice.reducer;