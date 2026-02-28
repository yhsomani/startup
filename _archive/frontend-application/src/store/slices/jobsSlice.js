/**
 * Jobs Slice
 * 
 * Redux Toolkit slice for job listings and job search state
 * Handles job data, search filters, and application management
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const fetchJobs = createAsyncThunk(
  'jobs/fetchJobs',
  async ({ page = 1, limit = 20, filters = {} }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      const response = await fetch(`/api/v1/jobs?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to fetch jobs');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch jobs');
    }
  }
);

export const searchJobs = createAsyncThunk(
  'jobs/searchJobs',
  async ({ query, location, type, experience }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const searchParams = new URLSearchParams({
        q: query,
        location,
        type,
        experience
      });
      
      const response = await fetch(`/api/v1/jobs/search?${searchParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to search jobs');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to search jobs');
    }
  }
);

export const applyToJob = createAsyncThunk(
  'jobs/applyToJob',
  async ({ jobId, applicationData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(applicationData),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to apply to job');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to apply to job');
    }
  }
);

export const saveJob = createAsyncThunk(
  'jobs/saveJob',
  async (jobId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/jobs/${jobId}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to save job');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to save job');
    }
  }
);

// Initial state
const initialState = {
  jobs: [],
  savedJobs: [],
  applications: [],
  searchResults: [],
  filters: {
    keyword: '',
    location: '',
    type: '',
    experience: '',
    salary: '',
    remote: false,
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  isLoading: false,
  isSearching: false,
  isApplying: false,
  error: null,
  searchLoading: false,
  applicationStatus: 'idle',
  saveStatus: 'idle',
};

// Slice
const jobsSlice = createSlice({
  name: 'jobs',
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
    removeJob: (state, action) => {
      state.jobs = state.jobs.filter(job => job.id !== action.payload);
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchLoading = false;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    updateApplicationStatus: (state, action) => {
      const index = state.applications.findIndex(app => app.jobId === action.payload.jobId);
      if (index !== -1) {
        state.applications[index] = { ...state.applications[index], ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch jobs
      .addCase(fetchJobs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.jobs = action.payload.jobs || [];
        state.pagination = action.payload.pagination || initialState.pagination;
        state.error = null;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Search jobs
      .addCase(searchJobs.pending, (state) => {
        state.isSearching = true;
        state.searchLoading = true;
        state.error = null;
      })
      .addCase(searchJobs.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchLoading = false;
        state.searchResults = action.payload.jobs || [];
        state.error = null;
      })
      .addCase(searchJobs.rejected, (state, action) => {
        state.isSearching = false;
        state.searchLoading = false;
        state.error = action.payload;
      })
      
      // Apply to job
      .addCase(applyToJob.pending, (state) => {
        state.isApplying = true;
        state.applicationStatus = 'loading';
        state.error = null;
      })
      .addCase(applyToJob.fulfilled, (state, action) => {
        state.isApplying = false;
        state.applicationStatus = 'succeeded';
        state.applications.push({
          id: Date.now(),
          jobId: action.meta.arg.jobId,
          ...action.payload,
          appliedAt: new Date().toISOString(),
          status: 'pending'
        });
        state.error = null;
      })
      .addCase(applyToJob.rejected, (state, action) => {
        state.isApplying = false;
        state.applicationStatus = 'failed';
        state.error = action.payload;
      })
      
      // Save job
      .addCase(saveJob.pending, (state) => {
        state.saveStatus = 'loading';
        state.error = null;
      })
      .addCase(saveJob.fulfilled, (state, action) => {
        state.saveStatus = 'succeeded';
        if (!state.savedJobs.find(job => job.id === action.meta.arg.jobId)) {
          state.savedJobs.push({
            id: action.meta.arg.jobId,
            savedAt: new Date().toISOString()
          });
        }
        state.error = null;
      })
      .addCase(saveJob.rejected, (state, action) => {
        state.saveStatus = 'failed';
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectJobs = (state) => state.jobs.jobs;
export const selectSavedJobs = (state) => state.jobs.savedJobs;
export const selectApplications = (state) => state.jobs.applications;
export const selectSearchResults = (state) => state.jobs.searchResults;
export const selectJobFilters = (state) => state.jobs.filters;
export const selectJobPagination = (state) => state.jobs.pagination;
export const selectJobsLoading = (state) => state.jobs.isLoading;
export const selectSearchLoading = (state) => state.jobs.searchLoading;
export const selectIsApplying = (state) => state.jobs.isApplying;
export const selectJobsError = (state) => state.jobs.error;

export default jobsSlice.reducer;