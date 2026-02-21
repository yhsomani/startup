// Authentication Flow Tests
describe('🔐 Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should register a new student user', () => {
    cy.get('[data-cy=register-link]').click();
    
    // Fill registration form
    cy.get('[data-cy=email-input]').type(`student.${Date.now()}@example.com`);
    cy.get('[data-cy=password-input]').type('SecurePassword123!');
    cy.get('[data-cy=confirm-password-input]').type('SecurePassword123!');
    cy.get('[data-cy=first-name-input]').type('Test');
    cy.get('[data-cy=last-name-input]').type('Student');
    cy.get('[data-cy=role-select]').select('STUDENT');
    
    // Submit form
    cy.get('[data-cy=register-button]').click();
    
    // Verify successful registration
    cy.url().should('include', '/dashboard');
    cy.get('[data-cy=welcome-message]').should('contain', 'Welcome to TalentSphere');
    cy.get('[data-cy=user-email]').should('contain', '@example.com');
  });

  it('should register a new instructor user', () => {
    cy.get('[data-cy=register-link]').click();
    
    // Fill registration form
    cy.get('[data-cy=email-input]').type(`instructor.${Date.now()}@example.com`);
    cy.get('[data-cy=password-input]').type('InstructorPass123!');
    cy.get('[data-cy=confirm-password-input]').type('InstructorPass123!');
    cy.get('[data-cy=first-name-input]').type('Test');
    cy.get('[data-cy=last-name-input]').type('Instructor');
    cy.get('[data-cy=role-select]').select('INSTRUCTOR');
    
    // Submit form
    cy.get('[data-cy=register-button]').click();
    
    // Verify successful registration
    cy.url().should('include', '/instructor-dashboard');
    cy.get('[data-cy=instructor-welcome]').should('contain', 'Instructor Dashboard');
  });

  it('should login with valid credentials', () => {
    // First register a user
    cy.registerUser({
      email: 'test.login@example.com',
      password: 'LoginTest123!',
      firstName: 'Login',
      lastName: 'User'
    }).as('registeredUser');

    // Then login
    cy.visit('/login');
    cy.get('[data-cy=email-input]').type('test.login@example.com');
    cy.get('[data-cy=password-input]').type('LoginTest123!');
    cy.get('[data-cy=login-button]').click();
    
    // Verify successful login
    cy.url().should('include', '/dashboard');
    cy.get('[data-cy=user-menu]').should('be.visible');
    
    // Verify JWT token is stored
    cy.window().then((win) => {
      expect(win.localStorage.getItem('authToken')).to.exist;
    });
  });

  it('should reject invalid credentials', () => {
    cy.visit('/login');
    cy.get('[data-cy=email-input]').type('invalid@example.com');
    cy.get('[data-cy=password-input]').type('wrongpassword');
    cy.get('[data-cy=login-button]').click();
    
    // Verify error message
    cy.get('[data-cy=error-message]').should('contain', 'Invalid email or password');
    cy.url().should('include', '/login');
  });

  it('should handle password reset flow', () => {
    cy.visit('/forgot-password');
    
    // Request password reset
    cy.get('[data-cy=email-input]').type('test@example.com');
    cy.get('[data-cy=reset-button]').click();
    
    // Verify success message (always shown for security)
    cy.get('[data-cy=success-message]').should('contain', 'password reset link has been sent');
  });

  it('should validate form inputs', () => {
    cy.visit('/register');
    
    // Test email validation
    cy.get('[data-cy=email-input]').type('invalid-email');
    cy.get('[data-cy=register-button]').click();
    cy.get('[data-cy=email-error]').should('contain', 'valid email');
    
    // Test password validation
    cy.get('[data-cy=email-input]').clear().type('valid@example.com');
    cy.get('[data-cy=password-input]').type('123');
    cy.get('[data-cy=register-button]').click();
    cy.get('[data-cy=password-error]').should('contain', 'at least 8 characters');
    
    // Test password match validation
    cy.get('[data-cy=password-input]').clear().type('ValidPassword123!');
    cy.get('[data-cy=confirm-password-input]').type('DifferentPassword');
    cy.get('[data-cy=register-button]').click();
    cy.get('[data-cy=confirm-password-error]').should('contain', 'do not match');
  });
});