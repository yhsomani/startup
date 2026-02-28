/**
 * Profile Page Component
 * User profile management and editing
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
  Avatar,
  CircularProgress,
  Paper,
  Divider,
  Chip,
  IconButton,
  Upload
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  LinkedIn,
  GitHub,
  Twitter,
  Language,
  Email,
  Phone,
  LocationOn
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const profileSchema = yup.object().shape({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  title: yup.string().required('Professional title is required'),
  bio: yup.string().max(500, 'Bio cannot exceed 500 characters'),
  email: yup.string().email('Invalid email address').required('Email is required'),
  phone: yup.string(),
  location: yup.string(),
  website: yup.string().url('Invalid website URL'),
  linkedin: yup.string().url('Invalid LinkedIn URL'),
  github: yup.string().url('Invalid GitHub URL'),
  twitter: yup.string().url('Invalid Twitter URL'),
  skills: yup.array().of(yup.string()),
  experience: yup.array(),
  education: yup.array()
});

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      title: '',
      bio: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      linkedin: '',
      github: '',
      twitter: '',
      skills: [],
      experience: [],
      education: []
    }
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // Mock data - replace with API call
      const mockProfile = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        title: 'Senior Frontend Developer',
        bio: 'Passionate frontend developer with 8+ years of experience building scalable web applications.',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        website: 'https://johndoe.dev',
        linkedin: 'https://linkedin.com/in/johndoe',
        github: 'https://github.com/johndoe',
        twitter: 'https://twitter.com/johndoe',
        avatar: 'https://picsum.photos/200/200?random=1',
        skills: ['React', 'TypeScript', 'Node.js', 'CSS', 'JavaScript'],
        experience: [
          {
            id: 1,
            company: 'TechCorp',
            position: 'Senior Frontend Developer',
            startDate: '2021-01',
            endDate: 'Present',
            description: 'Leading frontend development for enterprise applications'
          },
          {
            id: 2,
            company: 'StartupXYZ',
            position: 'Frontend Developer',
            startDate: '2019-06',
            endDate: '2020-12',
            description: 'Built responsive web applications using React and modern JavaScript'
          }
        ],
        education: [
          {
            id: 1,
            school: 'University of Technology',
            degree: 'Bachelor of Science in Computer Science',
            startDate: '2015-09',
            endDate: '2019-05'
          }
        ]
      };
      
      setTimeout(() => {
        setProfileData(mockProfile);
        reset(mockProfile);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      // Mock API call
      setTimeout(() => {
        setProfileData({ ...profileData, ...data });
        setEditing(false);
        setSaving(false);
      }, 1000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaving(false);
    }
  };

  const handleCancel = () => {
    reset(profileData);
    setEditing(false);
  };

  const handleEdit = () => {
    setEditing(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            My Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your professional information
          </Typography>
        </Box>
        {!editing && (
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={handleEdit}
          >
            Edit Profile
          </Button>
        )}
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Profile Overview Card */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box textAlign="center">
                  <Box position="relative" display="inline-block">
                    <Avatar
                      src={profileData?.avatar}
                      sx={{ width: 120, height: 120, mb: 2 }}
                    >
                      {profileData?.firstName?.[0]}{profileData?.lastName?.[0]}
                    </Avatar>
                    {editing && (
                      <IconButton
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          bgcolor: 'background.paper',
                          '&:hover': { bgcolor: 'grey.200' }
                        }}
                      >
                        <PhotoCamera />
                      </IconButton>
                    )}
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    {profileData?.firstName} {profileData?.lastName}
                  </Typography>
                  <Typography variant="body1" color="primary" gutterBottom>
                    {profileData?.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {profileData?.location}
                  </Typography>
                  
                  {/* Social Links */}
                  <Box display="flex" justifyContent="center" gap={1} mt={2}>
                    <IconButton href={profileData?.linkedin} target="_blank">
                      <LinkedIn />
                    </IconButton>
                    <IconButton href={profileData?.github} target="_blank">
                      <GitHub />
                    </IconButton>
                    <IconButton href={profileData?.twitter} target="_blank">
                      <Twitter />
                    </IconButton>
                    <IconButton href={profileData?.website} target="_blank">
                      <Language />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Main Information */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Professional Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="firstName"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="First Name"
                          disabled={!editing}
                          error={!!errors.firstName}
                          helperText={errors.firstName?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="lastName"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Last Name"
                          disabled={!editing}
                          error={!!errors.lastName}
                          helperText={errors.lastName?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="title"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Professional Title"
                          disabled={!editing}
                          error={!!errors.title}
                          helperText={errors.title?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="bio"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          multiline
                          rows={4}
                          label="Bio"
                          disabled={!editing}
                          error={!!errors.bio}
                          helperText={errors.bio?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Contact Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Contact Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="email"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Email Address"
                          type="email"
                          disabled={!editing}
                          error={!!errors.email}
                          helperText={errors.email?.message}
                          InputProps={{
                            startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Phone Number"
                          disabled={!editing}
                          error={!!errors.phone}
                          helperText={errors.phone?.message}
                          InputProps={{
                            startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Controller
                      name="location"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Location"
                          disabled={!editing}
                          error={!!errors.location}
                          helperText={errors.location?.message}
                          InputProps={{
                            startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Social Links */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Social Links
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="website"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Personal Website"
                          disabled={!editing}
                          error={!!errors.website}
                          helperText={errors.website?.message}
                          InputProps={{
                            startAdornment: <Language sx={{ mr: 1, color: 'text.secondary' }} />
                          }}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="linkedin"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="LinkedIn Profile"
                          disabled={!editing}
                          error={!!errors.linkedin}
                          helperText={errors.linkedin?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="github"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="GitHub Profile"
                          disabled={!editing}
                          error={!!errors.github}
                          helperText={errors.github?.message}
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="twitter"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Twitter Profile"
                          disabled={!editing}
                          error={!!errors.twitter}
                          helperText={errors.twitter?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Skills */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Skills
                </Typography>
                <Box mb={2}>
                  {profileData?.skills.map((skill, index) => (
                    <Chip
                      key={index}
                      label={skill}
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
                {editing && (
                  <Typography variant="body2" color="text.secondary">
                    Skills editing will be available in the next update
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Action Buttons */}
          {editing && (
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                  disabled={saving || !isDirty}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </form>
    </Box>
  );
};

export default Profile;