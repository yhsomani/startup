/**
 * Jobs Page Component
 * Job listings with search, filters, and pagination
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  CircularProgress,
  Pagination,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search,
  FilterList,
  Work,
  LocationOn,
  Schedule,
  MonetizationOn,
  Bookmark,
  BookmarkBorder
} from '@mui/icons-material';

const Jobs = () => {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    experience: '',
    salary: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [savedJobs, setSavedJobs] = useState(new Set());

  const jobsPerPage = 12;

  // Mock data - replace with API call
  const mockJobs = [
    {
      id: 1,
      title: 'Senior Frontend Developer',
      company: 'TechCorp',
      location: 'San Francisco, CA',
      type: 'Full-time',
      experience: 'Senior',
      salary: '$120k - $180k',
      description: 'We are looking for an experienced frontend developer...',
      skills: ['React', 'TypeScript', 'Node.js'],
      postedAt: '2 days ago',
      logo: 'TC'
    },
    {
      id: 2,
      title: 'React Developer',
      company: 'StartupXYZ',
      location: 'New York, NY',
      type: 'Full-time',
      experience: 'Mid',
      salary: '$90k - $130k',
      description: 'Join our team to build amazing React applications...',
      skills: ['React', 'JavaScript', 'CSS'],
      postedAt: '3 days ago',
      logo: 'SX'
    },
    {
      id: 3,
      title: 'Full Stack Engineer',
      company: 'Enterprise Inc',
      location: 'Remote',
      type: 'Full-time',
      experience: 'Senior',
      salary: '$130k - $170k',
      description: 'Looking for a versatile full stack developer...',
      skills: ['Python', 'React', 'AWS'],
      postedAt: '1 week ago',
      logo: 'EI'
    },
    {
      id: 4,
      title: 'Junior Frontend Developer',
      company: 'Digital Agency',
      location: 'Los Angeles, CA',
      type: 'Contract',
      experience: 'Junior',
      salary: '$60k - $80k',
      description: 'Great opportunity for junior developers to grow...',
      skills: ['HTML', 'CSS', 'JavaScript'],
      postedAt: '4 days ago',
      logo: 'DA'
    },
    {
      id: 5,
      title: 'Vue.js Developer',
      company: 'Innovation Labs',
      location: 'Austin, TX',
      type: 'Full-time',
      experience: 'Mid',
      salary: '$95k - $125k',
      description: 'We need a Vue.js expert for our next project...',
      skills: ['Vue.js', 'Vuex', 'JavaScript'],
      postedAt: '5 days ago',
      logo: 'IL'
    }
  ];

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [searchTerm, filters, jobs]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setJobs(mockJobs);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobs];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply other filters
    if (filters.type) {
      filtered = filtered.filter(job => job.type === filters.type);
    }
    if (filters.location) {
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters.experience) {
      filtered = filtered.filter(job => job.experience === filters.experience);
    }

    setFilteredJobs(filtered);
    setTotalPages(Math.ceil(filtered.length / jobsPerPage));
    setPage(1);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleSaveJob = (jobId) => {
    setSavedJobs(prev => {
      const newSaved = new Set(prev);
      if (newSaved.has(jobId)) {
        newSaved.delete(jobId);
      } else {
        newSaved.add(jobId);
      }
      return newSaved;
    });
  };

  const getCurrentPageJobs = () => {
    const startIndex = (page - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    return filteredJobs.slice(startIndex, endIndex);
  };

  const getExperienceColor = (experience) => {
    switch (experience) {
      case 'Junior': return 'success';
      case 'Mid': return 'primary';
      case 'Senior': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Find Your Dream Job
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover opportunities that match your skills and experience
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search jobs, companies, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Job Type</InputLabel>
              <Select
                value={filters.type}
                label="Job Type"
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="Full-time">Full-time</MenuItem>
                <MenuItem value="Part-time">Part-time</MenuItem>
                <MenuItem value="Contract">Contract</MenuItem>
                <MenuItem value="Remote">Remote</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Experience</InputLabel>
              <Select
                value={filters.experience}
                label="Experience"
                onChange={(e) => handleFilterChange('experience', e.target.value)}
              >
                <MenuItem value="">All Levels</MenuItem>
                <MenuItem value="Junior">Junior</MenuItem>
                <MenuItem value="Mid">Mid Level</MenuItem>
                <MenuItem value="Senior">Senior</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              placeholder="Location"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              InputProps={{
                startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<FilterList />}
              onClick={() => {/* Advanced filters modal */}}
            >
              More Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Count */}
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body1">
          {filteredJobs.length} jobs found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Page {page} of {totalPages}
        </Typography>
      </Box>

      {/* Jobs List */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {getCurrentPageJobs().map((job) => (
            <Grid item xs={12} sm={6} lg={4} key={job.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ flex: 1 }}>
                  {/* Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      {job.logo}
                    </Avatar>
                    <IconButton
                      size="small"
                      onClick={() => toggleSaveJob(job.id)}
                      color={savedJobs.has(job.id) ? 'primary' : 'default'}
                    >
                      {savedJobs.has(job.id) ? <Bookmark /> : <BookmarkBorder />}
                    </IconButton>
                  </Box>

                  {/* Job Info */}
                  <Typography variant="h6" gutterBottom>
                    {job.title}
                  </Typography>
                  <Typography variant="body1" color="primary" gutterBottom>
                    {job.company}
                  </Typography>

                  {/* Tags */}
                  <Box mb={2}>
                    <Chip
                      label={job.type}
                      size="small"
                      color={getExperienceColor(job.experience)}
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip
                      icon={<LocationOn />}
                      label={job.location}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip
                      icon={<MonetizationOn />}
                      label={job.salary}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  </Box>

                  {/* Skills */}
                  <Box mb={2}>
                    {job.skills.slice(0, 3).map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                    {job.skills.length > 3 && (
                      <Chip
                        label={`+${job.skills.length - 3}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {/* Posted Time */}
                  <Typography variant="caption" color="text.secondary">
                    <Schedule sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                    {job.postedAt}
                  </Typography>

                  {/* Actions */}
                  <Box mt={2}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => {/* Navigate to job detail */}}
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      {!loading && filteredJobs.length > 0 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* No Results */}
      {!loading && filteredJobs.length === 0 && (
        <Box textAlign="center" py={4}>
          <Work sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No jobs found
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Try adjusting your search criteria or filters
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setSearchTerm('');
              setFilters({
                type: '',
                location: '',
                experience: '',
                salary: ''
              });
            }}
          >
            Clear Filters
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default Jobs;