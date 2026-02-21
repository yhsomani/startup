/**
 * TalentSphere CORS Middleware
 * Centralized CORS configuration for all backend services
 */

const cors = require('cors');
require('dotenv').config({ path: '.env.cors' });

// Parse CORS origins from environment
const parseOrigins = (origins) => {
  if (!origins) return ['http://localhost:3000'];
  return origins.split(',').map(origin => origin.trim());
};

// Parse CORS headers from environment
const parseHeaders = (headers) => {
  if (!headers) return ['Content-Type', 'Authorization'];
  return headers.split(',').map(header => header.trim());
};

// Parse CORS methods from environment
const parseMethods = (methods) => {
  if (!methods) return ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
  return methods.split(',').map(method => method.trim());
};

// CORS configuration
const corsConfig = {
  origin: (origin, callback) => {
    const allowedOrigins = parseOrigins(process.env.CORS_ORIGIN);
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  methods: parseMethods(process.env.CORS_METHODS),
  allowedHeaders: parseHeaders(process.env.CORS_HEADERS),
  credentials: process.env.CORS_CREDENTIALS === 'true',
  maxAge: parseInt(process.env.CORS_MAX_AGE) || 86400,
  optionsSuccessStatus: 200,
  preflightContinue: false
};

// Export configured CORS middleware
module.exports = cors(corsConfig);

// Also export configuration for WebSocket services
module.exports.corsConfig = corsConfig;