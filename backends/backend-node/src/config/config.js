const winston = require('winston');
require('dotenv').config();

// Configuration
const config = {
    PORT: process.env.PORT || 3030,
    JWT_SECRET: process.env.JWT_SECRET || '506a96e13dd6c15a48e02d305414deeea5e2b1068ff19449e65c46d5c548bba876a0f52903887b4b7d1c5b3b6d8f0e3a5d4f2c6b8a1e9d7c5b3a9f2e6d4c8b0a',
    RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001,http://localhost:3002'
};

// Logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.simple()
        }),
        new winston.transports.File({ filename: 'notifications.log' })
    ]
});

module.exports = { config, logger };
