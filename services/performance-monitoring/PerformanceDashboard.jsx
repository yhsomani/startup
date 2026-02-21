import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button
} from '@mui/material';
import {
    Speed,
    Memory,
    Storage,
    Warning,
    CheckCircle,
    Error,
    TrendingUp,
    TrendingDown
} from '@mui/icons-material';

const PerformanceDashboard = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchMetrics = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/v1/performance/dashboard');
            if (!response.ok) throw new Error('Failed to fetch metrics');
            const data = await response.json();
            setMetrics(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy': return 'success';
            case 'degraded': return 'warning';
            case 'unhealthy': return 'error';
            default: return 'default';
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'critical': return <Error color="error" />;
            case 'warning': return <Warning color="warning" />;
            case 'info': return <Speed color="info" />;
            default: return <Speed />;
        }
    };

    if (loading && !metrics) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ m: 2 }}>
                Error loading performance metrics: {error}
                <Button onClick={fetchMetrics} sx={{ ml: 2 }}>Retry</Button>
            </Alert>
        );
    }

    if (!metrics) {
        return (
            <Alert severity="info" sx={{ m: 2 }}>
                No performance metrics available
            </Alert>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Performance Monitoring Dashboard
            </Typography>

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        Avg Response Time
                                    </Typography>
                                    <Typography variant="h4">
                                        {metrics.performance?.avgResponseTime?.toFixed(0) || 0}ms
                                    </Typography>
                                </Box>
                                <Speed color="primary" sx={{ fontSize: 40 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        Error Rate
                                    </Typography>
                                    <Typography variant="h4">
                                        {metrics.performance?.errorRate?.toFixed(1) || 0}%
                                    </Typography>
                                </Box>
                                <Error
                                    color={metrics.performance?.errorRate > 2 ? "error" : "success"}
                                    sx={{ fontSize: 40 }}
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        System Uptime
                                    </Typography>
                                    <Typography variant="h4">
                                        {metrics.performance?.uptime?.toFixed(1) || 0}%
                                    </Typography>
                                </Box>
                                <CheckCircle color="success" sx={{ fontSize: 40 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        Active Alerts
                                    </Typography>
                                    <Typography variant="h4">
                                        {metrics.alerts?.length || 0}
                                    </Typography>
                                </Box>
                                <Warning
                                    color={metrics.alerts?.length > 0 ? "warning" : "success"}
                                    sx={{ fontSize: 40 }}
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabs */}
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
                <Tab label="Services" />
                <Tab label="Alerts" />
                <Tab label="System" />
            </Tabs>

            {/* Services Tab */}
            {activeTab === 0 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Service Health Status</Typography>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Service</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Response Time</TableCell>
                                        <TableCell>Uptime</TableCell>
                                        <TableCell>Last Check</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {metrics.services?.map((service) => (
                                        <TableRow key={service.name}>
                                            <TableCell>
                                                <Typography fontWeight="medium">{service.name}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={service.status}
                                                    color={getStatusColor(service.status)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center">
                                                    <Typography>{service.responseTime}ms</Typography>
                                                    {service.responseTime > 1000 ? (
                                                        <TrendingUp color="error" sx={{ ml: 1 }} />
                                                    ) : service.responseTime < 100 ? (
                                                        <TrendingDown color="success" sx={{ ml: 1 }} />
                                                    ) : null}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography>{service.uptime}%</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="textSecondary">
                                                    {new Date(service.lastCheck).toLocaleTimeString()}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* Alerts Tab */}
            {activeTab === 1 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Recent Alerts</Typography>
                        {metrics.alerts?.length === 0 ? (
                            <Alert severity="success">No active alerts</Alert>
                        ) : (
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Type</TableCell>
                                            <TableCell>Severity</TableCell>
                                            <TableCell>Description</TableCell>
                                            <TableCell>Time</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {metrics.alerts?.slice(0, 20).map((alert) => (
                                            <TableRow key={alert.id}>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center">
                                                        {getSeverityIcon(alert.severity)}
                                                        <Typography sx={{ ml: 1 }}>{alert.type}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={alert.severity}
                                                        color={getStatusColor(alert.severity)}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {JSON.stringify(alert.data)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="textSecondary">
                                                        {new Date(alert.timestamp).toLocaleString()}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* System Tab */}
            {activeTab === 2 && metrics.system && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Memory Usage</Typography>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        Heap Used: {(metrics.system.memory.heapUsed / 1024 / 1024).toFixed(2)} MB
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Heap Total: {(metrics.system.memory.heapTotal / 1024 / 1024).toFixed(2)} MB
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        RSS: {(metrics.system.memory.rss / 1024 / 1024).toFixed(2)} MB
                                    </Typography>
                                </Box>
                                <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1 }}>
                                    <Box
                                        sx={{
                                            width: `${(metrics.system.memory.heapUsed / metrics.system.memory.heapTotal) * 100}%`,
                                            height: 20,
                                            bgcolor: 'primary.main',
                                            borderRadius: 1
                                        }}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>CPU Usage</Typography>
                                <Typography variant="body2" color="textSecondary">
                                    System CPU Time: {metrics.system.cpu.system} μs
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    User CPU Time: {metrics.system.cpu.user} μs
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Process Uptime: {Math.floor(metrics.system.uptime / 60)} minutes
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Refresh Button */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                    variant="outlined"
                    onClick={fetchMetrics}
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={24} /> : 'Refresh Metrics'}
                </Button>
            </Box>
        </Box>
    );
};

export default PerformanceDashboard;