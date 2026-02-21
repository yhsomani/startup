/**
 * TalentSphere Resume Processing Service API
 * REST API for file upload and resume processing
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const ResumeProcessingService = require("./resume-processing-service");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

class ResumeProcessingAPI {
    constructor(resumeProcessingService) {
        this.resumeProcessingService = resumeProcessingService;
        this.app = express();

        // Middleware
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(express.json({ limit: "10mb" }));
        this.app.use(express.urlencoded({ extended: true }));

        // Rate limiting for file uploads
        const uploadLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // limit each IP to 5 uploads per windowMs
            message: {
                error: "Too many file uploads from this IP, please try again later.",
            },
        });

        // Apply rate limiting to upload endpoints
        this.app.use("/api/v1/resumes/upload", uploadLimiter);

        // API Routes
        this.setupRoutes();
    }

    setupRoutes() {
        // Health check
        this.app.get("/health", (req, res) => {
            const stats = this.resumeProcessingService.getFileStats();
            res.json({
                status: "healthy",
                timestamp: new Date().toISOString(),
                service: "resume-processing-service",
                uploadDir: this.resumeProcessingService.options.uploadDir,
                fileStats: stats,
            });
        });

        // Upload and process resume
        this.app.post("/api/v1/resumes/upload", async (req, res) => {
            try {
                // Use the upload middleware
                const uploadMiddleware = this.resumeProcessingService.getUploadMiddleware("resume");

                // Wrap multer middleware in a promise to handle async/await
                await new Promise((resolve, reject) => {
                    uploadMiddleware(req, res, err => {
                        if (err) {
                            if (err instanceof multer.MulterError) {
                                if (err.code === "LIMIT_FILE_SIZE") {
                                    return reject(new Error("File too large"));
                                } else if (err.code === "LIMIT_FILE_COUNT") {
                                    return reject(new Error("Too many files"));
                                } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
                                    return reject(new Error("Unexpected field"));
                                }
                            }
                            return reject(err);
                        }
                        resolve();
                    });
                });

                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        error: "No file uploaded",
                    });
                }

                // Process the uploaded file
                const result = await this.resumeProcessingService.processResumeFile(
                    req.file.path,
                    req.file.originalname
                );

                res.json({
                    success: result.success,
                    data: result,
                    timestamp: new Date().toISOString(),
                });
            } catch (error) {
                console.error("Error uploading resume:", error);

                // Return specific status codes based on error type
                let statusCode = 500;
                let errorMessage = "Failed to upload and process resume";

                if (error.message.includes("File too large")) {
                    statusCode = 413; // Payload Too Large
                    errorMessage = "File exceeds maximum size limit";
                } else if (error.message.includes("Too many files")) {
                    statusCode = 400;
                    errorMessage = "Too many files uploaded";
                } else if (error.message.includes("Unexpected field")) {
                    statusCode = 400;
                    errorMessage = "Unexpected file field";
                } else if (error.message.includes("Invalid file type")) {
                    statusCode = 415; // Unsupported Media Type
                    errorMessage = "File type not supported";
                }

                res.status(statusCode).json({
                    success: false,
                    error: errorMessage,
                    message: error.message,
                });
            }
        });

        // Get supported file types
        this.app.get("/api/v1/resumes/config", (req, res) => {
            try {
                const config = this.resumeProcessingService.getSupportedFileTypes();

                res.json({
                    success: true,
                    data: config,
                    timestamp: new Date().toISOString(),
                });
            } catch (error) {
                console.error("Error getting config:", error);
                res.status(500).json({
                    success: false,
                    error: "Failed to get configuration",
                    message: error.message,
                });
            }
        });

        // Get file statistics
        this.app.get("/api/v1/resumes/stats", (req, res) => {
            try {
                const stats = this.resumeProcessingService.getFileStats();

                res.json({
                    success: true,
                    data: stats,
                    timestamp: new Date().toISOString(),
                });
            } catch (error) {
                console.error("Error getting stats:", error);
                res.status(500).json({
                    success: false,
                    error: "Failed to get file statistics",
                    message: error.message,
                });
            }
        });

        // Clean old files
        this.app.delete("/api/v1/resumes/clean", (req, res) => {
            try {
                const maxAgeHours = parseInt(req.query.maxAgeHours) || 24;
                const result = this.resumeProcessingService.cleanOldFiles(maxAgeHours);

                res.json({
                    success: result.success,
                    data: result,
                    timestamp: new Date().toISOString(),
                });
            } catch (error) {
                console.error("Error cleaning files:", error);
                res.status(500).json({
                    success: false,
                    error: "Failed to clean old files",
                    message: error.message,
                });
            }
        });

        // Download processed resume
        this.app.get("/api/v1/resumes/download/:fileId", (req, res) => {
            try {
                const { fileId } = req.params;
                const filePath = path.join(
                    this.resumeProcessingService.options.uploadDir,
                    `${fileId}.pdf` // Assuming we store as PDF
                );

                if (!fs.existsSync(filePath)) {
                    return res.status(404).json({
                        success: false,
                        error: "File not found",
                    });
                }

                res.download(filePath, err => {
                    if (err) {
                        console.error("Error downloading file:", err);
                        res.status(500).json({
                            success: false,
                            error: "Failed to download file",
                            message: err.message,
                        });
                    }
                });
            } catch (error) {
                console.error("Error downloading resume:", error);
                res.status(500).json({
                    success: false,
                    error: "Failed to download resume",
                    message: error.message,
                });
            }
        });

        // Re-process a resume
        this.app.post("/api/v1/resumes/process/:fileId", async (req, res) => {
            try {
                const { fileId } = req.params;
                const filePath = path.join(
                    this.resumeProcessingService.options.uploadDir,
                    `${fileId}.pdf` // Adjust based on actual file extension
                );

                if (!fs.existsSync(filePath)) {
                    return res.status(404).json({
                        success: false,
                        error: "File not found",
                    });
                }

                // Get original file name from a metadata file or DB in real implementation
                const result = await this.resumeProcessingService.processResumeFile(
                    filePath,
                    `${fileId}_processed.pdf`
                );

                res.json({
                    success: result.success,
                    data: result,
                    timestamp: new Date().toISOString(),
                });
            } catch (error) {
                console.error("Error re-processing resume:", error);
                res.status(500).json({
                    success: false,
                    error: "Failed to re-process resume",
                    message: error.message,
                });
            }
        });

        // Validate file without storing
        this.app.post("/api/v1/resumes/validate", async (req, res) => {
            try {
                // This endpoint would typically receive a temporary file or URL
                // For now, we'll simulate the validation process
                const { fileName, fileSize, fileType } = req.body;

                if (!fileName || !fileSize || !fileType) {
                    return res.status(400).json({
                        success: false,
                        error: "fileName, fileSize, and fileType are required",
                    });
                }

                // Simulate validation
                const isValidType =
                    this.resumeProcessingService.options.allowedFileTypes.includes(fileType);
                const isValidExtension =
                    this.resumeProcessingService.options.allowedExtensions.includes(
                        path.extname(fileName).toLowerCase()
                    );
                const isWithinSizeLimit =
                    fileSize <= this.resumeProcessingService.options.maxFileSize;

                const result = {
                    fileName,
                    fileSize,
                    fileType,
                    validType: isValidType,
                    validExtension: isValidExtension,
                    withinSizeLimit: isWithinSizeLimit,
                    valid: isValidType && isValidExtension && isWithinSizeLimit,
                    maxSize: this.resumeProcessingService.options.maxFileSize,
                    supportedTypes: this.resumeProcessingService.options.allowedFileTypes,
                    supportedExtensions: this.resumeProcessingService.options.allowedExtensions,
                };

                res.json({
                    success: true,
                    data: result,
                    timestamp: new Date().toISOString(),
                });
            } catch (error) {
                console.error("Error validating file:", error);
                res.status(500).json({
                    success: false,
                    error: "Failed to validate file",
                    message: error.message,
                });
            }
        });

        // Get parsing confidence for a text
        this.app.post("/api/v1/resumes/parse-text", async (req, res) => {
            try {
                const { text } = req.body;

                if (!text) {
                    return res.status(400).json({
                        success: false,
                        error: "Text content is required",
                    });
                }

                const parsedResume = await this.resumeProcessingService.parseResumeContent(text);

                res.json({
                    success: true,
                    data: parsedResume,
                    timestamp: new Date().toISOString(),
                });
            } catch (error) {
                console.error("Error parsing text:", error);
                res.status(500).json({
                    success: false,
                    error: "Failed to parse resume text",
                    message: error.message,
                });
            }
        });
    }

    /**
     * Start the API server
     */
    async start(port = 3003) {
        return new Promise(resolve => {
            this.app.listen(port, () => {
                console.log(`Resume Processing API server running on port ${port}`);
                resolve();
            });
        });
    }

    /**
     * Get the express app instance
     */
    getApp() {
        return this.app;
    }
}

module.exports = ResumeProcessingAPI;
