/**
 * Applications Slice
 * 
 * Redux slice for managing job applications state
 * including user applications, status tracking, and application history
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import applicationsAPI from '../../services/api/applicationsAPI';

// Async thunks for applications
export const fetchUserApplications = createAsyncThunk(
  'applications/fetchUserApplications',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await applicationsAPI.getUserApplications(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch applications');
    }
  }
);

export const createApplication = createAsyncThunk(
  'applications/createApplication',
  async (applicationData, { rejectWithValue }) => {
    try {
      const response = await applicationsAPI.createApplication(applicationData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit application');
    }
  }
);

export const updateApplicationStatus = createAsyncThunk(
  'applications/updateApplicationStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await applicationsAPI.updateApplicationStatus(id, { status });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update application status');
    }
  }
);

export const withdrawApplication = createAsyncThunk(
  'applications/withdrawApplication',
  async (id, { rejectWithValue }) => {
    try {
      await applicationsAPI.withdrawApplication(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to withdraw application');
    }
  }
);

export const fetchApplicationAnalytics = createAsyncThunk(
  'applications/fetchApplicationAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await applicationsAPI.getApplicationAnalytics();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch application analytics');
    }
  }
);

// Initial state
const initialState = {
  applications: [],
  currentApplication: null,
  analytics: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    status: '',
    jobType: '',
    dateRange: '',
    sortBy: 'appliedDate',
    sortOrder: 'desc',
  },
};

// Applications slice
const applicationsSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentApplication: (state) => {
      state.currentApplication = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    updateApplicationInList: (state, action) => {
      const { id, updates } = action.payload;
      const index = state.applications.findIndex(app => app.id === id);
      if (index !== -1) {
        state.applications[index] = { ...state.applications[index], ...updates };
      }
    },
    addApplicationToHistory: (state, action) => {
      state.applications.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user applications
      .addCase(fetchUserApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserApplications.fulfilled, (state, action) => {
        state.loading = false;
        state.applications = action.payload.applications || [];
        state.pagination = action.payload.pagination || initialState.pagination;
      })
      .addCase(fetchUserApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create application
      .addCase(createApplication.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createApplication.fulfilled, (state, action) => {
        state.loading = false;
        state.applications.unshift(action.payload);
        state.currentApplication = action.payload;
      })
      .addCase(createApplication.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update application status
      .addCase(updateApplicationStatus.fulfilled, (state, action) => {
        const index = state.applications.findIndex(app => app.id === action.payload.id);
        if (index !== -1) {
          state.applications[index] = action.payload;
        }
        if (state.currentApplication?.id === action.payload.id) {
          state.currentApplication = action.payload;
        }
      })
      .addCase(updateApplicationStatus.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Withdraw application
      .addCase(withdrawApplication.fulfilled, (state, action) => {
        state.applications = state.applications.filter(app => app.id !== action.payload);
        if (state.currentApplication?.id === action.payload) {
          state.currentApplication = null;
        }
      })
      .addCase(withdrawApplication.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Fetch application analytics
      .addCase(fetchApplicationAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApplicationAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchApplicationAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Actions
export const {
  clearError,
  clearCurrentApplication,
  setFilters,
  clearFilters,
  setPagination,
  updateApplicationInList,
  addApplicationToHistory,
} = applicationsSlice.actions;

// Selectors
export const selectApplications = (state) => state.applications.applications;
export const selectCurrentApplication = (state) => state.applications.currentApplication;
export const selectApplicationsLoading = (state) => state.applications.loading;
export const selectApplicationsError = (state) => state.applications.error;
export const selectApplicationsPagination = (state) => state.applications.pagination;
export const selectApplicationsFilters = (state) => state.applications.filters;
export const selectApplicationsAnalytics = (state) => state.applications.analytics;

// Get derived selectors
export const selectApplicationsByStatus = (status) => (state) => {
  return state.applications.applications.filter(app => app.status === status);
};

export const selectRecentApplications = (limit = 5) => (state) => {
  return state.applications.applications
    .slice()
    .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))
    .slice(0, limit);
};

export const selectApplicationStats = (state) => {
  const applications = state.applications.applications;
  return {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    viewed: applications.filter(app => app.status === 'viewed').length,
    interviewing: applications.filter(app => app.status === 'interviewing').length,
    accepted: applications.filter(app => app.status === 'accepted').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    withdrawn: applications.filter(app => app.status === 'withdrawn').length,
  };
};

// Reducer
export default applicationsSlice.reducer;