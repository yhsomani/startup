const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

// Mock the database manager
const mockDatabase = {
    query: jest.fn()
};

jest.mock('../../../shared/database-connection', () => ({
    getDatabaseManager: () => mockDatabase
}));

// Mock other dependencies
jest.mock('../../../shared/validation', () => ({
    validateRequest: jest.fn(() => ({ valid: true })),
    validateResponse: jest.fn(() => ({ valid: true }))
}));

jest.mock('../../shared/middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 'mock-user-id', role: 'user' };
        next();
    }
}));

const JobListingService = require('../../backends/backend-enhanced/job-listing-service/enhanced-index');

describe('Job Listing Service', () => {
    let service;
    let app;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new JobListingService();
        app = service.app;
    });

    describe('GET /health', () => {
        test('should return health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body.status).toBe('healthy');
            expect(response.body.service).toBe('job-listing-service');
        });
    });

    describe('POST /api/v1/jobs', () => {
        test('should create a new job listing', async () => {
            const mockJob = {
                id: uuidv4(),
                title: 'Software Engineer',
                description: 'Develop software applications',
                companyId: uuidv4(),
                location: 'Remote',
                employmentType: 'full-time',
                salaryMin: 80000,
                salaryMax: 120000,
                experienceLevel: 'mid'
            };

            mockDatabase.query.mockResolvedValue({
                rows: [{
                    id: mockJob.id,
                    title: mockJob.title,
                    company_id: mockJob.companyId,
                    created_at: new Date().toISOString()
                }]
            });

            const response = await request(app)
                .post('/api/v1/jobs')
                .send(mockJob)
                .expect(201);

            expect(response.body.title).toBe(mockJob.title);
            expect(mockDatabase.query).toHaveBeenCalled();
        });

        test('should return 400 for invalid request data', async () => {
            // Mock validation to fail
            const validateRequest = require('../../../shared/validation').validateRequest;
            validateRequest.mockReturnValueOnce({
                valid: false,
                errors: [{ message: 'Title is required' }]
            });

            const response = await request(app)
                .post('/api/v1/jobs')
                .send({})
                .expect(400);

            expect(response.body.error).toBe('VALIDATION_ERROR');
        });
    });

    describe('GET /api/v1/jobs/:id', () => {
        test('should return a job listing by ID', async () => {
            const jobId = uuidv4();
            const mockJob = {
                id: jobId,
                title: 'Software Engineer',
                description: 'Develop software applications',
                company_id: uuidv4(),
                location: 'Remote',
                employment_type: 'full-time',
                salary_min: 80000,
                salary_max: 120000,
                experience_level: 'mid',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            mockDatabase.query.mockResolvedValue({
                rows: [mockJob]
            });

            const response = await request(app)
                .get(`/api/v1/jobs/${jobId}`)
                .expect(200);

            expect(response.body.id).toBe(jobId);
            expect(response.body.title).toBe(mockJob.title);
        });

        test('should return 404 for non-existent job', async () => {
            mockDatabase.query.mockResolvedValue({
                rows: []
            });

            const jobId = uuidv4();
            const response = await request(app)
                .get(`/api/v1/jobs/${jobId}`)
                .expect(404);

            expect(response.body.error).toBe('NOT_FOUND');
        });
    });

    describe('PUT /api/v1/jobs/:id', () => {
        test('should update a job listing', async () => {
            const jobId = uuidv4();
            const updateData = {
                title: 'Senior Software Engineer',
                location: 'On-site'
            };

            mockDatabase.query.mockResolvedValue({
                rows: [{
                    id: jobId,
                    title: updateData.title,
                    company_id: uuidv4(),
                    location: updateData.location,
                    employment_type: 'full-time',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]
            });

            const response = await request(app)
                .put(`/api/v1/jobs/${jobId}`)
                .send(updateData)
                .expect(200);

            expect(response.body.title).toBe(updateData.title);
            expect(response.body.location).toBe(updateData.location);
        });
    });

    describe('DELETE /api/v1/jobs/:id', () => {
        test('should delete a job listing', async () => {
            const jobId = uuidv4();

            mockDatabase.query.mockResolvedValue({
                rows: [{ id: jobId }]
            });

            const response = await request(app)
                .delete(`/api/v1/jobs/${jobId}`)
                .expect(200);

            expect(response.body.message).toBe('Job listing deleted successfully');
        });
    });

    describe('GET /api/v1/jobs', () => {
        test('should search job listings', async () => {
            const mockJobs = [{
                id: uuidv4(),
                title: 'Software Engineer',
                company_id: uuidv4(),
                location: 'Remote',
                employment_type: 'full-time',
                salary_min: 80000,
                salary_max: 120000,
                experience_level: 'mid',
                status: 'active',
                created_at: new Date().toISOString()
            }];

            mockDatabase.query
                .mockResolvedValueOnce({ rows: mockJobs }) // For the main query
                .mockResolvedValueOnce({ rows: [{ total: 1 }] }); // For the count query

            const response = await request(app)
                .get('/api/v1/jobs')
                .expect(200);

            expect(response.body.jobs).toHaveLength(1);
            expect(response.body.total).toBe(1);
        });
    });

    describe('POST /api/v1/jobs/:id/apply', () => {
        test('should submit a job application', async () => {
            const jobId = uuidv4();
            const applicationData = {
                coverLetter: 'I am interested in this position...'
            };

            // Mock job existence check
            mockDatabase.query
                .mockResolvedValueOnce({ rows: [{ id: jobId, company_id: uuidv4() }] }) // Job exists
                .mockResolvedValueOnce({ rows: [{ id: uuidv4(), job_id: jobId, user_id: 'mock-user-id', status: 'pending', created_at: new Date().toISOString() }] }); // Insert application

            const response = await request(app)
                .post(`/api/v1/jobs/${jobId}/apply`)
                .send(applicationData)
                .expect(201);

            expect(response.body.job_id).toBe(jobId);
            expect(response.body.status).toBe('pending');
        });
    });
});