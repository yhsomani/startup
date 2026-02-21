const request = require('supertest');
const { v4: uuidv4 } = require('uuid');

// Import the actual services
const JobListingService = require('../../backends/backend-enhanced/job-listing-service/enhanced-index');
const UserProfileService = require('../../backends/backend-enhanced/user-profile-service/enhanced-index');

describe('Job Listing Service Integration Tests', () => {
    let jobServiceApp;
    let profileServiceApp;
    let testCompanyId;
    let testUserId;
    let testJobId;

    beforeAll(async () => {
        // Start both services for integration testing
        const jobService = new JobListingService();
        await new Promise(resolve => {
            setTimeout(() => resolve(), 1000); // Wait for service to start
        });
        jobServiceApp = jobService.app;

        const profileService = new UserProfileService();
        await new Promise(resolve => {
            setTimeout(() => resolve(), 1000); // Wait for service to start
        });
        profileServiceApp = profileService.app;

        testCompanyId = uuidv4();
        testUserId = uuidv4();
    });

    afterAll(async () => {
        // Cleanup: stop services if needed
    });

    test('should create a job listing and then apply for it', async () => {
        // First, create a job listing
        const jobData = {
            title: 'Software Engineer',
            description: 'We are looking for a skilled software engineer...',
            companyId: testCompanyId,
            location: 'Remote',
            employmentType: 'full-time',
            salaryMin: 80000,
            salaryMax: 120000,
            experienceLevel: 'mid'
        };

        const createJobResponse = await request(jobServiceApp)
            .post('/api/v1/jobs')
            .send(jobData)
            .expect(201);

        expect(createJobResponse.body.title).toBe(jobData.title);
        testJobId = createJobResponse.body.id;

        // Then, apply for the job
        const applicationData = {
            coverLetter: 'I am very interested in this position...'
        };

        // Mock authentication for the application
        const applyResponse = await request(jobServiceApp)
            .post(`/api/v1/jobs/${testJobId}/apply`)
            .send(applicationData)
            .set('Authorization', 'Bearer mock-token') // This would be a real JWT in actual testing
            .expect(201);

        expect(applyResponse.body.job_id).toBe(testJobId);
        expect(applyResponse.body.status).toBe('pending');
    });

    test('should search for job listings', async () => {
        const searchResponse = await request(jobServiceApp)
            .get('/api/v1/jobs')
            .query({ query: 'Software Engineer' })
            .expect(200);

        expect(Array.isArray(searchResponse.body.jobs)).toBe(true);
        expect(searchResponse.body.total).toBeGreaterThanOrEqual(0);
    });

    test('should get a specific job listing', async () => {
        const getResponse = await request(jobServiceApp)
            .get(`/api/v1/jobs/${testJobId}`)
            .expect(200);

        expect(getResponse.body.id).toBe(testJobId);
        expect(getResponse.body.title).toBe('Software Engineer');
    });

    test('should get job applications for a job', async () => {
        // This test assumes the user has proper permissions to view applications
        // In real implementation, this would require proper authentication
        const applicationsResponse = await request(jobServiceApp)
            .get(`/api/v1/jobs/${testJobId}/applications`)
            .set('Authorization', 'Bearer mock-token')
            .expect(200);

        expect(applicationsResponse.body.applications).toBeDefined();
    });
});

