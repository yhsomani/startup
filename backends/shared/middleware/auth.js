/**
 * TalentSphere Universal JWT Middleware
 * Provides JWT authentication for all backend services
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * JWT Authentication Middleware for Express routes
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
      error: 'MISSING_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = {
      userId: decoded.userId || decoded.sub,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
      companyId: decoded.companyId,
      iat: decoded.iat,
      exp: decoded.exp
    };
    next();
  } catch (error) {
    let errorMessage = 'Invalid token';
    let errorCode = 'INVALID_TOKEN';

    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token expired';
      errorCode = 'TOKEN_EXPIRED';
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Malformed token';
      errorCode = 'MALFORMED_TOKEN';
    }

    return res.status(403).json({
      success: false,
      message: errorMessage,
      error: errorCode,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Role-based Authorization Middleware
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
    }

    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        error: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole: userRole
      });
    }

    next();
  };
};

/**
 * Permission-based Authorization Middleware
 */
const requirePermission = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.every(permission => 
      userPermissions.includes(permission) || userPermissions.includes('*')
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required permissions: ${requiredPermissions.join(', ')}`,
        error: 'INSUFFICIENT_PERMISSIONS',
        requiredPermissions: requiredPermissions,
        userPermissions: userPermissions
      });
    }

    next();
  };
};

/**
 * Company Access Middleware - Users can only access their own company data
 */
const requireCompanyAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'NOT_AUTHENTICATED'
    });
  }

  // Super admins can access all companies
  if (req.user.role === 'super_admin') {
    return next();
  }

  const requestedCompanyId = req.params.companyId || req.body.companyId || req.query.companyId;
  const userCompanyId = req.user.companyId;

  if (!userCompanyId) {
    return res.status(403).json({
      success: false,
      message: 'User is not associated with any company',
      error: 'NO_COMPANY_ASSOCIATION'
    });
  }

  if (requestedCompanyId && requestedCompanyId !== userCompanyId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Cannot access other company data',
      error: 'CROSS_COMPANY_ACCESS_DENIED'
    });
  }

  next();
};

/**
 * Resource Ownership Middleware - Users can only access their own resources
 */
const requireOwnership = (resourceIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'NOT_AUTHENTICATED'
      });
    }

    // Admins can access all resources
    if (['admin', 'super_admin'].includes(req.user.role)) {
      return next();
    }

    const requestedUserId = req.params[resourceIdField] || 
                           req.body[resourceIdField] || 
                           req.query[resourceIdField];
    
    if (requestedUserId && requestedUserId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Cannot access other user resources',
        error: 'RESOURCE_ACCESS_DENIED'
      });
    }

    next();
  };
};

/**
 * Optional Authentication Middleware - Doesn't fail if no token provided
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = {
      userId: decoded.userId || decoded.sub,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
      companyId: decoded.companyId,
      iat: decoded.iat,
      exp: decoded.exp
    };
  } catch (error) {
    req.user = null;
  }

  next();
};

/**
 * Socket.IO Authentication Middleware
 */
const socketAuth = (socket, next) => {
  const token = socket.handshake.auth.token || 
                socket.handshake.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    socket.user = {
      userId: decoded.userId || decoded.sub,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
      companyId: decoded.companyId
    };
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
};

/**
 * Middleware factory for common role combinations
 */
const auth = {
  // Basic authentication
  required: authenticateToken,
  optional: optionalAuth,
  
  // Role-based access
  requireAdmin: requireRole(['admin', 'super_admin']),
  requireSuperAdmin: requireRole(['super_admin']),
  requireHr: requireRole(['hr', 'admin', 'super_admin']),
  requireManager: requireRole(['manager', 'hr', 'admin', 'super_admin']),
  requireEmployee: requireRole(['employee', 'manager', 'hr', 'admin', 'super_admin']),
  
  // Permission-based access
  requireReadPermission: requirePermission(['read']),
  requireWritePermission: requirePermission(['read', 'write']),
  requireAdminPermission: requirePermission(['read', 'write', 'admin']),
  
  // Resource-based access
  requireCompanyAccess,
  requireOwnership,
  
  // Socket authentication
  socket: socketAuth,
  
  // Custom middleware creators
  requireRole,
  requirePermission,
  requireOwnership: requireOwnership
};

module.exports = auth;