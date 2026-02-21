const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

// Mock the database manager
const mockDatabase = {
    query: jest.fn(),
    client: {
        query: jest.fn()
    }
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

const UserProfileService = require('../../backends/backend-enhanced/user-profile-service/enhanced-index');

describe('User Profile Service', () => {
    let service;
    let app;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new UserProfileService();
        app = service.app;
    });

    describe('GET /health', () => {
        test('should return health status', async () => {
            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body.status).toBe('healthy');
            expect(response.body.service).toBe('user-profile-service');
        });
    });

    describe('POST /api/v1/profiles', () => {
        test('should create a new user profile', async () => {
            const mockProfile = {
                userId: 'mock-user-id',
                firstName: 'John',
                lastName: 'Doe',
                headline: 'Software Developer',
                summary: 'Experienced software developer'
            };

            mockDatabase.query
                .mockResolvedValueOnce({ rows: [] }) // Check if profile exists
                .mockResolvedValueOnce({
                    rows: [{
                        id: uuidv4(),
                        user_id: mockProfile.userId,
                        first_name: mockProfile.firstName,
                        last_name: mockProfile.lastName,
                        headline: mockProfile.headline,
                        created_at: new Date().toISOString()
                    }]
                }); // Insert profile

            const response = await request(app)
                .post('/api/v1/profiles')
                .send(mockProfile)
                .expect(201);

            expect(response.body.first_name).toBe(mockProfile.firstName);
            expect(response.body.last_name).toBe(mockProfile.lastName);
        });

        test('should return 409 if profile already exists', async () => {
            const mockProfile = {
                userId: 'mock-user-id',
                firstName: 'John',
                lastName: 'Doe'
            };

            mockDatabase.query.mockResolvedValueOnce({
                rows: [{ id: uuidv4() }] // Profile already exists
            });

            const response = await request(app)
                .post('/api/v1/profiles')
                .send(mockProfile)
                .expect(409);

            expect(response.body.error).toBe('CONFLICT');
        });

        test('should return 400 for invalid request data', async () => {
            // Mock validation to fail
            const validateRequest = require('../../../shared/validation').validateRequest;
            validateRequest.mockReturnValueOnce({
                valid: false,
                errors: [{ message: 'First name is required' }]
            });

            const response = await request(app)
                .post('/api/v1/profiles')
                .send({})
                .expect(400);

            expect(response.body.error).toBe('VALIDATION_ERROR');
        });
    });

    describe('GET /api/v1/profiles/:id', () => {
        test('should return a user profile by ID', async () => {
            const profileId = uuidv4();
            const mockProfile = {
                id: profileId,
                user_id: 'mock-user-id',
                first_name: 'John',
                last_name: 'Doe',
                headline: 'Software Developer',
                summary: 'Experienced software developer',
                location: 'New York',
                industry: 'Technology',
                profile_picture: 'https://example.com/avatar.jpg',
                cover_photo: 'https://example.com/cover.jpg',
                social_links: { linkedin: 'https://linkedin.com/in/johndoe' },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            mockDatabase.query.mockResolvedValue({
                rows: [mockProfile]
            });

            const response = await request(app)
                .get(`/api/v1/profiles/${profileId}`)
                .expect(200);

            expect(response.body.id).toBe(profileId);
            expect(response.body.first_name).toBe(mockProfile.first_name);
        });

        test('should return 404 for non-existent profile', async () => {
            mockDatabase.query.mockResolvedValue({
                rows: []
            });

            const profileId = uuidv4();
            const response = await request(app)
                .get(`/api/v1/profiles/${profileId}`)
                .expect(404);

            expect(response.body.error).toBe('NOT_FOUND');
        });
    });

    describe('PUT /api/v1/profiles/:id', () => {
        test('should update a user profile', async () => {
            const profileId = uuidv4();
            const updateData = {
                firstName: 'Jane',
                lastName: 'Smith',
                headline: 'Senior Developer'
            };

            mockDatabase.query
                .mockResolvedValueOnce({
                    rows: [{ user_id: 'mock-user-id' }] // Profile ownership check
                })
                .mockResolvedValueOnce({
                    rows: [{
                        id: profileId,
                        user_id: 'mock-user-id',
                        first_name: updateData.firstName,
                        last_name: updateData.lastName,
                        headline: updateData.headline,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }]
                }); // Update profile

            const response = await request(app)
                .put(`/api/v1/profiles/${profileId}`)
                .send(updateData)
                .expect(200);

            expect(response.body.first_name).toBe(updateData.firstName);
            expect(response.body.last_name).toBe(updateData.lastName);
        });

        test('should return 403 if user does not own the profile', async () => {
            const profileId = uuidv4();
            const updateData = {
                firstName: 'Jane',
                lastName: 'Smith'
            };

            mockDatabase.query.mockResolvedValueOnce({
                rows: [{ user_id: 'different-user-id' }] // Different user owns the profile
            });

            const response = await request(app)
                .put(`/api/v1/profiles/${profileId}`)
                .send(updateData)
                .expect(403);

            expect(response.body.error).toBe('FORBIDDEN');
        });
    });

    describe('DELETE /api/v1/profiles/:id', () => {
        test('should delete a user profile', async () => {
            const profileId = uuidv4();

            mockDatabase.query
                .mockResolvedValueOnce({
                    rows: [{ user_id: 'mock-user-id' }] // Profile ownership check
                })
                .mockResolvedValueOnce({}); // Begin transaction
            mockDatabase.client.query
                .mockResolvedValueOnce({}) // Begin
                .mockResolvedValueOnce({}) // Delete profile
                .mockResolvedValueOnce({}) // Commit

            const response = await request(app)
                .delete(`/api/v1/profiles/${profileId}`)
                .expect(200);

            expect(response.body.message).toBe('User profile deleted successfully');
        });
    });

    describe('GET /api/v1/profiles/user/:userId', () => {
        test('should return a user profile by user ID', async () => {
            const userId = 'mock-user-id';
            const mockProfile = {
                id: uuidv4(),
                user_id: userId,
                first_name: 'John',
                last_name: 'Doe',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            mockDatabase.query.mockResolvedValue({
                rows: [mockProfile]
            });

            const response = await request(app)
                .get(`/api/v1/profiles/user/${userId}`)
                .expect(200);

            expect(response.body.user_id).toBe(userId);
            expect(response.body.first_name).toBe(mockProfile.first_name);
        });
    });

    describe('Skills Management', () => {
        test('should add a skill to a profile', async () => {
            const profileId = uuidv4();
            const skillData = {
                name: 'JavaScript',
                level: 'advanced'
            };

            mockDatabase.query
                .mockResolvedValueOnce({
                    rows: [{ user_id: 'mock-user-id' }] // Profile ownership check
                })
                .mockResolvedValueOnce({
                    rows: [{
                        id: uuidv4(),
                        profile_id: profileId,
                        name: skillData.name,
                        level: skillData.level,
                        created_at: new Date().toISOString()
                    }]
                }); // Insert skill

            const response = await request(app)
                .post(`/api/v1/profiles/${profileId}/skills`)
                .send(skillData)
                .expect(201);

            expect(response.body.name).toBe(skillData.name);
            expect(response.body.level).toBe(skillData.level);
        });

        test('should list skills for a profile', async () => {
            const profileId = uuidv4();
            const mockSkills = [{
                id: uuidv4(),
                profile_id: profileId,
                name: 'JavaScript',
                level: 'advanced',
                created_at: new Date().toISOString()
            }];

            mockDatabase.query.mockResolvedValue({
                rows: mockSkills
            });

            const response = await request(app)
                .get(`/api/v1/profiles/${profileId}/skills`)
                .expect(200);

            expect(response.body.skills).toHaveLength(1);
            expect(response.body.skills[0].name).toBe('JavaScript');
        });

        test('should update a skill', async () => {
            const skillId = uuidv4();
            const updateData = {
                name: 'Advanced JavaScript',
                level: 'expert'
            };

            mockDatabase.query
                .mockResolvedValueOnce({
                    rows: [{ user_id: 'mock-user-id' }] // Skill ownership check
                })
                .mockResolvedValueOnce({
                    rows: [{
                        id: skillId,
                        profile_id: uuidv4(),
                        name: updateData.name,
                        level: updateData.level,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }]
                }); // Update skill

            const response = await request(app)
                .put(`/api/v1/skills/${skillId}`)
                .send(updateData)
                .expect(200);

            expect(response.body.name).toBe(updateData.name);
            expect(response.body.level).toBe(updateData.level);
        });

        test('should delete a skill', async () => {
            const skillId = uuidv4();

            mockDatabase.query
                .mockResolvedValueOnce({
                    rows: [{ user_id: 'mock-user-id' }] // Skill ownership check
                })
                .mockResolvedValueOnce({
                    rows: [{ id: skillId }]
                }); // Delete skill

            const response = await request(app)
                .delete(`/api/v1/skills/${skillId}`)
                .expect(200);

            expect(response.body.message).toBe('Skill deleted successfully');
        });
    });

    describe('Experience Management', () => {
        test('should add an experience to a profile', async () => {
            const profileId = uuidv4();
            const experienceData = {
                company: 'Tech Corp',
                title: 'Software Engineer',
                startDate: '2020-01-01',
                endDate: '2023-01-01',
                description: 'Developed software applications'
            };

            mockDatabase.query
                .mockResolvedValueOnce({
                    rows: [{ user_id: 'mock-user-id' }] // Profile ownership check
                })
                .mockResolvedValueOnce({
                    rows: [{
                        id: uuidv4(),
                        profile_id: profileId,
                        company: experienceData.company,
                        title: experienceData.title,
                        start_date: experienceData.startDate,
                        end_date: experienceData.endDate,
                        is_current: false,
                        created_at: new Date().toISOString()
                    }]
                }); // Insert experience

            const response = await request(app)
                .post(`/api/v1/profiles/${profileId}/experiences`)
                .send(experienceData)
                .expect(201);

            expect(response.body.company).toBe(experienceData.company);
            expect(response.body.title).toBe(experienceData.title);
        });

        test('should list experiences for a profile', async () => {
            const profileId = uuidv4();
            const mockExperiences = [{
                id: uuidv4(),
                profile_id: profileId,
                company: 'Tech Corp',
                title: 'Software Engineer',
                start_date: '2020-01-01',
                end_date: '2023-01-01',
                is_current: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }];

            mockDatabase.query.mockResolvedValue({
                rows: mockExperiences
            });

            const response = await request(app)
                .get(`/api/v1/profiles/${profileId}/experiences`)
                .expect(200);

            expect(response.body.experiences).toHaveLength(1);
            expect(response.body.experiences[0].company).toBe('Tech Corp');
        });
    });

    describe('Education Management', () => {
        test('should add an education to a profile', async () => {
            const profileId = uuidv4();
            const educationData = {
                institution: 'University of Tech',
                degree: 'Bachelor of Science',
                fieldOfStudy: 'Computer Science',
                startDate: '2016-09-01',
                endDate: '2020-06-01'
            };

            mockDatabase.query
                .mockResolvedValueOnce({
                    rows: [{ user_id: 'mock-user-id' }] // Profile ownership check
                })
                .mockResolvedValueOnce({
                    rows: [{
                        id: uuidv4(),
                        profile_id: profileId,
                        institution: educationData.institution,
                        degree: educationData.degree,
                        field_of_study: educationData.fieldOfStudy,
                        start_date: educationData.startDate,
                        end_date: educationData.endDate,
                        created_at: new Date().toISOString()
                    }]
                }); // Insert education

            const response = await request(app)
                .post(`/api/v1/profiles/${profileId}/educations`)
                .send(educationData)
                .expect(201);

            expect(response.body.institution).toBe(educationData.institution);
            expect(response.body.degree).toBe(educationData.degree);
        });

        test('should list educations for a profile', async () => {
            const profileId = uuidv4();
            const mockEducations = [{
                id: uuidv4(),
                profile_id: profileId,
                institution: 'University of Tech',
                degree: 'Bachelor of Science',
                field_of_study: 'Computer Science',
                start_date: '2016-09-01',
                end_date: '2020-06-01',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }];

            mockDatabase.query.mockResolvedValue({
                rows: mockEducations
            });

            const response = await request(app)
                .get(`/api/v1/profiles/${profileId}/educations`)
                .expect(200);

            expect(response.body.educations).toHaveLength(1);
            expect(response.body.educations[0].institution).toBe('University of Tech');
        });
    });
});