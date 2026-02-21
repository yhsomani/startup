/**
 * Dashboard Page Component
 * Main user dashboard with overview and analytics
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  Button,
  CircularProgress,
  Avatar,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar
} from '@mui/material';
import {
  Work,
  Business,
  TrendingUp,
  People,
  Notifications,
  ArrowForward,
  Add
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
// Import shared modules
const logger = require('../../shared/logger/index').default;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {
      totalApplications: 0,
      totalViews: 0,
      interviewCount: 0,
      networkConnections: 0
    },
    recentApplications: [],
    recentViews: [],
    weeklyActivity: [],
    profileCompletion: 0
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data in parallel
      const [
        applicationsResponse,
        viewsResponse,
        interviewsResponse,
        connectionsResponse
      ] = await Promise.all([
        api.getApplications(),
        api.getProfileViews(),
        api.getInterviews(),
        api.getNetworkConnections()
      ]);
      
      // Update state with fetched data
      setData(prevData => ({
        ...prevData,
        stats: {
          totalApplications: applicationsResponse.data?.total || 0,
          totalViews: viewsResponse.data?.total || 0,
          interviewCount: interviewsResponse.data?.total || 0,
          networkConnections: connectionsResponse.data?.total || 0
        },
        recentApplications: applicationsResponse.data?.recent || [],
        recentViews: viewsResponse.data?.recent || [],
        recentInterviews: interviewsResponse.data?.recent || [],
        networkGrowth: connectionsResponse.data?.growth || []
      }));
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Set empty data on error
      setData({
        stats: {
          totalApplications: 0,
          totalViews: 0,
          interviewCount: 0,
          networkConnections: 0
        },
        recentApplications: [],
        recentViews: [],
        weeklyActivity: [],
        profileCompletion: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Applied': return 'default';
      case 'Under Review': return 'primary';
      case 'Interview Scheduled': return 'secondary';
      case 'Offer': return 'success';
      case 'Rejected': return 'error';
      default: return 'default';
    }
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
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's your career overview and recent activity
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Work />
                </Avatar>
                <Box>
                  <Typography variant="h6">{data.stats.totalApplications}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Applications
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography variant="h6">{data.stats.totalViews}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Profile Views
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <Business />
                </Avatar>
                <Box>
                  <Typography variant="h6">{data.stats.interviewCount}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Interviews
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h6">{data.stats.networkConnections}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Network
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Profile Completion */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Completion
              </Typography>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {data.profileCompletion}% Complete
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={data.profileCompletion} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Button variant="outlined" size="small" fullWidth>
                Complete Profile
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button variant="contained" startIcon={<Add />} fullWidth>
                    New Application
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button variant="outlined" startIcon={<People />} fullWidth>
                    Network
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly Activity Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Weekly Activity
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="applications" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Applications"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Profile Views"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Applications */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Applications
              </Typography>
              <List>
                {data.recentApplications.map((app) => (
                  <ListItem key={app.id} divider>
                    <ListItemText
                      primary={app.position}
                      secondary={
                        <>
                          <Typography variant="body2" color="text.secondary">
                            {app.company}
                          </Typography>
                          <Box display="flex" alignItems="center" mt={1}>
                            <Chip 
                              label={app.status} 
                              size="small" 
                              color={getStatusColor(app.status)}
                            />
                            <Typography variant="caption" color="text.secondary" ml={1}>
                              {app.appliedAt}
                            </Typography>
                          </Box>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
              <Button variant="text" endIcon={<ArrowForward />} fullWidth>
                View All Applications
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;