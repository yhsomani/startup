/**
 * Unit Tests for Job Service
 * Tests job CRUD operations, search, and business logic
 */

const request = require('supertest');
const { app } = require('../../backends/backend-enhanced/job-service/index');
const { AppError, ValidationError, NotFoundError } = require('../../../shared/error-handler');
const { configManager } = require('../../../shared/config-manager');

describe('Job Service', () => {
  let testCompany;
  let testJob;
  let authToken;
  let adminToken;

  beforeEach(async () => {
    // Create test company
    testCompany = global.testUtils.generateCompany();
    
    // Create test job
    testJob = global.testUtils.generateJob({
      companyId: testCompany.id,
      title: 'Software Engineer',
      description: 'We are looking for a talented software engineer...',
      location: 'San Francisco, CA',
      remote: true,
      jobType: 'full-time',
      experienceLevel: 'mid',
      salaryMin: 80000,
      salaryMax: 120000,
      skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
      requirements: [
        '3+ years of experience',
        'Bachelor\'s degree in Computer Science',
        'Strong problem-solving skills'
      ]
    });

    // Clean up test data
    await global.testUtils.cleanupDatabase();
    
    // Create authentication tokens
    authToken = 'test-user-token';
    adminToken = 'test-admin-token';
  });

  afterEach(async () => {
    await global.testUtils.cleanupDatabase();
    jest.clearAllMocks();
  });

  describe('POST /jobs', () => {
    it('should create a new job successfully', async () => {
      const response = await request(app)
        .post('/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testJob)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('job');
      expect(response.body.data.job.title).toBe(testJob.title);
      expect(response.body.data.job.companyId).toBe(testJob.companyId);
      expect(response.body.data.job).toHaveProperty('id');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/jobs')
        .send(testJob)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('AUTHENTICATION_ERROR');
    });

    it('should require admin privileges', async () => {
      const response = await request(app)
        .post('/jobs')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testJob)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('AUTHORIZATION_ERROR');
    });

    it('should validate required fields', async () => {
      const invalidJob = {
        title: testJob.title
        // Missing required fields
      };

      const response = await request(app)
        .post('/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidJob)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
      expect(response.body.details).toContain(
        expect.objectContaining({
          field: expect.stringMatching(/description|companyId/),
          message: expect.stringContaining('required')
        })
      );
    });

    it('should validate salary range', async () => {
      const invalidJob = {
        ...testJob,
        salaryMin: 120000,
        salaryMax: 80000 // Invalid: max < min
      };

      const response = await request(app)
        .post('/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidJob)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });

    it('should handle job creation errors gracefully', async () => {
      // Mock database error
      jest.spyOn(global, 'testDb', 'query')
        .mockRejectedValueOnce(new Error('Database constraint violation'));

      const response = await request(app)
        .post('/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testJob)
        .expect(500);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('DATABASE_ERROR');
    });
  });

  describe('GET /jobs', () => {
    let createdJobs;

    beforeEach(async () => {
      // Create test jobs
      createdJobs = [];
      for (let i = 0; i < 5; i++) {
        const jobData = global.testUtils.generateJob({
          title: `Software Engineer ${i + 1}`,
          companyId: testCompany.id
        });
        
        const response = await request(app)
          .post('/jobs')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(jobData);
        
        createdJobs.push(response.body.data.job);
      }
    });

    it('should return paginated list of jobs', async () => {
      const response = await request(app)
        .get('/jobs')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('jobs');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.jobs).toHaveLength(5);
      expect(response.body.data.pagination).toHaveProperty('total');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 10);
    });

    it('should filter jobs by company', async () => {
      const response = await request(app)
        .get('/jobs')
        .query({ companyId: testCompany.id })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.jobs).toHaveLength(5);
      response.body.data.jobs.forEach(job => {
        expect(job.companyId).toBe(testCompany.id);
      });
    });

    it('should filter jobs by location', async () => {
      const response = await request(app)
        .get('/jobs')
        .query({ location: 'San Francisco' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      response.body.data.jobs.forEach(job => {
        expect(job.location).toContain('San Francisco');
      });
    });

    it('should filter jobs by remote status', async () => {
      const response = await request(app)
        .get('/jobs')
        .query({ remote: true })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      response.body.data.jobs.forEach(job => {
        expect(job.remote).toBe(true);
      });
    });

    it('should filter jobs by job type', async () => {
      const response = await request(app)
        .get('/jobs')
        .query({ jobType: 'full-time' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      response.body.data.jobs.forEach(job => {
        expect(job.jobType).toBe('full-time');
      });
    });

    it('should handle invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/jobs')
        .query({ page: -1, limit: 0 })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /jobs/:jobId', () => {
    let createdJob;

    beforeEach(async () => {
      const response = await request(app)
        .post('/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testJob);
      
      createdJob = response.body.data.job;
    });

    it('should return job by ID', async () => {
      const response = await request(app)
        .get(`/jobs/${createdJob.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('job');
      expect(response.body.data.job.id).toBe(createdJob.id);
      expect(response.body.data.job.title).toBe(createdJob.title);
    });

    it('should return 404 for non-existent job', async () => {
      const response = await request(app)
        .get('/jobs/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('NOT_FOUND');
    });

    it('should increment job view count', async () => {
      const firstResponse = await request(app)
        .get(`/jobs/${createdJob.id}`)
        .expect(200);

      const secondResponse = await request(app)
        .get(`/jobs/${createdJob.id}`)
        .expect(200);

      expect(secondResponse.body.data.job.viewCount).toBeGreaterThan(
        firstResponse.body.data.job.viewCount
      );
    });
  });

  describe('PUT /jobs/:jobId', () => {
    let createdJob;

    beforeEach(async () => {
      const response = await request(app)
        .post('/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testJob);
      
      createdJob = response.body.data.job;
    });

    it('should update job successfully', async () => {
      const updates = {
        title: 'Updated Software Engineer',
        salaryMax: 130000,
        remote: false
      };

      const response = await request(app)
        .put(`/jobs/${createdJob.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.job.title).toBe(updates.title);
      expect(response.body.data.job.salaryMax).toBe(updates.salaryMax);
      expect(response.body.data.job.remote).toBe(updates.remote);
      expect(response.body.data.job.id).toBe(createdJob.id);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/jobs/${createdJob.id}`)
        .send({ title: 'Updated' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should require admin privileges', async () => {
      const response = await request(app)
        .put(`/jobs/${createdJob.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should not allow updating certain fields', async () => {
      const invalidUpdates = {
        id: 'should-not-change',
        companyId: 'should-not-change',
        createdAt: 'should-not-change'
      };

      const response = await request(app)
        .put(`/jobs/${createdJob.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidUpdates)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /jobs/:jobId', () => {
    let createdJob;

    beforeEach(async () => {
      const response = await request(app)
        .post('/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testJob);
      
      createdJob = response.body.data.job;
    });

    it('should delete job successfully', async () => {
      const response = await request(app)
        .delete(`/jobs/${createdJob.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.message).toContain('deleted successfully');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/jobs/${createdJob.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should require admin privileges', async () => {
      const response = await request(app)
        .delete(`/jobs/${createdJob.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /jobs/:jobId/apply', () => {
    let createdJob;
    let applicationData;

    beforeEach(async () => {
      const response = await request(app)
        .post('/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testJob);
      
      createdJob = response.body.data.job;
      
      applicationData = {
        coverLetter: 'I am very interested in this position...',
        resumeUrl: 'https://example.com/resume.pdf',
        portfolioUrl: 'https://example.com/portfolio',
        expectedSalary: 95000,
        availableStartDate: '2024-02-01'
      };
    });

    it('should submit job application successfully', async () => {
      const response = await request(app)
        .post(`/jobs/${createdJob.id}/apply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(applicationData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('application');
      expect(response.body.data.application.jobId).toBe(createdJob.id);
      expect(response.body.data.application.userId).toBe('user-123');
      expect(response.body.data.application).toHaveProperty('id');
    });

    it('should prevent duplicate applications', async () => {
      // First application
      await request(app)
        .post(`/jobs/${createdJob.id}/apply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(applicationData)
        .expect(201);

      // Second application should fail
      const response = await request(app)
        .post(`/jobs/${createdJob.id}/apply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(applicationData)
        .expect(409);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('CONFLICT');
    });

    it('should validate application data', async () => {
      const invalidApplication = {
        // Missing required fields
      };

      const response = await request(app)
        .post(`/jobs/${createdJob.id}/apply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidApplication)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /jobs/:jobId/analytics', () => {
    let createdJob;

    beforeEach(async () => {
      const response = await request(app)
        .post('/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testJob);
      
      createdJob = response.body.data.job;
    });

    it('should return job analytics for admin', async () => {
      const response = await request(app)
        .get(`/jobs/${createdJob.id}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('analytics');
      expect(response.body.data.analytics).toHaveProperty('views');
      expect(response.body.data.analytics).toHaveProperty('applications');
      expect(response.body.data.analytics).toHaveProperty('clicks');
    });

    it('should reject analytics access for regular users', async () => {
      const response = await request(app)
        .get(`/jobs/${createdJob.id}/analytics`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('AUTHORIZATION_ERROR');
    });
  });

  describe('GET /jobs/search', () => {
    let createdJobs;

    beforeEach(async () => {
      // Create jobs with different content
      createdJobs = [];
      const jobTitles = [
        'Frontend Developer',
        'Backend Engineer', 
        'Full Stack Developer',
        'React Developer',
        'Node.js Developer'
      ];

      for (const title of jobTitles) {
        const jobData = global.testUtils.generateJob({
          title,
          description: `${title} position with modern web technologies`,
          companyId: testCompany.id
        });
        
        const response = await request(app)
          .post('/jobs')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(jobData);
        
        createdJobs.push(response.body.data.job);
      }
    });

    it('should search jobs by keyword', async () => {
      const response = await request(app)
        .get('/jobs/search')
        .query({ q: 'React Developer' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('jobs');
      expect(response.body.data.jobs.length).toBeGreaterThan(0);
      
      // Should prioritize exact matches
      const hasExactMatch = response.body.data.jobs.some(job => 
        job.title.includes('React Developer')
      );
      expect(hasExactMatch).toBe(true);
    });

    it('should return relevant search results', async () => {
      const response = await request(app)
        .get('/jobs/search')
        .query({ q: 'JavaScript' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      response.body.data.jobs.forEach(job => {
        // Should match either title or description
        const matchesTitle = job.title.toLowerCase().includes('javascript');
        const matchesDescription = job.description.toLowerCase().includes('javascript');
        expect(matchesTitle || matchesDescription).toBe(true);
      });
    });

    it('should sort search results by relevance', async () => {
      const response = await request(app)
        .get('/jobs/search')
        .query({ q: 'Full Stack Developer' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      const jobs = response.body.data.jobs;
      
      if (jobs.length > 1) {
        // First result should have highest relevance score
        expect(jobs[0]).toHaveProperty('relevanceScore');
        expect(jobs[0].relevanceScore).toBeGreaterThanOrEqual(
          jobs[1].relevanceScore || 0
        );
      }
    });

    it('should handle empty search query', async () => {
      const response = await request(app)
        .get('/jobs/search')
        .query({ q: '' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit job search', async () => {
      const searchPromises = [];
      
      // Make 60 search requests within 1 minute
      for (let i = 0; i < 60; i++) {
        searchPromises.push(
          request(app)
            .get('/jobs/search')
            .query({ q: 'developer' })
        );
      }

      const responses = await Promise.all(searchPromises);
      
      // Some responses should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 20;
      const startTime = Date.now();
      
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        request(app)
          .get('/jobs')
          .query({ page: 1, limit: 10 })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
      });

      // Performance should be reasonable
      expect(duration).toBeLessThan(2000); // 2 seconds
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle large payloads', async () => {
      const largeJob = {
        ...testJob,
        description: 'x'.repeat(10000), // Very large description
        skills: Array(1000).fill('skill') // Too many skills
      };

      const response = await request(app)
        .post('/jobs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(largeJob)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toBe('VALIDATION_ERROR');
    });
  });
});