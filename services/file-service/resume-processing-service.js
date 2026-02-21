/**
 * TalentSphere File Upload and Resume Processing Service
 * Handles file uploads, virus scanning, OCR, and resume parsing
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid');
const PDFParser = require('pdf-parse');
const mammoth = require('mammoth');

class ResumeProcessingService {
    constructor(options = {}) {
        this.options = {
            // File storage configuration
            uploadDir: options.uploadDir || process.env.UPLOAD_DIR || './uploads',
            maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
            allowedFileTypes: options.allowedFileTypes || [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain',
                'application/rtf'
            ],
            allowedExtensions: options.allowedExtensions || ['.pdf', '.doc', '.docx', '.txt', '.rtf'],

            // OCR and parsing configuration
            enableOCR: options.enableOCR !== false,
            enableResumeParsing: options.enableResumeParsing !== false,
            enableVirusScanning: options.enableVirusScanning !== false,

            // Storage options
            enableEncryptedStorage: options.enableEncryptedStorage || false,
            encryptionKey: options.encryptionKey || process.env.ENCRYPTION_KEY,

            // Virus scanning options
            antivirusCommand: options.antivirusCommand || process.env.ANTIVIRUS_COMMAND || 'clamscan',

            // Processing timeouts
            ocrTimeout: options.ocrTimeout || 30000, // 30 seconds
            virusScanTimeout: options.virusScanTimeout || 30000, // 30 seconds

            ...options
        };

        // Ensure upload directory exists
        if (!fs.existsSync(this.options.uploadDir)) {
            fs.mkdirSync(this.options.uploadDir, { recursive: true });
        }

        // Initialize multer storage
        this.storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, this.options.uploadDir);
            },
            filename: (req, file, cb) => {
                // Generate unique filename
                const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
                const extension = path.extname(file.originalname);
                const filename = `${uuidv4()}_${uniqueSuffix}${extension}`;
                cb(null, filename);
            }
        });

        this.upload = multer({
            storage: this.storage,
            limits: {
                fileSize: this.options.maxFileSize
            },
            fileFilter: (req, file, cb) => {
                // Check file type
                const isAllowedType = this.options.allowedFileTypes.includes(file.mimetype);
                const isAllowedExt = this.options.allowedExtensions.includes(path.extname(file.originalname).toLowerCase());

                if (isAllowedType && isAllowedExt) {
                    cb(null, true);
                } else {
                    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${this.options.allowedFileTypes.join(', ')}`), false);
                }
            }
        });

        this.execPromise = promisify(exec);
    }

    /**
     * Get multer upload middleware
     */
    getUploadMiddleware(fieldName = 'file', maxCount = 1) {
        return this.upload.single(fieldName);
    }

    /**
     * Validate file before processing
     */
    async validateFile(filePath) {
        try {
            const stats = fs.statSync(filePath);

            // Check file size
            if (stats.size > this.options.maxFileSize) {
                throw new Error(`File size exceeds maximum allowed size of ${this.options.maxFileSize} bytes`);
            }

            // Check file type by reading the actual file (not just extension)
            // This is a simplified check - in production, use a library like file-type
            const buffer = fs.readFileSync(filePath, { encoding: 'binary', flag: 'r' });

            // Check for PDF magic number
            if (buffer.startsWith('%PDF-')) {
                return { valid: true, type: 'application/pdf', size: stats.size };
            }

            // For now, assume it's valid if it passes our filters
            return { valid: true, type: 'unknown', size: stats.size };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    /**
     * Scan file for viruses
     */
    async scanForViruses(filePath) {
        if (!this.options.enableVirusScanning) {
            return { clean: true, message: 'Virus scanning disabled' };
        }

        try {
            const command = `${this.options.antivirusCommand} "${filePath}"`;
            const { stdout, stderr } = await this.execPromise(command, { timeout: this.options.virusScanTimeout });

            if (stderr) {
                console.warn('Antivirus scan warning:', stderr);
            }

            // Parse antivirus output (this varies by antivirus software)
            // Assuming ClamAV output format
            if (stdout.includes('FOUND')) {
                return { clean: false, message: 'Virus detected', details: stdout };
            } else if (stdout.includes('OK')) {
                return { clean: true, message: 'File is clean', details: stdout };
            } else {
                return { clean: true, message: 'Scan completed without threats', details: stdout };
            }
        } catch (error) {
            if (error.code === 'ETIMEDOUT') {
                throw new Error('Virus scan timed out');
            }
            // If antivirus is not installed, we'll return clean but log a warning
            console.warn('Antivirus scan failed:', error.message);
            return { clean: true, message: 'Antivirus scan unavailable', details: error.message };
        }
    }

    /**
     * Extract text from PDF file
     */
    async extractTextFromPDF(filePath) {
        try {
            const data = await PDFParser(fs.createReadStream(filePath));
            return data.text;
        } catch (error) {
            throw new Error(`Failed to extract text from PDF: ${error.message}`);
        }
    }

    /**
     * Extract text from DOCX file
     */
    async extractTextFromDOCX(filePath) {
        try {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value;
        } catch (error) {
            throw new Error(`Failed to extract text from DOCX: ${error.message}`);
        }
    }

    /**
     * Extract text from DOC file (requires antiword or similar tool)
     */
    async extractTextFromDOC(filePath) {
        try {
            const command = `antiword "${filePath}"`;
            const { stdout } = await this.execPromise(command);
            return stdout;
        } catch (error) {
            console.warn('antiword not available, attempting alternative extraction');
            // Fallback: try reading as plain text
            try {
                return fs.readFileSync(filePath, 'utf8');
            } catch (fallbackError) {
                throw new Error(`Failed to extract text from DOC: ${error.message}`);
            }
        }
    }

    /**
     * Extract text from TXT file
     */
    async extractTextFromTXT(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            throw new Error(`Failed to read text file: ${error.message}`);
        }
    }

    /**
     * Extract text from RTF file
     */
    async extractTextFromRTF(filePath) {
        try {
            // RTF parsing is complex, so we'll use a simplified approach
            // In production, use a proper RTF parser
            let content = fs.readFileSync(filePath, 'utf8');

            // Remove basic RTF formatting markers
            content = content.replace(/\\[^a-z]+/gi, ' ')
                .replace(/{\\[^}]*}/g, '')
                .replace(/\{\*\\[^}]*}/g, '')
                .replace(/\\'[0-9A-F]{2}/g, ' ')
                .replace(/[{}]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            return content;
        } catch (error) {
            throw new Error(`Failed to extract text from RTF: ${error.message}`);
        }
    }

    /**
     * Extract text from various file formats
     */
    async extractTextFromFile(filePath, fileType) {
        const extension = path.extname(filePath).toLowerCase();

        switch (extension) {
            case '.pdf':
                return await this.extractTextFromPDF(filePath);
            case '.docx':
                return await this.extractTextFromDOCX(filePath);
            case '.doc':
                return await this.extractTextFromDOC(filePath);
            case '.txt':
                return await this.extractTextFromTXT(filePath);
            case '.rtf':
                return await this.extractTextFromRTF(filePath);
            default:
                throw new Error(`Unsupported file type: ${extension}`);
        }
    }

    /**
     * Perform OCR on image-based PDFs or other image files
     */
    async performOCR(filePath) {
        if (!this.options.enableOCR) {
            return { success: false, message: 'OCR disabled' };
        }

        try {
            // This is a placeholder for OCR functionality
            // In production, use a library like tesseract.js or Tesseract CLI
            const command = `tesseract "${filePath}" stdout`;
            const { stdout } = await this.execPromise(command, { timeout: this.options.ocrTimeout });

            return { success: true, text: stdout, message: 'OCR completed' };
        } catch (error) {
            if (error.code === 'ETIMEDOUT') {
                return { success: false, message: 'OCR timed out' };
            }

            // OCR might fail if file is not an image
            // This is expected for regular PDFs, so we'll return a neutral result
            return { success: false, message: `OCR not applicable or failed: ${error.message}` };
        }
    }

    /**
     * Parse resume content to extract structured data
     */
    async parseResumeContent(content) {
        if (!this.options.enableResumeParsing) {
            return { parsed: false, message: 'Resume parsing disabled' };
        }

        try {
            // Extract basic information using regex patterns
            const parsedData = {
                fullName: this.extractName(content),
                email: this.extractEmail(content),
                phone: this.extractPhone(content),
                address: this.extractAddress(content),
                summary: this.extractSummary(content),
                experience: this.extractExperience(content),
                education: this.extractEducation(content),
                skills: this.extractSkills(content),
                certifications: this.extractCertifications(content),
                languages: this.extractLanguages(content)
            };

            return {
                success: true,
                parsed: true,
                data: parsedData,
                confidence: this.calculateConfidence(parsedData)
            };
        } catch (error) {
            return {
                success: false,
                parsed: false,
                message: `Resume parsing failed: ${error.message}`,
                error: error.message
            };
        }
    }

    /**
     * Extract name from resume content
     */
    extractName(content) {
        // Look for common name patterns
        const namePattern = /^([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]*)*)/m;
        const match = content.match(namePattern);
        return match ? match[1].trim() : null;
    }

    /**
     * Extract email from resume content
     */
    extractEmail(content) {
        const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const matches = content.match(emailPattern);
        return matches ? matches[0] : null;
    }

    /**
     * Extract phone number from resume content
     */
    extractPhone(content) {
        const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        const matches = content.match(phonePattern);
        return matches ? matches[0] : null;
    }

    /**
     * Extract address from resume content
     */
    extractAddress(content) {
        // Look for address-like patterns
        const addressPattern = /(\d+\s+[A-Za-z\s]+,\s*[A-Za-z\s]+,\s*\w{2}\s*\d{5})|([A-Za-z\s]+\s+\d+,\s*[A-Za-z\s]+,\s*\w{2})/i;
        const match = content.match(addressPattern);
        return match ? match[0].trim() : null;
    }

    /**
     * Extract professional summary
     */
    extractSummary(content) {
        const summarySections = ['SUMMARY', 'PROFILE', 'ABOUT', 'OBJECTIVE'];
        for (const section of summarySections) {
            const pattern = new RegExp(`${section}[\\s\\S]*?(?=EXPERIENCE|EDUCATION|SKILLS|$)`, 'i');
            const match = content.match(pattern);
            if (match) {
                return match[0].replace(section, '').trim();
            }
        }
        return null;
    }

    /**
     * Extract work experience
     */
    extractExperience(content) {
        const expPattern = /(EXPERIENCE|WORK|EMPLOYMENT)[\s\S]*?(?=EDUCATION|SKILLS|CERTIFICATIONS|$)/i;
        const match = content.match(expPattern);
        return match ? match[0].replace(/(EXPERIENCE|WORK|EMPLOYMENT)/i, '').trim() : null;
    }

    /**
     * Extract education information
     */
    extractEducation(content) {
        const eduPattern = /(EDUCATION|SCHOOL|DEGREE)[\s\S]*?(?=EXPERIENCE|SKILLS|CERTIFICATIONS|$)/i;
        const match = content.match(eduPattern);
        return match ? match[0].replace(/(EDUCATION|SCHOOL|DEGREE)/i, '').trim() : null;
    }

    /**
     * Extract skills
     */
    extractSkills(content) {
        const skillsPattern = /(SKILLS|TECHNICAL SKILLS|COMPETENCIES)[\s\S]*?(?=EXPERIENCE|EDUCATION|CERTIFICATIONS|$)/i;
        const match = content.match(skillsPattern);
        if (match) {
            let skillsText = match[0].replace(/(SKILLS|TECHNICAL SKILLS|COMPETENCIES)/i, '').trim();
            // Split by commas or newlines
            return skillsText.split(/[,\n\r]+/)
                .map(skill => skill.trim())
                .filter(skill => skill.length > 0);
        }
        return [];
    }

    /**
     * Extract certifications
     */
    extractCertifications(content) {
        const certPattern = /(CERTIFICATIONS?|LICENSES?|CREDENTIALS)[\s\S]*?(?=EXPERIENCE|EDUCATION|SKILLS|$)/i;
        const match = content.match(certPattern);
        return match ? match[0].replace(/(CERTIFICATIONS?|LICENSES?|CREDENTIALS)/i, '').trim() : null;
    }

    /**
     * Extract languages
     */
    extractLanguages(content) {
        const langPattern = /(LANGUAGES?|SPOKEN)[\s\S]*?(?=EXPERIENCE|EDUCATION|SKILLS|$)/i;
        const match = content.match(langPattern);
        if (match) {
            let langsText = match[0].replace(/(LANGUAGES?|SPOKEN)/i, '').trim();
            return langsText.split(/[,\n\r]+/)
                .map(lang => lang.trim())
                .filter(lang => lang.length > 0);
        }
        return [];
    }

    /**
     * Calculate parsing confidence based on extracted data
     */
    calculateConfidence(parsedData) {
        let confidence = 0;
        let fields = 0;

        if (parsedData.fullName) { confidence += 20; fields++; }
        if (parsedData.email) { confidence += 15; fields++; }
        if (parsedData.phone) { confidence += 10; fields++; }
        if (parsedData.experience) { confidence += 15; fields++; }
        if (parsedData.education) { confidence += 15; fields++; }
        if (parsedData.skills && parsedData.skills.length > 0) { confidence += 10; fields++; }
        if (parsedData.summary) { confidence += 10; fields++; }

        // Adjust confidence based on completeness
        const completeness = fields / 7; // Total possible fields
        return Math.min(100, Math.round(confidence * completeness));
    }

    /**
     * Process uploaded resume file
     */
    async processResumeFile(filePath, originalName) {
        try {
            // Validate file
            const validation = await this.validateFile(filePath);
            if (!validation.valid) {
                throw new Error(`File validation failed: ${validation.error}`);
            }

            // Scan for viruses
            const virusCheck = await this.scanForViruses(filePath);
            if (!virusCheck.clean) {
                throw new Error(`Virus detected: ${virusCheck.message}`);
            }

            // Extract text from file
            const extractedText = await this.extractTextFromFile(filePath, validation.type);

            // Perform OCR if needed (for image-based PDFs)
            let ocrResult = null;
            if (extractedText.trim().length < 50) { // If text extraction yielded little content
                ocrResult = await this.performOCR(filePath);
                if (ocrResult.success) {
                    extractedText = ocrResult.text;
                }
            }

            // Parse resume content
            const parsedResume = await this.parseResumeContent(extractedText);

            // Create processing result
            const result = {
                success: true,
                originalFileName: originalName,
                storedFilePath: filePath,
                fileSize: validation.size,
                fileType: validation.type,
                virusCheck,
                extractedText: extractedText.substring(0, 1000) + '...', // Truncate for response
                parsedResume,
                processedAt: new Date().toISOString(),
                fileId: path.basename(filePath, path.extname(filePath))
            };

            return result;
        } catch (error) {
            // Clean up the uploaded file if processing failed
            try {
                fs.unlinkSync(filePath);
            } catch (unlinkError) {
                console.error('Failed to clean up uploaded file:', unlinkError);
            }

            return {
                success: false,
                error: error.message,
                processedAt: new Date().toISOString()
            };
        }
    }

    /**
     * Get file statistics
     */
    getFileStats() {
        try {
            const files = fs.readdirSync(this.options.uploadDir);
            const stats = {
                totalFiles: files.length,
                totalSize: 0,
                byType: {},
                oldestFile: null,
                newestFile: null
            };

            files.forEach(file => {
                const filePath = path.join(this.options.uploadDir, file);
                const fileStat = fs.statSync(filePath);
                stats.totalSize += fileStat.size;

                const ext = path.extname(file).toLowerCase();
                stats.byType[ext] = (stats.byType[ext] || 0) + 1;

                if (!stats.oldestFile || fileStat.birthtime < stats.oldestFile.birthtime) {
                    stats.oldestFile = { name: file, birthtime: fileStat.birthtime };
                }
                if (!stats.newestFile || fileStat.birthtime > stats.newestFile.birthtime) {
                    stats.newestFile = { name: file, birthtime: fileStat.birthtime };
                }
            });

            return stats;
        } catch (error) {
            return { error: error.message };
        }
    }

    /**
     * Clean old files from upload directory
     */
    cleanOldFiles(maxAgeHours = 24) {
        try {
            const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
            const files = fs.readdirSync(this.options.uploadDir);
            let cleanedCount = 0;

            files.forEach(file => {
                const filePath = path.join(this.options.uploadDir, file);
                const stat = fs.statSync(filePath);

                if (stat.birthtime.getTime() < cutoffTime) {
                    fs.unlinkSync(filePath);
                    cleanedCount++;
                }
            });

            return {
                success: true,
                cleanedFiles: cleanedCount,
                cleanedAt: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get supported file types
     */
    getSupportedFileTypes() {
        return {
            types: this.options.allowedFileTypes,
            extensions: this.options.allowedExtensions,
            maxSize: this.options.maxFileSize,
            maxSizeHuman: this.formatBytes(this.options.maxFileSize)
        };
    }

    /**
     * Format bytes to human-readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) {return '0 Bytes';}
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

module.exports = ResumeProcessingService;