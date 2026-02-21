// Course Learning Journey Tests
describe('📚 Course Learning Journey', () => {
  let courseId: string;
  let studentToken: string;
  let instructorToken: string;

  beforeEach(() => {
    // Setup test data
    cy.registerUser({ email: 'student.course@example.com', role: 'STUDENT' }).then((response) => {
      studentToken = response.token;
      localStorage.setItem('authToken', studentToken);
    });
  });

  it('should browse available courses', () => {
    cy.visit('/courses');
    
    // Verify course listing page loads
    cy.get('[data-cy=course-list]').should('be.visible');
    cy.get('[data-cy=course-card]').should('have.length.greaterThan', 0);
    
    // Test search functionality
    cy.get('[data-cy=search-input]').type('JavaScript');
    cy.get('[data-cy=search-button]').click();
    cy.get('[data-cy=course-card]').each(($card) => {
      cy.wrap($card).should('contain', 'JavaScript');
    });
    
    // Test filtering
    cy.get('[data-cy=price-filter]').select('free');
    cy.get('[data-cy=filter-button]').click();
    cy.url().should('include', 'price=free');
  });

  it('should view course details', () => {
    cy.visit('/courses');
    cy.get('[data-cy=course-card]').first().click();
    
    // Verify course details page
    cy.get('[data-cy=course-title]').should('be.visible');
    cy.get('[data-cy=course-description]').should('be.visible');
    cy.get('[data-cy=course-instructor]').should('be.visible');
    cy.get('[data-cy=course-price]').should('be.visible');
    
    // Check course content structure
    cy.get('[data-cy=course-sections]').should('be.visible');
    cy.get('[data-cy=course-lessons]').should('have.length.greaterThan', 0);
  });

  it('should enroll in a course', () => {
    // First create a course as instructor
    cy.loginAsInstructor('instructor@example.com', 'InstructorPass123!');
    
    cy.createCourse({
      title: 'JavaScript Fundamentals',
      description: 'Learn the basics of JavaScript programming',
      price: 49.99,
      isPublished: true
    }).then((course) => {
      courseId = course.id;
    });

    // Logout and login as student
    cy.visit('/logout');
    cy.loginUser('student.course@example.com', 'SecurePassword123!');
    
    // Visit course and enroll
    cy.visit(`/courses/${courseId}`);
    cy.get('[data-cy=enroll-button]').click();
    
    // Confirm enrollment
    cy.get('[data-cy=enroll-modal]').should('be.visible');
    cy.get('[data-cy=confirm-enroll]').click();
    
    // Verify enrollment success
    cy.get('[data-cy=enrollment-success]').should('contain', 'successfully enrolled');
    cy.get('[data-cy=enroll-button]').should('not.exist');
    cy.get('[data-cy=start-learning]').should('be.visible');
  });

  it('should progress through course lessons', () => {
    // Login and go to enrolled course
    cy.loginUser('student.course@example.com', 'SecurePassword123!');
    cy.visit(`/courses/${courseId}`);
    cy.get('[data-cy=start-learning]').click();
    
    // Navigate through first lesson
    cy.get('[data-cy=lesson-item]').first().click();
    cy.get('[data-cy=lesson-content]').should('be.visible');
    
    // Mark lesson as complete
    cy.get('[data-cy=complete-lesson]').click();
    cy.get('[data-cy=lesson-item]').first().should('have.class', 'completed');
    
    // Progress to next lesson
    cy.get('[data-cy=next-lesson]').click();
    cy.get('[data-cy=lesson-progress]').should('contain', '50%');
  });

  it('should handle video lesson playback', () => {
    cy.visit(`/courses/${courseId}/lessons`);
    cy.get('[data-cy=lesson-item]').contains('Video').first().click();
    
    // Verify video player
    cy.get('[data-cy=video-player]').should('be.visible');
    cy.get('[data-cy=play-button]').should('be.visible');
    
    // Test video controls
    cy.get('[data-cy=play-button]').click();
    cy.get('[data-cy=pause-button]').should('be.visible');
    
    // Test progress tracking
    cy.wait(2000);
    cy.get('[data-cy=video-progress]').should('exist');
  });

  it('should complete quiz lessons', () => {
    cy.visit(`/courses/${courseId}/lessons`);
    cy.get('[data-cy=lesson-item]').contains('Quiz').first().click();
    
    // Answer quiz questions
    cy.get('[data-cy=quiz-question]').first().should('be.visible');
    cy.get('[data-cy=quiz-option]').first().click();
    cy.get('[data-cy=submit-quiz]').click();
    
    // View results
    cy.get('[data-cy=quiz-results]').should('be.visible');
    cy.get('[data-cy=quiz-score]').should('contain', '%');
    
    // If passing, mark complete
    if (cy.get('[data-cy=quiz-score]').invoke('text').then((score) => {
      const numericScore = parseInt(score.toString().replace('%', ''));
      if (numericScore >= 70) {
        cy.get('[data-cy=continue-course]').click();
      }
    }));
  });

  it('should track course progress', () => {
    cy.visit(`/courses/${courseId}`);
    
    // Check progress indicators
    cy.get('[data-cy=course-progress]').should('be.visible');
    cy.get('[data-cy=completed-lessons]').should('exist');
    cy.get('[data-cy=total-lessons]').should('exist');
    cy.get('[data-cy=progress-percentage]').should('contain', '%');
    
    // View detailed progress
    cy.get('[data-cy=view-progress]').click();
    cy.get('[data-cy=progress-chart]').should('be.visible');
    cy.get('[data-cy=time-spent]').should('contain', 'hours');
  });

  it('should provide course certificate', () => {
    // Complete all lessons (mock)
    cy.window().then((win) => {
      // Mock API response for completed course
      cy.intercept('GET', `/api/v1/courses/${courseId}/progress`, {
        statusCode: 200,
        body: {
          completed: true,
          completedAt: new Date().toISOString(),
          score: 85
        }
      });
    });

    cy.visit(`/courses/${courseId}`);
    
    // Check for certificate availability
    cy.get('[data-cy=certificate-button]').should('be.visible');
    cy.get('[data-cy=certificate-button]').click();
    
    // Verify certificate display
    cy.get('[data-cy=certificate]').should('be.visible');
    cy.get('[data-cy=certificate-name]').should('contain', 'JavaScript Fundamentals');
    cy.get('[data-cy=certificate-student]').should('contain', 'Test Student');
    cy.get('[data-cy=certificate-date]').should('contain', new Date().getFullYear());
    
    // Test certificate download
    cy.get('[data-cy=download-certificate]').click();
    cy.verifyDownload('.pdf');
  });

  it('should provide course recommendations', () => {
    cy.visit('/courses');
    
    // Check recommended courses section
    cy.get('[data-cy=recommended-courses]').should('be.visible');
    cy.get('[data-cy=recommended-card]').should('have.length.greaterThan', 0);
    
    // Click on recommended course
    cy.get('[data-cy=recommended-card]').first().click();
    cy.url().should('include', '/courses/');
  });

  it('should handle course reviews', () => {
    cy.visit(`/courses/${courseId}`);
    
    // Check if user can leave review (after completing)
    cy.get('[data-cy=course-reviews]').should('be.visible');
    cy.get('[data-cy=review-count]').should('exist');
    
    // If eligible to review
    cy.get('[data-cy=write-review]').click();
    cy.get('[data-cy=review-modal]').should('be.visible');
    
    // Submit review
    cy.get('[data-cy=review-rating]').click();
    cy.get('[data-cy=review-text]').type('Great course! Very informative and well-structured.');
    cy.get('[data-cy=submit-review]').click();
    
    // Verify review submission
    cy.get('[data-cy=review-success]').should('contain', 'Review submitted');
    cy.get('[data-cy=user-review]').should('be.visible');
  });
});