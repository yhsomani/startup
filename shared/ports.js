/**
 * Port Configuration Module
 * Centralized port management for TalentSphere services
 * Automatically detects environment and returns appropriate ports
 */

require("dotenv").config();

const isDevelopment = process.env.NODE_ENV !== "production";
const isTest = process.env.NODE_ENV === "test";

// Production Ports - Unified scheme aligned with SSOT (February 2026)
const PRODUCTION_PORTS = {
    GATEWAY: 8000,
    AUTH_SERVICE: 3001,
    USER_AUTH_SERVICE: 3001,
    USER_SERVICE: 3002,
    JOB_LISTING_SERVICE: 3010,
    JOB_SERVICE: 3010,
    NETWORK_SERVICE: 3010,
    SEARCH_SERVICE: 3007,
    APPLICATION_SERVICE: 3008,
    USER_PROFILE_SERVICE: 3009,
    ANALYTICS_SERVICE: 3011,
    FILE_SERVICE: 3013,
    VIDEO_SERVICE: 3014,
    NOTIFICATION_SERVICE: 4005,
    COMPANY_SERVICE: 4006,
    EMAIL_SERVICE: 4007,
    FLASK: 5000,
    ASSISTANT: 5005,
    AI_ASSISTANT: 5005,
    RECRUITMENT: 5006,
    RECRUITMENT_SERVICE: 5006,
    GAMIFICATION: 5007,
    GAMIFICATION_SERVICE: 5007,
    CHALLENGE_SERVICE: 5000,
    PAYMENTS_SERVICE: 5062,
    DOTNET: 5062,
    SPRING: 8080,
    LMS_SERVICE: 8080,
    NODE: 3030,
    COLLABORATION: 1234,
    COLLABORATION_SERVICE: 1234,
    FRONTEND_SHELL: 3000,
    FRONTEND_LMS: 3001,
    FRONTEND_CHALLENGE: 3002,
    PROMETHEUS: 9090,
    GRAFANA: 3020,
    DASHBOARD_SERVICE: 4012,
};

// Development Ports - aligned with SSOT unified scheme
const DEVELOPMENT_PORTS = {
    GATEWAY: 8000,
    AUTH_SERVICE: 3001,
    USER_AUTH_SERVICE: 3001,
    USER_SERVICE: 3002,
    JOB_LISTING_SERVICE: 3010,
    JOB_SERVICE: 3010,
    NETWORK_SERVICE: 3010,
    SEARCH_SERVICE: 3007,
    APPLICATION_SERVICE: 3008,
    USER_PROFILE_SERVICE: 3009,
    ANALYTICS_SERVICE: 3011,
    FILE_SERVICE: 3013,
    VIDEO_SERVICE: 3014,
    NOTIFICATION_SERVICE: 4005,
    COMPANY_SERVICE: 4006,
    EMAIL_SERVICE: 4007,
    FLASK: 5000,
    ASSISTANT: 5005,
    AI_ASSISTANT: 5005,
    RECRUITMENT: 5006,
    RECRUITMENT_SERVICE: 5006,
    GAMIFICATION: 5007,
    GAMIFICATION_SERVICE: 5007,
    CHALLENGE_SERVICE: 5000,
    PAYMENTS_SERVICE: 5062,
    DOTNET: 5062,
    SPRING: 8080,
    LMS_SERVICE: 8080,
    NODE: 3030,
    COLLABORATION: 1234,
    COLLABORATION_SERVICE: 1234,
    FRONTEND_SHELL: 3100,
    FRONTEND_LMS: 3101,
    FRONTEND_CHALLENGE: 3102,
    PROMETHEUS: 9090,
    GRAFANA: 3020,
    DASHBOARD_SERVICE: 4012,
};

