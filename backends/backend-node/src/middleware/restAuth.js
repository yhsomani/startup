const jwt = require('jsonwebtoken');
const { config, logger } = require('../config/config');

const restAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        logger.warn('REST Request rejected: No token provided');
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        logger.error('REST JWT verification failed:', error.message);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

const adminOnly = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        logger.warn(`Unauthorized access attempt by user ${req.user ? req.user.userId : 'unknown'}`);
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

module.exports = { restAuth, adminOnly };
