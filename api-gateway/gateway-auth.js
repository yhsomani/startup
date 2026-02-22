/**
 * Gateway Authentication Middleware
 * Validates JWT and injects user info into headers for downstream services
 */

const jwt = require("jsonwebtoken");
const { createLogger } = require("../../shared/enhanced-logger");

const logger = createLogger("gateway-auth");

const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized: Missing Token" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.headers["x-user-id"] = decoded.userId || decoded.sub;
        req.headers["x-user-role"] = decoded.role || "user";
        req.headers["x-user-email"] = decoded.email || "";

        delete req.headers.authorization;

        logger.debug(`Authenticated user: ${decoded.userId || decoded.sub}`);

        next();
    } catch (err) {
        logger.warn("Invalid token", { error: err.message });
        return res.status(401).json({ error: "Unauthorized: Invalid Token" });
    }
};

const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.headers["x-user-id"] = decoded.userId || decoded.sub;
        req.headers["x-user-role"] = decoded.role || "user";
        req.headers["x-user-email"] = decoded.email || "";

        delete req.headers.authorization;

        logger.debug(`Authenticated user (optional): ${decoded.userId || decoded.sub}`);
    } catch (err) {
        logger.debug("Optional auth failed, continuing without user");
    }

    next();
};

module.exports = { requireAuth, optionalAuth };