// Test Ports (for automated testing) - aligned with SSOT unified scheme
const TEST_PORTS = {
    GATEWAY: 9000,
    AUTH_SERVICE: 9001,
    USER_AUTH_SERVICE: 9001,
    USER_SERVICE: 9002,
    JOB_LISTING_SERVICE: 9010,
    JOB_SERVICE: 9010,
    NETWORK_SERVICE: 9010,
    SEARCH_SERVICE: 9007,
    APPLICATION_SERVICE: 9008,
    USER_PROFILE_SERVICE: 9009,
    ANALYTICS_SERVICE: 9011,
    FILE_SERVICE: 9013,
    VIDEO_SERVICE: 9014,
    NOTIFICATION_SERVICE: 9005,
    COMPANY_SERVICE: 9006,
    EMAIL_SERVICE: 9007,
    FLASK: 9500,
    ASSISTANT: 9505,
    AI_ASSISTANT: 9505,
    RECRUITMENT: 9506,
    RECRUITMENT_SERVICE: 9506,
    GAMIFICATION: 9507,
    GAMIFICATION_SERVICE: 9507,
    CHALLENGE_SERVICE: 9500,
    PAYMENTS_SERVICE: 9562,
    DOTNET: 9562,
    SPRING: 9800,
    LMS_SERVICE: 9800,
    NODE: 9300,
    COLLABORATION: 9123,
    COLLABORATION_SERVICE: 9123,
    FRONTEND_SHELL: 9100,
    FRONTEND_LMS: 9101,
    FRONTEND_CHALLENGE: 9102,
    PROMETHEUS: 9900,
    GRAFANA: 9110,
    DASHBOARD_SERVICE: 9012,
};

// Get base port configuration for current environment
const getBasePorts = () => {
    if (isTest) {
        return TEST_PORTS;
    }
    if (isDevelopment) {
        return DEVELOPMENT_PORTS;
    }
    return PRODUCTION_PORTS;
};

// Get port for specific service
const getServicePort = serviceName => {
    const normalizedName = serviceName.toUpperCase().replace(/-/g, "_");

    // Check environment variables first (override)
    const envPortName = `${normalizedName}_PORT${isDevelopment ? "_DEV" : ""}`;
    const envPort = process.env[envPortName];
    if (envPort) {
        const port = parseInt(envPort, 10);
        if (!isNaN(port) && port > 0 && port < 65536) {
            return port;
        }
        console.warn(`Invalid port in ${envPortName}: ${envPort}, using default`);
    }

    // Fallback to configuration
    const basePorts = getBasePorts();
    const port = basePorts[normalizedName];
    if (!port) {
        console.warn(
            `Unknown service: ${serviceName} (normalized: ${normalizedName}) - using default port`
        );
        return 3000; // Return a default port instead of throwing
    }
    return port;
};

// Get service host
const getServiceHost = serviceName => {
    const envHost = process.env[`${serviceName.toUpperCase()}_SERVICE_HOST`];
    if (envHost) {
        return envHost;
    }

    // In development, use localhost
    if (isDevelopment) {
        return "localhost";
    }

    // In production, use service names
    return `${serviceName}-service`;
};

// Get full service URL
const getServiceUrl = (serviceName, protocol = "http") => {
    try {
        const host = getServiceHost(serviceName);
        const port = getServicePort(serviceName);

        // Don't include port for standard ports
        if ((protocol === "http" && port === 80) || (protocol === "https" && port === 443)) {
            return `${protocol}://${host}`;
        }

        return `${protocol}://${host}:${port}`;
    } catch (error) {
        console.error(`Failed to get service URL for ${serviceName}:`, error.message);
        // Return a placeholder URL that will result in a 502 when called
        return `${protocol}://service-unavailable:0`;
    }
};

// Get all service ports
const getAllServicePorts = () => {
    const basePorts = getBasePorts();
    const result = {};

    Object.keys(basePorts).forEach(serviceName => {
        result[serviceName] = getServicePort(serviceName);
    });

    return result;
};

// Validate that all configured ports are available
const validatePorts = async (ports = []) => {
    const usedPorts = new Set();
    const conflicts = [];

    for (const portConfig of ports) {
        const { name, port } = portConfig;

        if (usedPorts.has(port)) {
            conflicts.push({
                port,
                services: [name, ...Array.from(usedPorts).filter(p => getServicePort(p) === port)],
            });
        } else {
            usedPorts.add(port);
        }
    }

    if (conflicts.length > 0) {
        const conflictMessages = conflicts.map(
            c => `Port ${c.port} conflict between: ${c.services.join(", ")}`
        );
        throw new Error(`Port conflicts detected:\n${conflictMessages.join("\n")}`);
    }

    return true;
};

// Export configuration functions
module.exports = {
    getServicePort,
    getServiceHost,
    getServiceUrl,
    getAllServicePorts,
    validatePorts,

    // Direct access to port sets
    PRODUCTION_PORTS,
    DEVELOPMENT_PORTS,
    TEST_PORTS,

    // Environment helpers
    isDevelopment,
    isTest,
    isProduction: !isDevelopment && !isTest,
};
