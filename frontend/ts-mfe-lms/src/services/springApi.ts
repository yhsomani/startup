import api from './api';

// Re-export the main API client to ensure all requests go through the Gateway (port 8000).
// This replaces the direct connection to Spring Boot (port 8080).
const springApi = api;

export default springApi;
