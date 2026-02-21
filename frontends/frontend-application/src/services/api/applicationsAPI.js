/**
 * Applications API Service
 * 
 * Dedicated service for handling job applications API calls
 * including CRUD operations and application analytics
 */

import api from '../api';

// Applications API endpoints
const applicationsAPI = {
  // Get user applications with pagination and filtering
  getUserApplications: async (params = {}) => {
    const response = await api.applications.getApplications(params);
    return response.data;
  },

  // Get single application by ID
  getApplication: async (id) => {
    const response = await api.applications.getApplication(id);
    return response.data;
  },

  // Create new application
  createApplication: async (applicationData) => {
    const response = await api.jobs.applyToJob(applicationData.jobId, applicationData);
    return response.data;
  },

  // Update application status
  updateApplicationStatus: async (id, statusData) => {
    const response = await api.applications.updateApplication(id, statusData);
    return response.data;
  },

  // Withdraw application
  withdrawApplication: async (id) => {
    const response = await api.applications.withdrawApplication(id);
    return response.data;
  },

  // Get application history
  getApplicationHistory: async () => {
    const response = await api.applications.getApplicationHistory();
    return response.data;
  },

  // Get application analytics
  getApplicationAnalytics: async () => {
    const response = await api.analytics.getApplicationStats();
    return response.data;
  },

  // Get application status options
  getApplicationStatuses: () => {
    return [
      { value: 'pending', label: 'Pending', color: 'warning' },
      { value: 'viewed', label: 'Viewed', color: 'info' },
      { value: 'interviewing', label: 'Interviewing', color: 'primary' },
      { value: 'accepted', label: 'Accepted', color: 'success' },
      { value: 'rejected', label: 'Rejected', color: 'error' },
      { value: 'withdrawn', label: 'Withdrawn', color: 'default' },
    ];
  },

  // Calculate application statistics
  calculateStats: (applications) => {
    const stats = {
      total: applications.length,
      pending: 0,
      viewed: 0,
      interviewing: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
    };

    applications.forEach(app => {
      if (stats.hasOwnProperty(app.status)) {
        stats[app.status]++;
      }
    });

    return stats;
  },

  // Filter applications by status
  filterByStatus: (applications, status) => {
    if (!status) return applications;
    return applications.filter(app => app.status === status);
  },

  // Sort applications by date
  sortByDate: (applications, order = 'desc') => {
    return applications.sort((a, b) => {
      const dateA = new Date(a.appliedDate || a.createdAt);
      const dateB = new Date(b.appliedDate || b.createdAt);
      return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
  },
};

export default applicationsAPI;