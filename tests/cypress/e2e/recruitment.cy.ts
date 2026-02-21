// Recruitment and Job Application Tests
describe('💼 Recruitment Platform Tests', () => {
  let candidateToken: string;
  let recruiterToken: string;
  let jobId: string;

  beforeEach(() => {
    // Setup test users
    cy.registerUser({ 
      email: 'candidate@example.com', 
      role: 'STUDENT',
      firstName: 'Test',
      lastName: 'Candidate'
    }).then((response) => {
      candidateToken = response.token;
      localStorage.setItem('authToken', candidateToken);
    });
  });

  it('should search for candidates as recruiter', () => {
    cy.loginUser('recruiter@example.com', 'RecruiterPass123!');
    cy.visit('/recruitment/candidates');
    
    // Use candidate search
    cy.get('[data-cy=search-candidates]').should('be.visible');
    cy.get('[data-cy=skill-search]').type('JavaScript');
    cy.get('[data-cy=min-percentile]').type('75');
    cy.get('[data-cy=search-button]').click();
    
    // Verify search results
    cy.get('[data-cy=candidate-list]').should('be.visible');
    cy.get('[data-cy=candidate-card]').should('have.length.greaterThan', 0);
    
    // Check candidate information
    cy.get('[data-cy=candidate-card]').first().within(() => {
      cy.get('[data-cy=candidate-name]').should('be.visible');
      cy.get('[data-cy=candidate-skills]').should('be.visible');
      cy.get('[data-cy=candidate-percentile]').should('be.visible');
      cy.get('[data-cy=view-profile]').should('be.visible');
    });
  });

  it('should view candidate profiles and verified resumes', () => {
    cy.loginUser('recruiter@example.com', 'RecruiterPass123!');
    cy.visit('/recruitment/candidates');
    
    // View candidate details
    cy.get('[data-cy=candidate-card]').first().click();
    cy.get('[data-cy=candidate-profile]').should('be.visible');
    
    // Check profile sections
    cy.get('[data-cy=contact-info]').should('be.visible');
    cy.get('[data-cy=skills-section]').should('be.visible');
    cy.get('[data-cy=experience-section]').should('be.visible');
    cy.get('[data-cy=education-section]').should('be.visible');
    
    // View verified resume
    cy.get('[data-cy=verified-resume]').click();
    cy.get('[data-cy=resume-modal]').should('be.visible');
    cy.get('[data-cy=verification-badge]').should('contain', 'Verified');
    cy.get('[data-cy=verification-date]').should('be.visible');
    cy.get('[data-cy=download-resume]').should('be.visible');
  });

  it('should post job listings as recruiter', () => {
    cy.loginUser('recruiter@example.com', 'RecruiterPass123!');
    cy.visit('/recruitment/jobs/create');
    
    // Fill job posting form
    cy.get('[data-cy=job-title]').type('Senior Full-Stack Developer');
    cy.get('[data-cy=company-name]').type('TechCorp Solutions');
    cy.get('[data-cy=location]').type('San Francisco, CA');
    cy.get('[data-cy=remote-option]').check();
    
    // Job details
    cy.get('[data-cy=job-description]').type('We are looking for an experienced full-stack developer...');
    cy.get('[data-cy=requirements]').type('5+ years of experience with React and Node.js...');
    cy.get('[data-cy=responsibilities]').type('Develop and maintain web applications...');
    
    // Compensation
    cy.get('[data-cy=salary-min]').type('120000');
    cy.get('[data-cy=salary-max]').type('180000');
    cy.get('[data-cy=currency]').select('USD');
    cy.get('[data-cy=pay-period]').select('yearly');
    
    // Required skills
    cy.get('[data-cy=add-skill]').click();
    cy.get('[data-cy=skill-input]').type('JavaScript');
    cy.get('[data-cy=skill-level]').select('advanced');
    cy.get('[data-cy=skill-years]').type('5');
    cy.get('[data-cy=save-skill]').click();
    
    // Post job
    cy.get('[data-cy=preview-job]').click();
    cy.get('[data-cy=confirm-post]').click();
    
    // Verify job posted
    cy.get('[data-cy=success-message]').should('contain', 'Job posted successfully');
    cy.url().should('include', '/recruitment/jobs/');
    
    // Get job ID
    cy.url().then((url) => {
      jobId = url.split('/').pop() || '';
    });
  });

  it('should browse job listings as candidate', () => {
    cy.loginUser('candidate@example.com', 'CandidatePass123!');
    cy.visit('/jobs');
    
    // Verify job listing
    cy.get('[data-cy=job-list]').should('be.visible');
    cy.get('[data-cy=job-card]').should('have.length.greaterThan', 0);
    
    // Check job card information
    cy.get('[data-cy=job-card]').first().within(() => {
      cy.get('[data-cy=job-title]').should('be.visible');
      cy.get('[data-cy=company-name]').should('be.visible');
      cy.get('[data-cy=location]').should('be.visible');
      cy.get('[data-cy=salary-range]').should('be.visible');
      cy.get('[data-cy=posted-date]').should('be.visible');
      cy.get('[data-cy=remote-indicator]').should('be.visible');
    });
    
    // Test search and filtering
    cy.get('[data-cy=keyword-search]').type('JavaScript');
    cy.get('[data-cy=location-filter]').type('San Francisco');
    cy.get('[data-cy=remote-filter]').check();
    cy.get('[data-cy=apply-filters]').click();
  });

  it('should view job details and requirements', () => {
    cy.loginUser('candidate@example.com', 'CandidatePass123!');
    cy.visit(`/jobs/${jobId}`);
    
    // Verify job detail page
    cy.get('[data-cy=job-details]').should('be.visible');
    cy.get('[data-cy=job-title]').should('contain', 'Senior Full-Stack Developer');
    cy.get('[data-cy=company-info]').should('be.visible');
    cy.get('[data-cy=job-description]').should('be.visible');
    cy.get('[data-cy=requirements]').should('be.visible');
    cy.get('[data-cy=responsibilities]').should('be.visible');
    cy.get('[data-cy=benefits]').should('be.visible');
    
    // Check compensation details
    cy.get('[data-cy=compensation]').should('be.visible');
    cy.get('[data-cy=salary-info]').should('contain', '$120,000 - $180,000');
    cy.get('[data-cy=equity-options]').should('be.visible');
    
    // Application requirements
    cy.get('[data-cy=application-requirements]').should('be.visible');
    cy.get('[data-cy=required-skills]').should('have.length.greaterThan', 0);
    cy.get('[data-cy=experience-level]').should('be.visible');
  });

  it('should submit job applications', () => {
    cy.loginUser('candidate@example.com', 'CandidatePass123!');
    cy.visit(`/jobs/${jobId}`);
    
    // Start application
    cy.get('[data-cy=apply-button]').click();
    cy.get('[data-cy=application-form]').should('be.visible');
    
    // Application information
    cy.get('[data-cy=cover-letter]').type('I am excited to apply for this position...');
    cy.get('[data-cy=expected-salary]').type('150000');
    cy.get('[data-cy=availability]').select('immediately');
    cy.get('[data-cy=work-authorization]').select('citizen');
    
    // Resume upload
    cy.get('[data-cy=resume-upload]').attachFile('resume.pdf');
    cy.get('[data-cy=resume-preview]').should('be.visible');
    
    // Additional documents
    cy.get('[data-cy=portfolio-upload]').attachFile('portfolio.pdf');
    cy.get('[data-cy=cover-letter-upload]').attachFile('cover-letter.pdf');
    
    // Submit application
    cy.get('[data-cy=terms-agreement]').check();
    cy.get('[data-cy=submit-application]').click();
    
    // Verify submission
    cy.get('[data-cy=application-confirmation]').should('be.visible');
    cy.get('[data-cy=tracking-number]').should('be.visible');
    cy.get('[data-cy=next-steps]').should('be.visible');
  });

  it('should track application status', () => {
    cy.loginUser('candidate@example.com', 'CandidatePass123!');
    cy.visit('/profile/applications');
    
    // View application list
    cy.get('[data-cy=application-list]').should('be.visible');
    cy.get('[data-cy=application-card]').should('have.length.greaterThan', 0);
    
    // Check application status
    cy.get('[data-cy=application-card]').first().within(() => {
      cy.get('[data-cy=job-title]').should('be.visible');
      cy.get('[data-cy=company-name]').should('be.visible');
      cy.get('[data-cy=application-date]').should('be.visible');
      cy.get('[data-cy=status-badge]').should('be.visible');
    });
    
    // View application details
    cy.get('[data-cy=application-card]').first().click();
    cy.get('[data-cy=application-details]').should('be.visible');
    cy.get('[data-cy=status-timeline]').should('be.visible');
    cy.get('[data-cy=communications]').should('be.visible');
  });

  it('should manage interview scheduling', () => {
    cy.loginUser('recruiter@example.com', 'RecruiterPass123!');
    cy.visit('/recruitment/applications');
    
    // View applications and schedule interview
    cy.get('[data-cy=application-card]').first().click();
    cy.get('[data-cy=schedule-interview]').click();
    
    // Interview details
    cy.get('[data-cy=interview-form]').should('be.visible');
    cy.get('[data-cy=interview-type]').select('technical');
    cy.get('[data-cy=interview-duration]').select('60');
    cy.get('[data-cy=interview-format]').select('video');
    
    // Schedule availability
    cy.get('[data-cy=availability-slots]').should('be.visible');
    cy.get('[data-cy=select-date]').click();
    cy.get('[data-cy=select-time]').click();
    cy.get('[data-cy=add-note]').type('Focus on React and Node.js experience');
    
    // Send invitation
    cy.get('[data-cy=send-invitation]').click();
    cy.get('[data-cy=invitation-sent]').should('contain', 'Interview invitation sent');
  });

  it('should provide candidate feedback and ratings', () => {
    cy.loginUser('recruiter@example.com', 'RecruiterPass123!');
    cy.visit('/recruitment/candidates/test-candidate');
    
    // Provide feedback after interview
    cy.get('[data-cy=feedback-button]').click();
    cy.get('[data-cy=feedback-form]').should('be.visible');
    
    // Technical skills rating
    cy.get('[data-cy=technical-rating]').should('be.visible');
    cy.get('[data-cy=communication-rating]').should('be.visible');
    cy.get('[data-cy=problem-solving-rating]').should('be.visible');
    cy.get('[data-cy=culture-fit-rating]').should('be.visible');
    
    // Detailed feedback
    cy.get('[data-cy=strengths]').type('Strong technical skills and problem-solving abilities');
    cy.get('[data-cy=areas-for-improvement]').type('Could improve communication of complex concepts');
    cy.get('[data-cy=recommendation]').select('hire');
    
    // Save feedback
    cy.get('[data-cy=save-feedback]').click();
    cy.get('[data-cy=feedback-saved]').should('contain', 'Feedback saved successfully');
  });

  it('should support bulk operations for recruiters', () => {
    cy.loginUser('recruiter@example.com', 'RecruiterPass123!');
    cy.visit('/recruitment/candidates');
    
    // Select multiple candidates
    cy.get('[data-cy=candidate-checkbox]').first().check();
    cy.get('[data-cy=candidate-checkbox]').eq(1).check();
    cy.get('[data-cy=candidate-checkbox]').eq(2).check();
    
    // Bulk actions
    cy.get('[data-cy=bulk-actions]').should('be.visible');
    cy.get('[data-cy=broadcast-message]').click();
    
    // Send bulk message
    cy.get('[data-cy=message-subject]').type('New Job Opportunity');
    cy.get('[data-cy=message-body]').type('We have an exciting new position...');
    cy.get('[data-cy=send-bulk-message]').click();
    
    // Verify message sent
    cy.get('[data-cy=message-sent-confirmation]').should('be.visible');
    cy.get('[data-cy=recipients-count]').should('contain', '3 candidates');
  });

  it('should provide analytics and insights', () => {
    cy.loginUser('recruiter@example.com', 'RecruiterPass123!');
    cy.visit('/recruitment/analytics');
    
    // Dashboard analytics
    cy.get('[data-cy=analytics-dashboard]').should('be.visible');
    cy.get('[data-cy=application-metrics]').should('be.visible');
    cy.get('[data-cy=conversion-funnel]').should('be.visible');
    cy.get('[data-cy=time-to-hire]').should('be.visible');
    
    // Job posting performance
    cy.get('[data-cy=job-performance]').should('be.visible');
    cy.get('[data-cy=views-count]').should('be.visible');
    cy.get('[data-cy=applications-count]').should('be.visible');
    cy.get('[data-cy=conversion-rate]').should('be.visible');
    
    // Candidate pipeline
    cy.get('[data-cy=pipeline-stages]').should('be.visible');
    cy.get('[data-cy=stage-count]').should('have.length.greaterThan', 0);
    cy.get('[data-cy=avg-time-per-stage]').should('be.visible');
  });

  it('should support team collaboration', () => {
    cy.loginUser('recruiter@example.com', 'RecruiterPass123!');
    cy.visit('/recruitment/candidates/test-candidate');
    
    // Collaborate with team
    cy.get('[data-cy=share-candidate]').click();
    cy.get('[data-cy=team-members]').should('be.visible');
    
    // Share with colleague
    cy.get('[data-cy=colleague-select]').select('john.doe@company.com');
    cy.get('[data-cy=share-note]').type('Promising candidate for senior developer role');
    cy.get('[data-cy=send-share]').click();
    
    // View shared feedback
    cy.get('[data-cy=team-feedback]').should('be.visible');
    cy.get('[data-cy=shared-notes]').should('have.length.greaterThan', 0);
    
    // Team discussion
    cy.get('[data-cy=start-discussion]').click();
    cy.get('[data-cy=discussion-thread]').should('be.visible');
    cy.get('[data-cy=add-comment]').type('I agree with the assessment');
    cy.get('[data-cy=post-comment]').click();
  });

  it('should handle offer management', () => {
    cy.loginUser('recruiter@example.com', 'RecruiterPass123!');
    cy.visit('/recruitment/applications/advanced-application');
    
    // Extend offer
    cy.get('[data-cy=extend-offer]').click();
    cy.get('[data-cy=offer-form]').should('be.visible');
    
    // Offer details
    cy.get('[data-cy=position-title]').type('Senior Full-Stack Developer');
    cy.get('[data-cy=base-salary]').type('150000');
    cy.get('[data-cy=bonus-percentage]').type('15');
    cy.get('[data-cy=equity-grant]').type('1000');
    cy.get('[data-cy=start-date]').type('2024-02-01');
    
    // Benefits package
    cy.get('[data-cy=health-insurance]').select('premium');
    cy.get('[data-cy=pto-days]').type('25');
    cy.get('[data-cy=remote-work-option]').check();
    
    // Send offer
    cy.get('[data-cy=send-offer]').click();
    cy.get('[data-cy=offer-sent]').should('contain', 'Offer sent successfully');
    
    // Track offer status
    cy.get('[data-cy=offer-status]').should('be.visible');
    cy.get('[data-cy=deadline]').should('be.visible');
    cy.get('[data-cy=follow-up-reminder]').should('be.visible');
  });
});