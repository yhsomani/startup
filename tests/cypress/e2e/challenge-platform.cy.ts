// Challenge Platform Tests
describe('🏆 Challenge Platform Tests', () => {
  let challengeId: string;
  let studentToken: string;
  let instructorToken: string;

  beforeEach(() => {
    // Setup test users
    cy.registerUser({ email: 'student.challenge@example.com', role: 'STUDENT' }).then((response) => {
      studentToken = response.token;
      localStorage.setItem('authToken', studentToken);
    });
  });

  it('should browse available challenges', () => {
    cy.visit('/challenges');
    
    // Verify challenge listing
    cy.get('[data-cy=challenge-list]').should('be.visible');
    cy.get('[data-cy=challenge-card]').should('have.length.greaterThan', 0);
    
    // Check challenge cards display required information
    cy.get('[data-cy=challenge-card]').first().within(() => {
      cy.get('[data-cy=challenge-title]').should('be.visible');
      cy.get('[data-cy=challenge-difficulty]').should('be.visible');
      cy.get('[data-cy=challenge-submissions]').should('be.visible');
      cy.get('[data-cy=challenge-success-rate]').should('be.visible');
    });
    
    // Test filtering and sorting
    cy.get('[data-cy=difficulty-filter]').select('medium');
    cy.get('[data-cy=sort-by]').select('popularity');
    cy.get('[data-cy=apply-filters]').click();
  });

  it('should create a new challenge as instructor', () => {
    cy.loginAsInstructor('instructor@example.com', 'InstructorPass123!');
    
    cy.visit('/challenges/create');
    
    // Fill challenge creation form
    cy.get('[data-cy=challenge-title]').type('Binary Search Algorithm');
    cy.get('[data-cy=challenge-description]').type('Implement an efficient binary search algorithm');
    cy.get('[data-cy=evaluation-metric]').select('accuracy');
    cy.get('[data-cy=passing-score]').type('70');
    cy.get('[data-cy=programming-language]').select('python');
    
    // Add test cases
    cy.get('[data-cy=add-test-case]').click();
    cy.get('[data-cy=test-case-input]').type('[1, 2, 3, 4, 5]');
    cy.get('[data-cy=test-case-target]').type('3');
    cy.get('[data-cy=test-case-expected]').type('2');
    
    cy.get('[data-cy=add-test-case]').click();
    cy.get('[data-cy=test-case-input]').eq(1).type('[1, 3, 5, 7, 9]');
    cy.get('[data-cy=test-case-target]').eq(1).type('6');
    cy.get('[data-cy=test-case-expected]').eq(1).type('-1');
    
    // Create challenge
    cy.get('[data-cy=create-challenge]').click();
    
    // Verify creation success
    cy.get('[data-cy=success-message]').should('contain', 'Challenge created successfully');
    cy.url().should('include', '/challenges/');
    
    // Get challenge ID from URL
    cy.url().then((url) => {
      challengeId = url.split('/').pop() || '';
    });
  });

  it('should view challenge details', () => {
    cy.visit('/challenges');
    cy.get('[data-cy=challenge-card]').first().click();
    
    // Verify challenge detail page
    cy.get('[data-cy=challenge-title]').should('be.visible');
    cy.get('[data-cy=challenge-description]').should('be.visible');
    cy.get('[data-cy=challenge-rules]').should('be.visible');
    cy.get('[data-cy=challenge-constraints]').should('be.visible');
    cy.get('[data-cy=challenge-examples]').should('be.visible');
    cy.get('[data-cy=challenge-test-cases]').should('be.visible');
    
    // Check metadata
    cy.get('[data-cy=challenge-difficulty]').should('be.visible');
    cy.get('[data-cy=challenge-time-limit]').should('be.visible');
    cy.get('[data-cy=challenge-memory-limit]').should('be.visible');
    cy.get('[data-cy=challenge-submission-count]').should('be.visible');
  });

  it('should use the code editor', () => {
    cy.visit(`/challenges/${challengeId}`);
    
    // Open code editor
    cy.get('[data-cy=code-editor]').should('be.visible');
    cy.get('[data-cy=language-selector]').should('be.visible');
    cy.get('[data-cy=code-template]').should('be.visible');
    
    // Write code
    const sampleCode = `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1`;
    
    cy.get('[data-cy=code-input]').type(sampleCode, { parseSpecialCharSequences: false });
    
    // Test editor features
    cy.get('[data-cy=line-numbers]').should('be.visible');
    cy.get('[data-cy=syntax-highlighting]').should('be.visible');
    cy.get('[data-cy=auto-complete]').should('exist');
    
    // Change language
    cy.get('[data-cy=language-selector]').select('javascript');
    cy.get('[data-cy=code-input]').should('contain.value', 'function binarySearch');
  });

  it('should run code tests', () => {
    cy.visit(`/challenges/${challengeId}`);
    
    // Write solution
    cy.get('[data-cy=code-input]').type(`def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1`);
    
    // Run tests
    cy.get('[data-cy=run-tests]').click();
    
    // Wait for test results
    cy.get('[data-cy=test-results]').should('be.visible');
    cy.get('[data-cy=test-output]').should('be.visible');
    
    // Verify test results
    cy.get('[data-cy=test-status]').should('contain', 'Passed');
    cy.get('[data-cy=test-score]').should('contain', '100%');
    cy.get('[data-cy=execution-time]').should('be.visible');
    cy.get('[data-cy=memory-usage]').should('be.visible');
  });

  it('should submit a solution', () => {
    cy.visit(`/challenges/${challengeId}`);
    
    // Write complete solution
    cy.get('[data-cy=code-input]').type(`def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1`);
    
    // Submit solution
    cy.get('[data-cy=submit-solution]').click();
    
    // Confirm submission
    cy.get('[data-cy=submit-modal]').should('be.visible');
    cy.get('[data-cy=confirm-submit]').click();
    
    // Verify submission queued
    cy.get('[data-cy=submission-queued]').should('contain', 'Solution submitted for evaluation');
    
    // Check submission status
    cy.get('[data-cy=submission-status]').should('contain', 'Evaluating...');
  });

  it('should view submission results', () => {
    // Wait for submission to be graded (mock)
    cy.intercept('GET', `/api/v1/challenges/${challengeId}/submissions/*`, {
      statusCode: 200,
      body: {
        id: 'test-submission-id',
        status: 'passed',
        score: 95.0,
        feedback: 'Excellent solution! Efficient implementation.',
        gradedAt: new Date().toISOString()
      }
    }).as('submissionResults');

    cy.visit(`/challenges/${challengeId}/submissions`);
    
    // View submission details
    cy.get('[data-cy=submission-card]').first().click();
    cy.get('[data-cy=submission-details]').should('be.visible');
    
    // Verify results
    cy.get('[data-cy=submission-score]').should('contain', '95');
    cy.get('[data-cy=submission-status]').should('contain', 'Passed');
    cy.get('[data-cy=submission-feedback]').should('contain', 'Excellent solution');
    cy.get('[data-cy=submission-time]').should('be.visible');
  });

  it('should display challenge leaderboard', () => {
    cy.visit(`/challenges/${challengeId}/leaderboard`);
    
    // Verify leaderboard
    cy.get('[data-cy=leaderboard]').should('be.visible');
    cy.get('[data-cy=leaderboard-entries]').should('have.length.greaterThan', 0);
    
    // Check leaderboard structure
    cy.get('[data-cy=leaderboard-entry]').first().within(() => {
      cy.get('[data-cy=rank]').should('contain', '1');
      cy.get('[data-cy=username]').should('be.visible');
      cy.get('[data-cy=best-score]').should('be.visible');
      cy.get('[data-cy=submission-count]').should('be.visible');
      cy.get('[data-cy=submission-time]').should('be.visible');
    });
    
    // Test leaderboard filtering
    cy.get('[data-cy=leaderboard-filter]').select('this-week');
    cy.get('[data-cy=leaderboard-entries]').should('be.visible');
  });

  it('should provide learning resources', () => {
    cy.visit(`/challenges/${challengeId}`);
    
    // Check for learning resources
    cy.get('[data-cy=learning-resources]').should('be.visible');
    cy.get('[data-cy=tutorial-links]').should('have.length.greaterThan', 0);
    cy.get('[data-cy=related-challenges]').should('be.visible');
    
    // Click on tutorial
    cy.get('[data-cy=tutorial-link]').first().click();
    cy.url().should('include', '/tutorials/');
  });

  it('should handle challenge hints', () => {
    cy.visit(`/challenges/${challengeId}`);
    
    // Request hint
    cy.get('[data-cy=get-hint]').click();
    cy.get('[data-cy=hint-modal]').should('be.visible');
    cy.get('[data-cy=hint-content]').should('be.visible');
    
    // Multiple hints
    cy.get('[data-cy=next-hint]').click();
    cy.get('[data-cy=hint-number]').should('contain', '2');
    cy.get('[data-cy=hint-content]').should('not.equal', cy.get('[data-cy=hint-content]').first());
    
    // Track hint usage
    cy.get('[data-cy=hints-used]').should('contain', '2');
  });

  it('should support peer collaboration', () => {
    cy.visit(`/challenges/${challengeId}`);
    
    // Start collaboration session
    cy.get('[data-cy=collaborate-button]').click();
    cy.get('[data-cy=session-modal]').should('be.visible');
    
    // Create session
    cy.get('[data-cy=session-name]').type('Binary Search Study Group');
    cy.get('[data-cy=max-participants]').type('4');
    cy.get('[data-cy=create-session]').click();
    
    // Verify session created
    cy.get('[data-cy=collaboration-room]').should('be.visible');
    cy.get('[data-cy=session-id]').should('be.visible');
    cy.get('[data-cy=share-link]').should('be.visible');
    
    // Invite collaborators
    cy.get('[data-cy=copy-link]').click();
    cy.get('[data-cy=link-copied]').should('be.visible');
  });

  it('should track challenge statistics', () => {
    cy.visit('/challenges');
    
    // Check overall statistics
    cy.get('[data-cy=platform-stats]').should('be.visible');
    cy.get('[data-cy=total-challenges]').should('be.visible');
    cy.get('[data-cy=total-submissions]').should('be.visible');
    cy.get('[data-cy=active-users]').should('be.visible');
    
    // Check personal statistics
    cy.loginUser('student.challenge@example.com', 'SecurePassword123!');
    cy.visit('/profile/challenges');
    
    cy.get('[data-cy=user-stats]').should('be.visible');
    cy.get('[data-cy=solved-challenges]').should('be.visible');
    cy.get('[data-cy=completion-rate]').should('be.visible');
    cy.get('[data-cy=average-score]').should('be.visible');
    cy.get('[data-cy=streak-count]').should('be.visible');
  });
});