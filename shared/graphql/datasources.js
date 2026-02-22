/**
 * GraphQL Data Sources
 *
 * Interfaces with existing microservices via REST APIs.
 */

const { RESTDataSource } = require("@apollo/datasource-rest");

class UserAPI extends RESTDataSource {
    constructor() {
        super();
        this.baseURL = process.env.USER_SERVICE_URL || "http://localhost:3001";
    }

    async getUserById(id) {
        return this.get(`/api/v1/users/${id}`);
    }

    async getUsers({ limit, offset }) {
        return this.get("/api/v1/users", { params: { limit, offset } });
    }

    async getUserByEmail(email) {
        return this.get(`/api/v1/users/email/${email}`);
    }

    async search(query, limit) {
        return this.get("/api/v1/users/search", { params: { q: query, limit } });
    }

    async login(email, password) {
        return this.post("/api/v1/auth/login", { email, password });
    }

    async register(input) {
        return this.post("/api/v1/auth/register", input);
    }

    async forgotPassword(email) {
        return this.post("/api/v1/auth/forgot-password", { email });
    }

    async resetPassword(token, newPassword) {
        return this.post("/api/v1/auth/reset-password", { token, newPassword });
    }

    async updateProfile(userId, input) {
        return this.put(`/api/v1/users/${userId}`, input);
    }

    async getUserSkills(userId) {
        return this.get(`/api/v1/users/${userId}/skills`);
    }

    async getUserExperience(userId) {
        return this.get(`/api/v1/users/${userId}/experience`);
    }

    async getUserEducation(userId) {
        return this.get(`/api/v1/users/${userId}/education`);
    }

    async getAnalytics(userId) {
        return this.get(`/api/v1/users/${userId}/analytics`);
    }
}

class JobAPI extends RESTDataSource {
    constructor() {
        super();
        this.baseURL = process.env.JOB_SERVICE_URL || "http://localhost:3002";
    }

    async getJobById(id) {
        return this.get(`/api/v1/jobs/${id}`);
    }

    async getJobs({ filter, limit, offset }) {
        return this.get("/api/v1/jobs", { params: { ...filter, limit, offset } });
    }

    async getFeaturedJobs({ limit }) {
        return this.get("/api/v1/jobs/featured", { params: { limit } });
    }

    async getJobsByCompany(companyId) {
        return this.get(`/api/v1/companies/${companyId}/jobs`);
    }

    async search(query, limit) {
        return this.get("/api/v1/jobs/search", { params: { q: query, limit } });
    }

    async getCompanyById(id) {
        return this.get(`/api/v1/companies/${id}`);
    }

    async getCompanies({ industry, limit, offset }) {
        return this.get("/api/v1/companies", { params: { industry, limit, offset } });
    }

    async createJob(input, userId) {
        return this.post("/api/v1/jobs", { ...input, userId });
    }

    async updateJob(id, input, userId) {
        return this.put(`/api/v1/jobs/${id}`, { ...input, userId });
    }

    async deleteJob(id, userId) {
        return this.delete(`/api/v1/jobs/${id}`, { params: { userId } });
    }

    async applyToJob(jobId, userId) {
        return this.post("/api/v1/applications", { jobId, userId });
    }
}

class CourseAPI extends RESTDataSource {
    constructor() {
        super();
        this.baseURL = process.env.LMS_SERVICE_URL || "http://localhost:3003";
    }

    async getCourseById(id) {
        return this.get(`/api/v1/courses/${id}`);
    }

    async getCourses({ category, limit, offset }) {
        return this.get("/api/v1/courses", { params: { category, limit, offset } });
    }

    async search(query, limit) {
        return this.get("/api/v1/courses/search", { params: { q: query, limit } });
    }

    async getLessons(courseId) {
        return this.get(`/api/v1/courses/${courseId}/lessons`);
    }

    async getEnrollments(userId) {
        return this.get(`/api/v1/enrollments`, { params: { userId } });
    }

    async enrollCourse(courseId, userId) {
        return this.post("/api/v1/enrollments", { courseId, userId });
    }

    async completeLesson(courseId, lessonId, userId) {
        return this.post(`/api/v1/courses/${courseId}/lessons/${lessonId}/complete`, { userId });
    }
}

class ChallengeAPI extends RESTDataSource {
    constructor() {
        super();
        this.baseURL = process.env.CHALLENGE_SERVICE_URL || "http://localhost:3006";
    }

    async getChallengeById(id) {
        return this.get(`/api/v1/challenges/${id}`);
    }

    async getChallenges({ difficulty, limit }) {
        return this.get("/api/v1/challenges", { params: { difficulty, limit } });
    }

    async search(query, limit) {
        return this.get("/api/v1/challenges/search", { params: { q: query, limit } });
    }

    async getSubmissions(userId) {
        return this.get("/api/v1/submissions", { params: { userId } });
    }

    async submit(challengeId, code, language, userId) {
        return this.post("/api/v1/submissions", { challengeId, code, language, userId });
    }
}

module.exports = {
    UserAPI,
    JobAPI,
    CourseAPI,
    ChallengeAPI,
};
