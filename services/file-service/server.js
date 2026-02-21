/**
 * TalentSphere Resume Processing Service Main Entry Point
 * Initializes resume processing service and starts API server
 */

const ResumeProcessingService = require('./resume-processing-service');
const ResumeProcessingAPI = require('./api');

async function startResumeProcessingService() {
    console.log('Starting TalentSphere Resume Processing Service...');

    // Create resume processing service instance
    const resumeProcessingService = new ResumeProcessingService({
        uploadDir: process.env.UPLOAD_DIR || './uploads',
        maxFileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : 10 * 1024 * 1024, // 10MB
        enableOCR: process.env.ENABLE_OCR === 'true',
        enableResumeParsing: process.env.ENABLE_RESUME_PARSING !== 'false',
        enableVirusScanning: process.env.ENABLE_VIRUS_SCANNING === 'true',
        antivirusCommand: process.env.ANTIVIRUS_COMMAND || 'clamscan'
    });

    try {
        // Create and start API server
        const resumeProcessingAPI = new ResumeProcessingAPI(resumeProcessingService);
        const apiPort = process.env.RESUME_API_PORT || 3003;
        await resumeProcessingAPI.start(apiPort);

        console.log(`✅ Resume Processing Service started successfully`);
        console.log(`✅ API server on port ${apiPort}`);
        console.log(`✅ Upload directory: ${resumeProcessingService.options.uploadDir}`);
        console.log(`✅ Max file size: ${resumeProcessingService.formatBytes(resumeProcessingService.options.maxFileSize)}`);
        console.log(`✅ OCR enabled: ${resumeProcessingService.options.enableOCR}`);
        console.log(`✅ Resume parsing enabled: ${resumeProcessingService.options.enableResumeParsing}`);
        console.log(`✅ Virus scanning enabled: ${resumeProcessingService.options.enableVirusScanning}`);
        console.log(`✅ Available endpoints:`);
        console.log(`   GET  /health - Health check`);
        console.log(`   POST /api/v1/resumes/upload - Upload and process resume`);
        console.log(`   GET  /api/v1/resumes/config - Get supported file types`);
        console.log(`   GET  /api/v1/resumes/stats - Get file statistics`);
        console.log(`   DELETE /api/v1/resumes/clean - Clean old files`);
        console.log(`   POST /api/v1/resumes/validate - Validate file`);
        console.log(`   POST /api/v1/resumes/parse-text - Parse resume text`);

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\nShutting down resume processing service...');
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log('\nShutting down resume processing service...');
            process.exit(0);
        });
    } catch (error) {
        console.error('Failed to start resume processing service:', error);
        process.exit(1);
    }
}

// If this file is run directly, start the service
if (require.main === module) {
    startResumeProcessingService().catch(error => {
        console.error('Failed to start resume processing service:', error);
        process.exit(1);
    });
}

module.exports = {
    ResumeProcessingService,
    ResumeProcessingAPI,
    startResumeProcessingService
};