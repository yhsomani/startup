import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

interface ServiceMetrics {
    service: string;
    version: string;
    health: {
        status: string;
        uptime: number;
    };
    performance: {
        uptime: number;
        requestCount: number;
        errorCount: number;
        errorRate: string;
        memory: {
            rss: string;
            heapUsed: string;
            heapTotal: string;
        };
    };
    cache?: {
        hits: number;
        misses: number;
        keys: number;
        hitRate: string;
    };
    timestamp: string;
}

interface ServiceConfig {
    name: string;
    url: string;
    port: number;
}

const SERVICES: ServiceConfig[] = [
    { name: 'Job Listing', url: '/api', port: 3008 },
    { name: 'User Profile', url: '/api', port: 3009 },
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const formatUptime = (ms: number): string => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const colorMap: Record<string, string> = {
        healthy: '#10b981',
        degraded: '#f59e0b',
        unhealthy: '#ef4444',
        unknown: '#6b7280',
    };
    const color = colorMap[status] || colorMap.unknown;
    return (
        <span style={{
            backgroundColor: color + '22',
            color,
            border: `1px solid ${color}55`,
            borderRadius: '9999px',
            padding: '2px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'capitalize',
        }}>
            {status}
        </span>
    );
};

const MetricCard: React.FC<{ label: string; value: string; sub?: string; color?: string }> = ({
    label, value, sub, color = '#6366f1'
}) => (
    <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '16px 20px',
        minWidth: 140,
        flex: 1,
    }}>
        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
        {sub && <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: 2 }}>{sub}</div>}
    </div>
);

const ServiceCard: React.FC<{ config: ServiceConfig; metrics: ServiceMetrics | null; error: string | null }> = ({
    config, metrics, error
}) => (
    <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
    }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{config.name} Service</h3>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>:{config.port}</span>
            </div>
            {metrics ? (
                <StatusBadge status={metrics.health?.status || 'unknown'} />
            ) : (
                <StatusBadge status={error ? 'unhealthy' : 'unknown'} />
            )}
        </div>

        {error && (
            <div style={{
                background: '#ef444415',
                border: '1px solid #ef444440',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#fca5a5',
                fontSize: '0.8rem',
            }}>
                ⚠ {error}
            </div>
        )}

        {metrics && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <MetricCard
                    label="Uptime"
                    value={formatUptime(metrics.performance.uptime)}
                    color="#34d399"
                />
                <MetricCard
                    label="Requests"
                    value={metrics.performance.requestCount.toLocaleString()}
                    sub={`${metrics.performance.errorCount} errors`}
                    color="#60a5fa"
                />
                <MetricCard
                    label="Error Rate"
                    value={`${metrics.performance.errorRate}%`}
                    color={parseFloat(metrics.performance.errorRate) > 5 ? '#f87171' : '#34d399'}
                />
                <MetricCard
                    label="Memory"
                    value={metrics.performance.memory.heapUsed}
                    sub={`of ${metrics.performance.memory.heapTotal}`}
                    color="#a78bfa"
                />
                {metrics.cache && (
                    <MetricCard
                        label="Cache Hit Rate"
                        value={metrics.cache.hitRate}
                        sub={`${metrics.cache.keys} keys`}
                        color="#fb923c"
                    />
                )}
            </div>
        )}
    </div>
);

const PerformanceDashboard: React.FC = () => {
    const [metricsData, setMetricsData] = useState<Record<string, ServiceMetrics | null>>({});
    const [errors, setErrors] = useState<Record<string, string | null>>({});
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const fetchMetrics = useCallback(async () => {
        const results: Record<string, ServiceMetrics | null> = {};
        const errs: Record<string, string | null> = {};

        await Promise.allSettled(
            SERVICES.map(async (svc) => {
                try {
                    const resp = await axios.get(`${API_BASE}:${svc.port}/metrics`, { timeout: 5000 });
                    results[svc.name] = resp.data;
                    errs[svc.name] = null;
                } catch (e: unknown) {
                    results[svc.name] = null;
                    errs[svc.name] = e instanceof Error ? e.message : 'Failed to fetch metrics';
                }
            })
        );

        setMetricsData(results);
        setErrors(errs);
        setLastUpdated(new Date());
    }, []);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchMetrics, 15000); // refresh every 15s
        return () => clearInterval(interval);
    }, [autoRefresh, fetchMetrics]);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)',
            color: '#e5e7eb',
            fontFamily: "'Inter', sans-serif",
            padding: '32px',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                        ⚡ Performance Dashboard
                    </h1>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                        Real-time service metrics monitoring
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {lastUpdated && (
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            Updated {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        onClick={() => setAutoRefresh(v => !v)}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 8,
                            background: autoRefresh ? '#6366f122' : 'transparent',
                            color: autoRefresh ? '#818cf8' : '#9ca3af',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                        }}
                    >
                        {autoRefresh ? '⏸ Auto-refresh On' : '▶ Auto-refresh Off'}
                    </button>
                    <button
                        onClick={fetchMetrics}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 8,
                            background: 'rgba(255,255,255,0.05)',
                            color: '#e5e7eb',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                        }}
                    >
                        ↻ Refresh
                    </button>
                </div>
            </div>

            {/* Overall summary */}
            <div style={{
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap',
                marginBottom: 32,
                padding: 20,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
            }}>
                {(() => {
                    const allMetrics = Object.values(metricsData).filter(Boolean) as ServiceMetrics[];
                    const totalRequests = allMetrics.reduce((s, m) => s + m.performance.requestCount, 0);
                    const totalErrors = allMetrics.reduce((s, m) => s + m.performance.errorCount, 0);
                    const healthyCount = allMetrics.filter(m => m.health?.status === 'healthy').length;
                    return (
                        <>
                            <MetricCard label="Services Healthy" value={`${healthyCount}/${SERVICES.length}`} color="#34d399" />
                            <MetricCard label="Total Requests" value={totalRequests.toLocaleString()} color="#60a5fa" />
                            <MetricCard label="Total Errors" value={totalErrors.toLocaleString()} color={totalErrors > 0 ? '#f87171' : '#34d399'} />
                        </>
                    );
                })()}
            </div>

            {/* Per-service cards */}
            {SERVICES.map(svc => (
                <ServiceCard
                    key={svc.name}
                    config={svc}
                    metrics={metricsData[svc.name] ?? null}
                    error={errors[svc.name] ?? null}
                />
            ))}

            <p style={{ textAlign: 'center', color: '#374151', fontSize: '0.75rem', marginTop: 32 }}>
                TalentSphere Platform • Performance Monitoring
            </p>
        </div>
    );
};

export default PerformanceDashboard;
