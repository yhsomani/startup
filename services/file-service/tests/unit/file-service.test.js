/**
 * File Service Unit Tests
 */

const ResumeProcessingService = require("../resume-processing-service");

describe("ResumeProcessingService", () => {
    let service;

    beforeEach(() => {
        service = new ResumeProcessingService({
            uploadDir: "./test-uploads",
            maxFileSize: 5 * 1024 * 1024,
        });
    });

    afterEach(() => {
        // Cleanup
        const fs = require("fs");
        if (fs.existsSync("./test-uploads")) {
            fs.rmSync("./test-uploads", { recursive: true, force: true });
        }
    });

    describe("constructor", () => {
        it("should initialize with default options", () => {
            const defaultService = new ResumeProcessingService();
            expect(defaultService.options.maxFileSize).toBe(10 * 1024 * 1024);
            expect(defaultService.options.allowedFileTypes).toBeDefined();
            expect(defaultService.options.allowedExtensions).toBeDefined();
        });

        it("should initialize with custom options", () => {
            expect(service.options.maxFileSize).toBe(5 * 1024 * 1024);
            expect(service.options.uploadDir).toBe("./test-uploads");
        });

        it("should have multer upload configured", () => {
            expect(service.upload).toBeDefined();
        });
    });

    describe("formatBytes", () => {
        it("should format bytes correctly", () => {
            expect(service.formatBytes(0)).toBe("0 Bytes");
            expect(service.formatBytes(1024)).toBe("1 KB");
            expect(service.formatBytes(1024 * 1024)).toBe("1 MB");
            expect(service.formatBytes(1024 * 1024 * 1024)).toBe("1 GB");
        });
    });

    describe("getSupportedFileTypes", () => {
        it("should return supported file types", () => {
            const types = service.getSupportedFileTypes();
            expect(types).toBeDefined();
            expect(types.mimeTypes).toBeInstanceOf(Array);
            expect(types.extensions).toBeInstanceOf(Array);
        });
    });

    describe("getFileStats", () => {
        it("should return file statistics", () => {
            const stats = service.getFileStats();
            expect(stats).toBeDefined();
            expect(stats.totalFiles).toBeDefined();
            expect(stats.totalSize).toBeDefined();
        });
    });

    describe("extractName", () => {
        it("should extract name from content", () => {
            const content = "John Doe\nSoftware Engineer";
            const name = service.extractName(content);
            expect(name).toBe("John Doe");
        });
    });

    describe("extractEmail", () => {
        it("should extract email from content", () => {
            const content = "Contact me at john.doe@example.com";
            const email = service.extractEmail(content);
            expect(email).toBe("john.doe@example.com");
        });

        it("should return null when no email found", () => {
            const content = "No email here";
            const email = service.extractEmail(content);
            expect(email).toBeNull();
        });
    });

    describe("extractPhone", () => {
        it("should extract phone from content", () => {
            const content = "Call me at 555-123-4567";
            const phone = service.extractPhone(content);
            expect(phone).toBe("555-123-4567");
        });
    });
});
