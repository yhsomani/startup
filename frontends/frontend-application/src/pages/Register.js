/**
 * Register Page Component
 * User registration interface
 */

import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
  Grid,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { register, selectAuthLoading, selectAuthError } from '../store/slices/authSlice';

// Form validation schema
const registerSchema = yup.object().shape({
  firstName: yup.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .required('First name is required'),
  lastName: yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .required('Last name is required'),
  email: yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Password confirmation is required'),
  agreeToTerms: yup.boolean()
    .oneOf([true], 'You must agree to the terms of service')
    .required('Terms agreement is required'),
  newsletterOptIn: yup.boolean()
});

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
      newsletterOptIn: false
    }
  });

  const password = watch('password');

  const onSubmit = useCallback(async (data) => {
    try {
      const { confirmPassword, ...registerData } = data;
      await dispatch(register(registerData)).unwrap();
      navigate('/dashboard');
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: error.message || 'Registration failed'
      });
    }
  }, [dispatch, navigate, setError]);

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: '100%',
            maxWidth: 600,
            p: 4
          }}
        >
          <Box textAlign="center" mb={4}>
            <Typography variant="h4" component="h1" gutterBottom>
              Join TalentSphere
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your account to start connecting with top talent
            </Typography>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
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
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                      disabled={loading}
                      margin="normal"
                      autoComplete="given-name"
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
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                      disabled={loading}
                      margin="normal"
                      autoComplete="family-name"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email Address"
                      type="email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      disabled={loading}
                      margin="normal"
                      autoComplete="email"
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      disabled={loading}
                      margin="normal"
                      autoComplete="new-password"
                      InputProps={{
                        endAdornment: (
                          <Button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            size="small"
                            sx={{ minWidth: 'auto', p: 1 }}
                          >
                            {showPassword ? 'Hide' : 'Show'}
                          </Button>
                        )
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword?.message}
                      disabled={loading}
                      margin="normal"
                      autoComplete="new-password"
                      InputProps={{
                        endAdornment: (
                          <Button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            size="small"
                            sx={{ minWidth: 'auto', p: 1 }}
                          >
                            {showConfirmPassword ? 'Hide' : 'Show'}
                          </Button>
                        )
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="agreeToTerms"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          {...field}
                          checked={field.value}
                          disabled={loading}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          I agree to the{' '}
                          <Link to="/terms" target="_blank" style={{ textDecoration: 'none' }}>
                            Terms of Service
                          </Link>
                          {' '}and{' '}
                          <Link to="/privacy" target="_blank" style={{ textDecoration: 'none' }}>
                            Privacy Policy
                          </Link>
                        </Typography>
                      }
                    />
                  )}
                />
                {errors.agreeToTerms && (
                  <Typography variant="caption" color="error" sx={{ ml: 4, mt: 1, display: 'block' }}>
                    {errors.agreeToTerms.message}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="newsletterOptIn"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          {...field}
                          checked={field.value}
                          disabled={loading}
                        />
                      }
                      label="Send me updates about new features and opportunities"
                    />
                  )}
                />
              </Grid>
            </Grid>

            {error && (
              <Alert severity="error" sx={{ mb: 3, mt: 2 }}>
                {error}
              </Alert>
            )}

            {errors.root && (
              <Alert severity="error" sx={{ mb: 3, mt: 2 }}>
                {errors.root.message}
              </Alert>
            )}

            <Box mt={3}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mb: 2 }}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  'Create Account'
                )}
              </Button>
            </Box>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  Sign in
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;