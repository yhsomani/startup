// Custom commands implementation
import { v4 as uuidv4 } from 'uuid';

Cypress.Commands.add('registerUser', (userData: Partial<UserData>) => {
  const defaultData: UserData = {
    email: `test.user.${uuidv4()}@example.com`,
    password: 'SecurePassword123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'STUDENT',
    ...userData
  };

  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/register`,
    body: defaultData,
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => {
    expect(response.status).to.equal(201);
    expect(response.body.token).to.exist;
    expect(response.body.user.email).to.equal(defaultData.email);
    
    // Store token for future use
    cy.wrap(response.body).as('authResponse');
    return cy.wrap(response.body);
  });
});

Cypress.Commands.add('loginUser', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { email, password },
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((response) => {
    expect(response.status).to.equal(200);
    expect(response.body.token).to.exist;
    
    // Store token in localStorage
    localStorage.setItem('authToken', response.body.token);
    
    return cy.wrap(response.body);
  });
});

Cypress.Commands.add('loginAsInstructor', (email?: string, password?: string) => {
  const defaultEmail = email || 'instructor@example.com';
  const defaultPassword = password || 'InstructorPass123!';
  
  cy.loginUser(defaultEmail, defaultPassword);
});

Cypress.Commands.add('loginAsAdmin', (email?: string, password?: string) => {
  const defaultEmail = email || 'admin@example.com';
  const defaultPassword = password || 'AdminPass123!';
  
  cy.loginUser(defaultEmail, defaultPassword);
});

Cypress.Commands.add('createCourse', (courseData: Partial<CourseData>) => {
  const defaultData: CourseData = {
    title: `Test Course ${uuidv4()}`,
    subtitle: 'A test course for E2E testing',
    description: 'This is a comprehensive test course created for end-to-end testing purposes.',
    price: 99.99,
    currency: 'USD',
    thumbnailUrl: 'https://example.com/course-thumbnail.jpg',
    isPublished: true,
    ...courseData
  };

  // Get auth token
  const token = localStorage.getItem('authToken');
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/courses`,
    body: defaultData,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }).then((response) => {
    expect(response.status).to.be.oneOf([200, 201]);
    return cy.wrap(response.body);
  });
});

Cypress.Commands.add('createChallenge', (challengeData: Partial<ChallengeData>) => {
  const defaultData: ChallengeData = {
    title: `Test Challenge ${uuidv4()}`,
    description: 'Test challenge for E2E testing',
    evaluationMetric: 'accuracy',
    passingScore: 70.0,
    testCases: [
      {
        input: [1, 2, 3, 4, 5],
        target: 3,
        expected: 2
      },
      {
        input: [1, 3, 5, 7, 9],
        target: 6,
        expected: -1
      }
    ],
    language: 'python',
    ...challengeData
  };

  const token = localStorage.getItem('authToken');
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/challenges/`,
    body: defaultData,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }).then((response) => {
    expect(response.status).to.equal(201);
    return cy.wrap(response.body);
  });
});

Cypress.Commands.add('submitChallengeSolution', (challengeId: string, code: string) => {
  const token = localStorage.getItem('authToken');
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/challenges/${challengeId}/submit`,
    body: {
      file: {
        name: 'solution.py',
        content: code
      }
    },
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then((response) => {
    expect(response.status).to.equal(202);
    return cy.wrap(response.body);
  });
});

Cypress.Commands.add('getUserGamification', (userId: string) => {
  const token = localStorage.getItem('authToken');
  
  cy.request({
    method: 'GET',
    url: `${Cypress.env('gamificationUrl')}/users/${userId}/streaks`,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then((response) => {
    expect(response.status).to.equal(200);
    return cy.wrap(response.body);
  });
});

Cypress.Commands.add('searchCandidates', (criteria: CandidateSearchCriteria) => {
  const token = localStorage.getItem('authToken');
  
  cy.request({
    method: 'GET',
    url: `${Cypress.env('recruitmentUrl')}/candidates/search`,
    qs: criteria,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then((response) => {
    expect(response.status).to.equal(200);
    return cy.wrap(response.body.candidates);
  });
});

Cypress.Commands.add('createCollaborationSession', (sessionData: Partial<CollaborationSessionData>) => {
  const defaultData: CollaborationSessionData = {
    name: `Test Session ${uuidv4()}`,
    type: 'coding_study',
    maxParticipants: 4,
    settings: {
      allowCodeSharing: true,
      enableChat: true,
      autoSave: true,
      language: 'python'
    },
    ...sessionData
  };

  const token = localStorage.getItem('authToken');
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('collaborationUrl')}/sessions`,
    body: defaultData,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }).then((response) => {
    expect(response.status).to.equal(200);
    return cy.wrap(response.body);
  });
});

Cypress.Commands.add('connectWebSocket', (url: string) => {
  // Note: Cypress doesn't natively support WebSocket testing
  // This is a mock implementation that would be expanded with cy.intercept
  cy.window().then((win) => {
    const ws = new win.WebSocket(url);
    cy.wrap(ws);
  });
});

Cypress.Commands.add('waitForWebSocketMessage', (eventType: string) => {
  // Mock implementation for WebSocket message waiting
  cy.wait(1000).then(() => {
    cy.wrap({ type: eventType, data: 'mock data' });
  });
});

Cypress.Commands.add('checkServiceHealth', (serviceName: string) => {
  const serviceUrls = {
    'auth': `${Cypress.env('apiUrl')}/auth/health`,
    'core': `${Cypress.env('apiUrl')}/health`,
    'assistant': `${Cypress.env('assistantUrl')}/health`,
    'recruitment': `${Cypress.env('recruitmentUrl').replace('/api/v1', '')}/health`,
    'gamification': `${Cypress.env('gamificationUrl')}/health`,
    'collaboration': `${Cypress.env('collaborationUrl')}/health`
  };

  const url = serviceUrls[serviceName] || serviceUrls['core'];
  
  cy.request({
    method: 'GET',
    url: url,
    failOnStatusCode: false
  }).then((response) => {
    const isHealthy = response.status === 200 && response.body.status === 'healthy';
    return cy.wrap(isHealthy);
  });
});

Cypress.Commands.add('mockAIAssistantResponse', (message: string) => {
  cy.intercept('POST', `${Cypress.env('assistantUrl')}/assistant/chat`, {
    statusCode: 200,
    body: {
      response: message,
      source: 'mock-ai-model',
      mode: 'MOCK',
      timestamp: new Date().toISOString()
    }
  }).as('aiAssistantMock');
});

// Global setup and teardown
beforeEach(() => {
  // Clear localStorage before each test
  localStorage.clear();
  
  // Set up common interceptors
  cy.intercept('POST', `${Cypress.env('apiUrl')}/auth/login`).as('loginRequest');
  cy.intercept('POST', `${Cypress.env('apiUrl')}/auth/register`).as('registerRequest');
  cy.intercept('GET', `${Cypress.env('apiUrl')}/courses`).as('getCourses');
  cy.intercept('GET', `${Cypress.env('apiUrl')}/challenges/`).as('getChallenges');
});

afterEach(() => {
  // Clean up any test data
  cy.window().then((win) => {
    win.sessionStorage.clear();
  });
});