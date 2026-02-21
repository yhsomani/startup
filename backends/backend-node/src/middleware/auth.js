// Use the shared authentication middleware
const auth = require('../../../shared/middleware/auth');

// Re-export socket auth for backward compatibility
module.exports = auth.socket;
