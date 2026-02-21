/**
 * Profile Slice
 * 
 * Redux Toolkit slice for user profile state management
 * Handles user data, preferences, and profile updates
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'profile/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/v1/users/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to fetch profile');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'profile/updateUserProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/v1/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to update profile');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

export const uploadProfilePicture = createAsyncThunk(
  'profile/uploadProfilePicture',
  async (file, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch('/api/v1/users/me/picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.error || 'Failed to upload picture');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to upload picture');
    }
  }
);

// Initial state
const initialState = {
  profile: null,
  preferences: {
    theme: 'light',
    language: 'en',
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    privacy: {
      showEmail: false,
      showPhone: false,
      showLocation: false,
    }
  },
  skills: [],
  experience: [],
  education: [],
  certifications: [],
  socialLinks: [],
  isLoading: false,
  error: null,
  updateStatus: 'idle', // idle, loading, succeeded, failed
  uploadStatus: 'idle',
};

// Slice
const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setProfile: (state, action) => {
      state.profile = action.payload;
    },
    updatePreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    addSkill: (state, action) => {
      state.skills.push(action.payload);
    },
    updateSkill: (state, action) => {
      const index = state.skills.findIndex(skill => skill.id === action.payload.id);
      if (index !== -1) {
        state.skills[index] = action.payload;
      }
    },
    removeSkill: (state, action) => {
      state.skills = state.skills.filter(skill => skill.id !== action.payload);
    },
    addExperience: (state, action) => {
      state.experience.push(action.payload);
    },
    updateExperience: (state, action) => {
      const index = state.experience.findIndex(exp => exp.id === action.payload.id);
      if (index !== -1) {
        state.experience[index] = action.payload;
      }
    },
    removeExperience: (state, action) => {
      state.experience = state.experience.filter(exp => exp.id !== action.payload);
    },
    addEducation: (state, action) => {
      state.education.push(action.payload);
    },
    updateEducation: (state, action) => {
      const index = state.education.findIndex(edu => edu.id === action.payload.id);
      if (index !== -1) {
        state.education[index] = action.payload;
      }
    },
    removeEducation: (state, action) => {
      state.education = state.education.filter(edu => edu.id !== action.payload);
    },
    addCertification: (state, action) => {
      state.certifications.push(action.payload);
    },
    removeCertification: (state, action) => {
      state.certifications = state.certifications.filter(cert => cert.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload.user;
        state.preferences = action.payload.user.preferences || state.preferences;
        state.skills = action.payload.user.skills || [];
        state.experience = action.payload.user.experience || [];
        state.education = action.payload.user.education || [];
        state.certifications = action.payload.user.certifications || [];
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update profile
      .addCase(updateUserProfile.pending, (state) => {
        state.updateStatus = 'loading';
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded';
        state.isLoading = false;
        state.profile = { ...state.profile, ...action.payload.user };
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Upload picture
      .addCase(uploadProfilePicture.pending, (state) => {
        state.uploadStatus = 'loading';
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadProfilePicture.fulfilled, (state, action) => {
        state.uploadStatus = 'succeeded';
        state.isLoading = false;
        if (state.profile) {
          state.profile.profilePicture = action.payload.profilePicture;
        }
      })
      .addCase(uploadProfilePicture.rejected, (state, action) => {
        state.uploadStatus = 'failed';
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Selectors
export const selectProfile = (state) => state.profile.profile;
export const selectProfilePreferences = (state) => state.profile.preferences;
export const selectProfileSkills = (state) => state.profile.skills;
export const selectProfileExperience = (state) => state.profile.experience;
export const selectProfileEducation = (state) => state.profile.education;
export const selectProfileCertifications = (state) => state.profile.certifications;
export const selectProfileLoading = (state) => state.profile.isLoading;
export const selectProfileError = (state) => state.profile.error;

export default profileSlice.reducer;