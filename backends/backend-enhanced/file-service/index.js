/**
 * File Upload Service
 * 
 * Handles file uploads for resumes, profile pictures, and documents.
 * Supports:
 * - Local storage (dev) and S3 (prod)
 * - Image optimization with Sharp
 * - PDF parsing
 * - File validation (type, size)
 */

const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');

// Load environment variables
dotenv.config();

// Configuration
const config = {
    port: process.env.FILE_SERVICE_PORT || 3009, // Use 3009 to avoid conflicts
    environment: process.env.NODE_ENV || 'development',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    s3: {
        bucket: process.env.AWS_S3_BUCKET,
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
};

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/talentsphere',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// AWS S3 Setup
const s3 = new AWS.S3({
    region: config.s3.region,
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey
});

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Logger
const logger = {
    info: (msg) => console.log(`[INFO] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${msg}`)
};

// Storage Engine (Multer)
const storage = multer.memoryStorage(); // Store in memory for processing
const upload = multer({
    storage: storage,
    limits: { fileSize: config.maxFileSize },
    fileFilter: (req, file, cb) => {
        // Allowed types check
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Error: File type not allowed! (Images, PDF, DOCX only)'));
        }
    }
});

// Helper: Upload to S3 or Local
async function saveFile(fileBuffer, fileName, mimeType) {
    // Check if S3 is configured
    if (config.s3.bucket && config.s3.accessKeyId) {
        try {
            const params = {
                Bucket: config.s3.bucket,
                Key: fileName,
                Body: fileBuffer,
                ContentType: mimeType,
                ACL: 'public-read' // Caution: adjust based on privacy needs
            };
            const result = await s3.upload(params).promise();
            return { url: result.Location, key: result.Key, provider: 's3' };
        } catch (error) {
            logger.error(`S3 Upload failed: ${error.message}. Falling back to local.`);
        }
    }

    // Fallback to local
    const filePath = path.join(config.uploadDir, fileName);
    fs.writeFileSync(filePath, fileBuffer);
    const fileUrl = `/uploads/${fileName}`; // In prod, this needs a static file server or nginx mapping
    return { url: fileUrl, key: fileName, provider: 'local' };
}

// Routes

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'file-service', timestamp: new Date() });
});

// Upload Profile Picture
app.post('/upload/profile-picture', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const userId = req.body.userId || 'anonymous'; // Should come from Auth token middleware usually
        const fileExt = path.extname(file.originalname);
        const fileName = `profile-pics/${userId}-${uuidv4()}${fileExt}`;

        // Resize image if it's an image
        let fileBuffer = file.buffer;
        if (file.mimetype.startsWith('image/')) {
            fileBuffer = await sharp(file.buffer)
                .resize(500, 500, { fit: 'cover' })
                .jpeg({ quality: 80 })
                .toBuffer();
        }

        const uploadResult = await saveFile(fileBuffer, fileName, file.mimetype);

        // Update user profile in User Service via API call
        let profileUpdateStatus = 'skipped';

        try {
            const userProfileServiceUrl = process.env.USER_PROFILE_SERVICE_URL || 'http://localhost:3009/api/v1';
            const authHeader = req.headers.authorization;

            if (authHeader && userId !== 'anonymous') {
                // 1. Get Profile ID by User ID
                const profileResponse = await fetch(`${userProfileServiceUrl}/profiles/user/${userId}`, {
                    headers: { 'Authorization': authHeader }
                });

                if (profileResponse.ok) {
                    const profile = await profileResponse.json();

                    // 2. Update Profile with new picture URL
                    const updateResponse = await fetch(`${userProfileServiceUrl}/profiles/${profile.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': authHeader
                        },
                        body: JSON.stringify({
                            ...profile,
                            profilePicture: uploadResult.url
                        })
                    });

                    if (updateResponse.ok) {
                        profileUpdateStatus = 'success';
                        logger.info(`Updated profile picture for user ${userId}`);
                    } else {
                        profileUpdateStatus = 'failed_update';
                        const errorText = await updateResponse.text();
                        logger.error(`Failed to update profile: ${updateResponse.status} ${errorText}`);
                    }
                } else {
                    profileUpdateStatus = 'failed_fetch';
                    logger.warn(`Could not fetch profile for user ${userId}: ${profileResponse.status}`);
                }
            }
        } catch (apiError) {
            profileUpdateStatus = 'error';
            logger.error(`API Error updating profile: ${apiError.message}`);
        }

        res.json({
            success: true,
            data: {
                url: uploadResult.url,
                key: uploadResult.key,
                provider: uploadResult.provider,
                profileUpdate: profileUpdateStatus
            }
        });

    } catch (error) {
        logger.error(`Profile upload error: ${error.message}`);
        res.status(500).json({ error: 'File upload failed' });
    }
});

// Upload Resume/Document
app.post('/upload/resume', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const userId = req.body.userId || 'anonymous';
        const fileExt = path.extname(file.originalname);
        const fileName = `resumes/${userId}-${uuidv4()}${fileExt}`;

        // Basic validation
        if (file.mimetype !== 'application/pdf' && !file.mimetype.includes('word')) {
            return res.status(400).json({ error: 'Only PDF and Word documents are allowed for resumes' });
        }

        const uploadResult = await saveFile(file.buffer, fileName, file.mimetype);

        res.json({
            success: true,
            data: {
                url: uploadResult.url,
                key: uploadResult.key,
                provider: uploadResult.provider,
                originalName: file.originalname
            }
        });

    } catch (error) {
        logger.error(`Resume upload error: ${error.message}`);
        res.status(500).json({ error: 'File upload failed' });
    }
});

// Serve local uploads (for development)
if (config.environment === 'development') {
    app.use('/uploads', express.static(config.uploadDir));
}

// Start Server
app.listen(config.port, () => {
    logger.info(`File Service listening on port ${config.port}`);
    logger.info(`Environment: ${config.environment}`);
    logger.info(`Storage: ${config.s3.bucket ? 'AWS S3' : 'Local Filesystem'}`);
});

module.exports = app; // For testing
