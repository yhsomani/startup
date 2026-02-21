/**
 * JWT Refresh Token Service
 * Secure token management with refresh tokens and rotation
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDatabaseManager } = require('../../shared/database-connection');
const { getSecret } = require('../../shared/security');
const { AppError, AuthenticationError } = require('./error-handler');

class RefreshTokenService {
  constructor() {
    this.database = getDatabaseManager();
    this.jwtSecret = getSecret('JWT_SECRET') || process.env.JWT_SECRET;
    this.refreshTokenSecret = getSecret('REFRESH_TOKEN_SECRET') || process.env.REFRESH_TOKEN_SECRET;
    this.accessTokenExpiry = '15m'; // 15 minutes
    this.refreshTokenExpiry = '7d'; // 7 days
    this.issuer = 'talentsphere-api';
  }

  // Generate access and refresh tokens
  async generateTokenPair(userId, additionalClaims = {}) {
    const accessToken = jwt.sign(
      {
        userId,
        type: 'access',
        jti: uuidv4(), // JWT ID
        ...additionalClaims,
        iat: Math.floor(Date.now() / 1000),
        iss: this.issuer
      },
      this.jwtSecret,
      { expiresIn: this.accessTokenExpiry }
    );

    const refreshToken = jwt.sign(
      {
        userId,
        type: 'refresh',
        jti: uuidv4(), // JWT ID
        tokenId: uuidv4(), // Unique token identifier
        iat: Math.floor(Date.now() / 1000),
        iss: this.issuer
      },
      this.refreshTokenSecret,
      { expiresIn: this.refreshTokenExpiry }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenExpiry,
      tokenType: 'Bearer'
    };
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.refreshTokenSecret);
      
      if (decoded.type !== 'refresh') {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Check if refresh token is revoked
      const isRevoked = await this.isRefreshTokenRevoked(decoded.tokenId);
      if (isRevoked) {
        throw new AuthenticationError('Refresh token has been revoked');
      }

      // Blacklist the old refresh token
      await this.blacklistRefreshToken(decoded.tokenId);

      // Generate new token pair
      const newTokens = await this.generateTokenPair(decoded.userId);

      // Store new refresh token
      await this.storeRefreshToken(newTokens.refreshToken, decoded.userId);

      return {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
        expiresIn: newTokens.expiresIn,
        tokenType: 'Bearer'
      };
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new AuthenticationError('Invalid or expired refresh token');
      }
      throw error;
    }
  }

  // Validate access token
  async validateAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      
      if (decoded.type !== 'access') {
        throw new AuthenticationError('Invalid access token');
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(decoded.jti);
      if (isBlacklisted) {
        throw new AuthenticationError('Token has been invalidated');
      }

      return {
        valid: true,
        userId: decoded.userId,
        ...decoded
      };
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new AuthenticationError('Invalid or expired access token');
      }
      throw error;
    }
  }

  // Store refresh token in database
  async storeRefreshToken(refreshToken, userId) {
    await this.database.initialize();
    
    // Parse refresh token to get tokenId
    const decoded = jwt.verify(refreshToken, this.refreshTokenSecret);
    
    await this.database.insert('refresh_tokens', {
      id: decoded.tokenId,
      token_hash: this.hashToken(refreshToken),
      user_id: userId,
      created_at: new Date(),
      expires_at: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
      is_revoked: false,
      device_info: null // Will be populated later
    });
  }

  // Blacklist refresh token
  async blacklistRefreshToken(tokenId) {
    await this.database.initialize();
    
    await this.database.update('refresh_tokens', 
      { is_revoked: true },
      `token_id = '${tokenId}'`
    );
  }

  // Blacklist access token
  async blacklistAccessToken(jti) {
    await this.database.initialize();
    
    await this.database.insert('blacklisted_tokens', {
      id: jti,
      token_hash: jti, // Use jti as hash for simplicity
      blacklisted_at: new Date(),
      expires_at: new Date(Date.now() + (15 * 60 * 1000)) // 15 minutes
    });
  }

  // Check if refresh token is revoked
  async isRefreshTokenRevoked(tokenId) {
    await this.database.initialize();
    
    const result = await this.database.query(
      'SELECT is_revoked FROM refresh_tokens WHERE token_id = $1',
      [tokenId]
    );
    
    return result.rows[0]?.is_revoked || false;
  }

  // Check if token is blacklisted
  async isTokenBlacklisted(jti) {
    await this.database.initialize();
    
    const result = await this.database.query(
      'SELECT 1 FROM blacklisted_tokens WHERE id = $1',
      [jti]
    );
    
    return result.rows.length > 0;
  }

  // Clean up expired tokens
  async cleanupExpiredTokens() {
    await this.database.initialize();
    
    // Cleanup expired refresh tokens
    await this.database.query(`
      DELETE FROM refresh_tokens 
      WHERE expires_at < NOW()
    `);

    // Cleanup blacklisted tokens
    await this.database.query(`
      DELETE FROM blacklisted_tokens 
      WHERE expires_at < NOW()
    `);

    // Clean up old blacklisted tokens (keep last 1000)
    await this.database.query(`
      DELETE FROM blacklisted_tokens 
      WHERE expires_at < NOW() - INTERVAL '1 day'
    `);
  }

  // Hash token for secure storage
  hashToken(token) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Middleware to validate and extract tokens
  createTokenValidationMiddleware() {
    return (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        const refreshToken = req.headers['x-refresh-token'];
        
        if (authHeader) {
          const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
          const validation = await this.validateAccessToken(token);
          
          if (validation.valid) {
            req.user = {
              id: validation.userId,
              ...validation
            };
            req.token = token;
          } else {
            throw new AuthenticationError('Invalid token');
          }
        }

        // Handle refresh token (optional)
        if (refreshToken) {
          try {
            const newTokens = await this.refreshAccessToken(refreshToken);
            
            // Add new refresh token to response header
            res.setHeader('X-New-Access-Token', newTokens.accessToken);
            res.setHeader('X-New-Refresh-Token', newTokens.refreshToken);
          } catch (error) {
            // Don't expose refresh token error details
            console.error('Refresh token error:', error);
          }
        }

        next();
      } catch (error) {
        const appError = new AppError('Token validation failed', {
          statusCode: error.statusCode || 401,
          originalError: error
        });
        
        res.status(appError.statusCode).json({
          success: false,
          error: {
            code: appError.code,
            message: appError.message
          }
        });
      }
    };
  }

  // Middleware for token refresh endpoint
  createRefreshTokenMiddleware() {
    return (req, res, next) => {
      try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
          throw new ValidationError('Refresh token is required');
        }

        const newTokens = await this.refreshAccessToken(refreshToken);
        
        res.json({
          success: true,
          data: {
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken,
            expiresIn: newTokens.expiresIn,
            tokenType: newTokens.tokenType
          }
        });
      } catch (error) {
        const appError = new AppError('Token refresh failed', {
          statusCode: error.statusCode || 401,
          originalError: error
        });
        
        res.status(appError.statusCode).json({
          success: false,
          error: {
            code: appError.code,
            message: appError.message
          }
        });
      }
    };
  }
}

module.exports = RefreshTokenService;