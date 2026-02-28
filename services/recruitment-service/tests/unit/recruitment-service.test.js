/**
 * Recruitment Service Unit Tests
 */

// Mock compute-cosine-similarity
jest.mock("compute-cosine-similarity", () => {
    return jest.fn((vecA, vecB) => {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
        const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        return magA && magB ? dot / (magA * magB) : 0;
    });
});

const similarity = require("compute-cosine-similarity");

describe("AIMatchingService", () => {
    let service;

    beforeEach(() => {
        jest.clearAllMocks();
        similarity.mockReturnValue(0.85);
        service = new (require("../ai-matching-service"))({
            similarityThreshold: 0.7,
            maxRecommendations: 5,
        });
    });

    describe("constructor", () => {
        it("should initialize with default options", () => {
            const defaultService = new (require("../ai-matching-service"))();
            expect(defaultService.options.similarityThreshold).toBe(0.6);
            expect(defaultService.options.maxRecommendations).toBe(10);
        });

        it("should initialize with custom options", () => {
            expect(service.options.similarityThreshold).toBe(0.7);
            expect(service.options.maxRecommendations).toBe(5);
            expect(service.options.weights).toBeDefined();
        });

        it("should initialize storage maps", () => {
            expect(service.options.userProfiles).toBeInstanceOf(Map);
            expect(service.options.jobProfiles).toBeInstanceOf(Map);
            expect(service.options.userInteractions).toBeInstanceOf(Map);
        });
    });

    describe("calculateCosineSimilarity", () => {
        it("should calculate similarity between vectors", () => {
            const vecA = [1, 2, 3];
            const vecB = [1, 2, 3];
            const result = service.calculateCosineSimilarity(vecA, vecB);
            expect(similarity).toHaveBeenCalledWith(vecA, vecB);
        });
    });

    describe("tokenizeText", () => {
        it("should tokenize text into features", () => {
            const result = service.tokenizeText("JavaScript React Node.js");
            expect(result).toBeInstanceOf(Array);
            expect(result).toContain("javascript");
            expect(result).toContain("react");
        });

        it("should return empty array for null input", () => {
            const result = service.tokenizeText(null);
            expect(result).toEqual([]);
        });

        it("should return empty array for empty string", () => {
            const result = service.tokenizeText("");
            expect(result).toEqual([]);
        });
    });

    describe("extractSkills", () => {
        it("should extract skills from text", () => {
            const text = "JavaScript, Python, React, Node.js, TypeScript";
            const skills = service.extractSkills(text);
            expect(skills).toBeInstanceOf(Array);
            expect(skills.length).toBeGreaterThan(0);
        });
    });

    describe("calculateSkillsScore", () => {
        it("should calculate skills match score", () => {
            const userSkills = ["JavaScript", "React"];
            const jobSkills = ["JavaScript", "React", "Node.js"];
            const score = service.calculateSkillsScore(userSkills, jobSkills);
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
        });

        it("should return 0 for empty skills", () => {
            const score = service.calculateSkillsScore([], []);
            expect(score).toBe(0);
        });
    });

    describe("calculateExperienceScore", () => {
        it("should calculate experience match score", () => {
            const userYears = 5;
            const jobYears = 3;
            const score = service.calculateExperienceScore(userYears, jobYears);
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
        });
    });

    describe("calculateLocationScore", () => {
        it("should return 100 for exact match", () => {
            const score = service.calculateLocationScore("New York", "New York");
            expect(score).toBe(100);
        });

        it("should return partial score for similar locations", () => {
            const score = service.calculateLocationScore("NYC", "New York");
            expect(score).toBeGreaterThan(0);
        });

        it("should return 0 for no match", () => {
            const score = service.calculateLocationScore("Tokyo", "New York");
            expect(score).toBe(0);
        });
    });

    describe("calculateEducationScore", () => {
        it("should calculate education score", () => {
            const userEducation = [{ degree: "Bachelor", field: "CS" }];
            const jobEducation = [{ degree: "Bachelor", field: "CS" }];
            const score = service.calculateEducationScore(userEducation, jobEducation);
            expect(score).toBeGreaterThanOrEqual(0);
        });
    });

    describe("scoreJobForUser", () => {
        it("should calculate overall job score", () => {
            const user = {
                skills: ["JavaScript", "React"],
                yearsOfExperience: 5,
                location: "New York",
                education: [{ degree: "Bachelor", field: "CS" }],
            };
            const job = {
                skills: ["JavaScript", "React", "Node.js"],
                requiredExperience: 3,
                location: "New York",
                education: [{ degree: "Bachelor", field: "CS" }],
            };
            const score = service.scoreJobForUser(user, job);
            expect(score).toBeGreaterThan(0);
            expect(score.totalScore).toBeDefined();
        });
    });
});