describe('User Profile Service Integration Tests', () => {
    let profileServiceApp;
    let testUserId;
    let testProfileId;

    beforeAll(async () => {
        const profileService = new UserProfileService();
        await new Promise(resolve => {
            setTimeout(() => resolve(), 1000); // Wait for service to start
        });
        profileServiceApp = profileService.app;

        testUserId = uuidv4();
    });

    test('should create a user profile and manage skills', async () => {
        // Create a user profile
        const profileData = {
            userId: testUserId,
            firstName: 'John',
            lastName: 'Doe',
            headline: 'Software Developer',
            summary: 'Experienced software developer'
        };

        const createProfileResponse = await request(profileServiceApp)
            .post('/api/v1/profiles')
            .send(profileData)
            .set('Authorization', 'Bearer mock-token')
            .expect(201);

        expect(createProfileResponse.body.first_name).toBe(profileData.firstName);
        testProfileId = createProfileResponse.body.id;

        // Add a skill to the profile
        const skillData = {
            name: 'JavaScript',
            level: 'advanced'
        };

        const addSkillResponse = await request(profileServiceApp)
            .post(`/api/v1/profiles/${testProfileId}/skills`)
            .send(skillData)
            .set('Authorization', 'Bearer mock-token')
            .expect(201);

        expect(addSkillResponse.body.name).toBe(skillData.name);
        expect(addSkillResponse.body.level).toBe(skillData.level);

        // List skills for the profile
        const listSkillsResponse = await request(profileServiceApp)
            .get(`/api/v1/profiles/${testProfileId}/skills`)
            .set('Authorization', 'Bearer mock-token')
            .expect(200);

        expect(listSkillsResponse.body.skills).toHaveLength(1);
        expect(listSkillsResponse.body.skills[0].name).toBe('JavaScript');
    });

    test('should manage experiences in user profile', async () => {
        // Add an experience
        const experienceData = {
            company: 'Tech Corp',
            title: 'Software Engineer',
            startDate: '2020-01-01',
            endDate: '2023-01-01',
            description: 'Developed software applications'
        };

        const addExperienceResponse = await request(profileServiceApp)
            .post(`/api/v1/profiles/${testProfileId}/experiences`)
            .send(experienceData)
            .set('Authorization', 'Bearer mock-token')
            .expect(201);

        expect(addExperienceResponse.body.company).toBe(experienceData.company);
        expect(addExperienceResponse.body.title).toBe(experienceData.title);

        // List experiences
        const listExperiencesResponse = await request(profileServiceApp)
            .get(`/api/v1/profiles/${testProfileId}/experiences`)
            .set('Authorization', 'Bearer mock-token')
            .expect(200);

        expect(listExperiencesResponse.body.experiences).toHaveLength(1);
        expect(listExperiencesResponse.body.experiences[0].company).toBe('Tech Corp');
    });

    test('should manage education in user profile', async () => {
        // Add an education
        const educationData = {
            institution: 'University of Tech',
            degree: 'Bachelor of Science',
            fieldOfStudy: 'Computer Science',
            startDate: '2016-09-01',
            endDate: '2020-06-01'
        };

        const addEducationResponse = await request(profileServiceApp)
            .post(`/api/v1/profiles/${testProfileId}/educations`)
            .send(educationData)
            .set('Authorization', 'Bearer mock-token')
            .expect(201);

        expect(addEducationResponse.body.institution).toBe(educationData.institution);
        expect(addEducationResponse.body.degree).toBe(educationData.degree);

        // List educations
        const listEducationsResponse = await request(profileServiceApp)
            .get(`/api/v1/profiles/${testProfileId}/educations`)
            .set('Authorization', 'Bearer mock-token')
            .expect(200);

        expect(listEducationsResponse.body.educations).toHaveLength(1);
        expect(listEducationsResponse.body.educations[0].institution).toBe('University of Tech');
    });
});

describe('Cross-Service Integration Tests', () => {
    let jobServiceApp;
    let profileServiceApp;
    let testCompanyId;
    let testUserId;
    let testJobId;
    let testProfileId;

    beforeAll(async () => {
        const jobService = new JobListingService();
        await new Promise(resolve => {
            setTimeout(() => resolve(), 1000);
        });
        jobServiceApp = jobService.app;

        const profileService = new UserProfileService();
        await new Promise(resolve => {
            setTimeout(() => resolve(), 1000);
        });
        profileServiceApp = profileService.app;

        testCompanyId = uuidv4();
        testUserId = uuidv4();
    });

    test('should create a job and user profile, then apply for the job', async () => {
        // Create a job listing
        const jobData = {
            title: 'Senior Developer',
            description: 'Looking for experienced senior developers...',
            companyId: testCompanyId,
            location: 'San Francisco',
            employmentType: 'full-time',
            salaryMin: 120000,
            salaryMax: 160000,
            experienceLevel: 'senior'
        };

        const createJobResponse = await request(jobServiceApp)
            .post('/api/v1/jobs')
            .send(jobData)
            .set('Authorization', 'Bearer mock-token')
            .expect(201);

        expect(createJobResponse.body.title).toBe(jobData.title);
        testJobId = createJobResponse.body.id;

        // Create a user profile
        const profileData = {
            userId: testUserId,
            firstName: 'Jane',
            lastName: 'Smith',
            headline: 'Senior Software Engineer'
        };

        const createProfileResponse = await request(profileServiceApp)
            .post('/api/v1/profiles')
            .send(profileData)
            .set('Authorization', 'Bearer mock-token')
            .expect(201);

        expect(createProfileResponse.body.first_name).toBe(profileData.firstName);
        testProfileId = createProfileResponse.body.id;

        // Apply for the job from the job service
        const applicationData = {
            coverLetter: 'I have 8 years of experience in software development...'
        };

        const applyResponse = await request(jobServiceApp)
            .post(`/api/v1/jobs/${testJobId}/apply`)
            .send(applicationData)
            .set('Authorization', 'Bearer mock-token')
            .expect(201);

        expect(applyResponse.body.job_id).toBe(testJobId);
        expect(applyResponse.body.user_id).toBeDefined(); // Would be the authenticated user ID
    });
});