import { useState, useEffect } from 'react';
import { Line, Bar, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, Typography, Grid, Box, Chip, LinearProgress } from '@mui/material';
import { TrendingUp, TrendingDown, Users, Code, MemoryCpu, Speed, AccessTime, ErrorOutline } from '@mui/icons-material';

const PerformanceDashboard = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [data, setData] = useState({
    services: [],
    requests: [],
    errors: [],
    latency: [],
    throughput: [],
    resources: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
    const interval = setInterval(fetchPerformanceData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      // Mock data - in production, this would fetch from your monitoring service
      const response = await fetch(`/api/monitoring/metrics?range=${timeRange}`);
      const metrics = await response.json();
      
      setData(metrics);
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const ServiceHealthCard = ({ service, status, uptime, lastCheck }) => (
    <Card sx={{ height: 140 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" component="div">
            {service}
          </Typography>
          <Chip 
            label={status}
            color={status === 'Healthy' ? 'success' : 'error'}
            size="small"
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Uptime: {uptime}%
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Last check: {new Date(lastCheck).toLocaleTimeString()}
        </Typography>
      </CardContent>
    </Card>
  );

  const RequestVolumeChart = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Request Volume
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <Line data={data.requests}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value, name) => [
                `Time: ${new Date(value).toLocaleTimeString()}`,
                `Requests: ${value}`
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="requests" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={{ fill: '#8884d8' }}
            />
          </Line>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const ErrorRateChart = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Error Rate (%)
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <Line data={data.errors}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time"
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="errors" 
              stroke="#dc3545" 
              strokeWidth={2}
            />
          </Line>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const LatencyChart = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Response Time (ms)
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <Bar data={data.latency}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="service"
              tick={{ angle: -45 }}
            />
            <YAxis />
            <Tooltip />
            <Bar dataKey="avgLatency" fill="#82ca9d" />
          </Bar>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const ResourceUsageChart = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Resource Usage
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <Bar data={data.resources}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="resource" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="usage" fill="#8884d8" />
          </Bar>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const ServiceBreakdown = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Service Breakdown
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <Pie data={data.services}>
            <Pie
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label
            />
            <Tooltip />
          </Pie>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const MetricCard = ({ title, value, unit, trend, icon: Icon }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <Icon sx={{ mr: 1 }} color="action" />
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center">
            {trend === 'up' ? (
              <TrendingUp color="success" />
            ) : (
              <TrendingDown color="error" />
            )}
            <Typography variant="body2" color="text.secondary">
              {unit}
            </Typography>
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <Typography>Loading performance data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Performance Dashboard
      </Typography>
      
      {/* Time Range Selector */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Chip 
          label="1h"
          onClick={() => setTimeRange('1h')}
          color={timeRange === '1h' ? 'primary' : 'default'}
          clickable
        />
        <Chip 
          label="24h"
          onClick={() => setTimeRange('24h')}
          color={timeRange === '24h' ? 'primary' : 'default'}
          clickable
        />
        <Chip 
          label="7d"
          onClick={() => setTimeRange('7d')}
          color={timeRange === '7d' ? 'primary' : 'default'}
          clickable
        />
        <Chip 
          label="30d"
          onClick={() => setTimeRange('30d')}
          color={timeRange === '30d' ? 'primary' : 'default'}
          clickable
        />
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Requests"
            value={data.totalRequests?.toLocaleString() || '0'}
            unit="/min"
            trend={data.requestsTrend}
            icon={Speed}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg Response Time"
            value={data.avgResponseTime || '0'}
            unit="ms"
            trend={data.latencyTrend}
            icon={AccessTime}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Error Rate"
            value={data.errorRate || '0'}
            unit="%"
            trend={data.errorTrend}
            icon={ErrorOutline}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Active Users"
            value={data.activeUsers?.toLocaleString() || '0'}
            unit=""
            trend={data.userTrend}
            icon={Users}
          />
        </Grid>
      </Grid>

      {/* Service Health */}
      <Typography variant="h6" gutterBottom>
        Service Health
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {data.services?.map((service, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <ServiceHealthCard {...service} />
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <RequestVolumeChart />
        </Grid>
        <Grid item xs={12} md={6}>
          <ErrorRateChart />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <LatencyChart />
        </Grid>
        <Grid item xs={12} md={6}>
          <ResourceUsageChart />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <ServiceBreakdown />
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Endpoints
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {data.topEndpoints?.map((endpoint, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                    <Typography variant="body2">
                      {endpoint.method} {endpoint.path}
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" color="text.secondary">
                        {endpoint.requests} req
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ({endpoint.avgTime}ms)
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceDashboard;