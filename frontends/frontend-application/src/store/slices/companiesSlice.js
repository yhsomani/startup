/**
 * Companies Slice
 * 
 * Redux Toolkit slice for company data and company search state
 * Handles company listings, details, and following
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const fetchCompanies = createAsyncThunk(
  'companies/fetchCompanies',
  async ({ page = 1, limit = 20, search = '' }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search
      });
      
      const response = await fetch(`/api/v1/companies?${queryParams}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to fetch companies');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch companies');
    }
  }
);

export const fetchCompanyDetails = createAsyncThunk(
  'companies/fetchCompanyDetails',
  async (companyId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/companies/${companyId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to fetch company details');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch company details');
    }
  }
);

export const followCompany = createAsyncThunk(
  'companies/followCompany',
  async (companyId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/companies/${companyId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to follow company');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to follow company');
    }
  }
);

export const unfollowCompany = createAsyncThunk(
  'companies/unfollowCompany',
  async (companyId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/v1/companies/${companyId}/follow`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to unfollow company');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to unfollow company');
    }
  }
);

// Initial state
const initialState = {
  companies: [],
  companyDetails: null,
  followedCompanies: [],
  searchResults: [],
  filters: {
    keyword: '',
    industry: '',
    size: '',
    location: '',
    founded: '',
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
  error: null,
  followStatus: 'idle', // idle, loading, succeeded, failed
  unfollowStatus: 'idle',
};

// Slice
const companiesSlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCompanyDetails: (state, action) => {
      state.companyDetails = action.payload;
    },
    clearCompanyDetails: (state) => {
      state.companyDetails = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.isSearching = false;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch companies
      .addCase(fetchCompanies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.companies = action.payload.companies || [];
        state.pagination = action.payload.pagination || initialState.pagination;
        state.error = null;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch company details
      .addCase(fetchCompanyDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompanyDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.companyDetails = action.payload.company;
        state.error = null;
      })
      .addCase(fetchCompanyDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Follow company
      .addCase(followCompany.pending, (state) => {
        state.followStatus = 'loading';
      })
      .addCase(followCompany.fulfilled, (state, action) => {
        state.followStatus = 'succeeded';
        if (!state.followedCompanies.find(company => company.id === action.meta.arg.companyId)) {
          state.followedCompanies.push({
            id: action.meta.arg.companyId,
            followedAt: new Date().toISOString()
          });
        }
      })
      .addCase(followCompany.rejected, (state, action) => {
        state.followStatus = 'failed';
        state.error = action.payload;
      })
      
      // Unfollow company
      .addCase(unfollowCompany.pending, (state) => {
        state.unfollowStatus = 'loading';
      })
      .addCase(unfollowCompany.fulfilled, (state, action) => {
        state.unfollowStatus = 'succeeded';
        state.followedCompanies = state.followedCompanies.filter(company => company.id !== action.meta.arg.companyId);
      })
      .addCase(unfollowCompany.rejected, (state, action) => {
        state.unfollowStatus = 'failed';
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectCompanies = (state) => state.companies.companies;
export const selectCompanyDetails = (state) => state.companies.companyDetails;
export const selectFollowedCompanies = (state) => state.companies.followedCompanies;
export const selectCompanyFilters = (state) => state.companies.filters;
export const selectCompanyPagination = (state) => state.companies.pagination;
export const selectCompaniesLoading = (state) => state.companies.isLoading;
export const selectCompaniesError = (state) => state.companies.error;

export default companiesSlice.reducer;