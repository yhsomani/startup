// AI Assistant Integration Tests
describe('🤖 AI Assistant Integration', () => {
  let studentToken: string;

  beforeEach(() => {
    cy.registerUser({ email: 'student.ai@example.com', role: 'STUDENT' }).then((response) => {
      studentToken = response.token;
      localStorage.setItem('authToken', studentToken);
    });
  });

  it('should access AI assistant interface', () => {
    cy.visit('/dashboard');
    
    // Access AI assistant
    cy.get('[data-cy=ai-assistant-button]').click();
    cy.get('[data-cy=ai-assistant-modal]').should('be.visible');
    
    // Check assistant features
    cy.get('[data-cy=chat-input]').should('be.visible');
    cy.get('[data-cy=code-analyzer]').should('be.visible');
    cy.get('[data-cy=lesson-summarizer]').should('be.visible');
    cy.get('[data-cy=chat-history]').should('be.visible');
  });

  it('should provide AI tutoring chat', () => {
    cy.visit('/ai-assistant');
    
    // Start chat session
    cy.get('[data-cy=chat-input]').should('be.visible');
    cy.get('[data-cy=send-button]').should('be.visible');
    
    // Ask programming question
    cy.get('[data-cy=chat-input]').type('How do I implement a binary search algorithm in Python?');
    cy.get('[data-cy=send-button]').click();
    
    // Wait for AI response
    cy.get('[data-cy=ai-response]').should('be.visible');
    cy.get('[data-cy=ai-message]').should('contain', 'binary search');
    cy.get('[data-cy=response-time]').should('be.visible');
    
    // Check conversation flow
    cy.get('[data-cy=user-message]').should('contain', 'binary search algorithm');
    cy.get('[data-cy=ai-message]').should('have.length.greaterThan', 0);
  });

  it('should analyze code with AI', () => {
    cy.visit('/ai-assistant');
    cy.get('[data-cy=code-analyzer]').click();
    
    // Input code for analysis
    const sampleCode = `def find_max(arr):
    max_val = arr[0]
    for i in range(1, len(arr)):
        if arr[i] > max_val:
            max_val = arr[i]
    return max_val`;
    
    cy.get('[data-cy=code-input]').type(sampleCode, { parseSpecialCharSequences: false });
    cy.get('[data-cy=language-select]').select('python');
    cy.get('[data-cy=analyze-button]').click();
    
    // Wait for analysis results
    cy.get('[data-cy=analysis-results]').should('be.visible');
    cy.get('[data-cy=quality-score]').should('be.visible');
    cy.get('[data-cy=suggestions]').should('be.visible');
    cy.get('[data-cy=strengths]').should('be.visible');
    cy.get('[data-cy=complexity-score]').should('be.visible');
    
    // Verify analysis content
    cy.get('[data-cy=quality-score]').should('contain', '%');
    cy.get('[data-cy=suggestions]').should('contain.length.greaterThan', 0);
    cy.get('[data-cy=strengths]').should('contain.length.greaterThan', 0);
  });

  it('should generate lesson summaries', () => {
    cy.visit('/courses/javascript-fundamentals');
    
    // Access lesson summary feature
    cy.get('[data-cy=lesson-summary-button]').click();
    cy.get('[data-cy=summary-modal]').should('be.visible');
    
    // Generate summary for current lesson
    cy.get('[data-cy=generate-summary]').click();
    
    // Wait for AI-generated summary
    cy.get('[data-cy=summary-loading]').should('be.visible');
    cy.get('[data-cy=summary-content]', { timeout: 10000 }).should('be.visible');
    
    // Verify summary structure
    cy.get('[data-cy=summary-text]').should('be.visible');
    cy.get('[data-cy=key-points]').should('have.length.greaterThan', 0);
    cy.get('[data-cy=study-tips]').should('have.length.greaterThan', 0);
    cy.get('[data-cy=related-topics]').should('be.visible');
  });

  it('should provide contextual help during challenges', () => {
    cy.visit('/challenges/binary-search');
    
    // Start challenge and request help
    cy.get('[data-cy=start-challenge]').click();
    cy.get('[data-cy=ai-help-button]').click();
    
    // Context-aware help
    cy.get('[data-cy=help-context]').should('contain', 'Binary Search Algorithm');
    cy.get('[data-cy=help-suggestions]').should('have.length.greaterThan', 0);
    
    // Ask specific question
    cy.get('[data-cy=help-input]').type('What is the time complexity of binary search?');
    cy.get('[data-cy=ask-help]').click();
    
    // Get contextual response
    cy.get('[data-cy=help-response]').should('contain', 'O(log n)');
    cy.get('[data-cy=explanation]').should('be.visible');
  });

  it('should support voice interactions', () => {
    cy.visit('/ai-assistant');
    
    // Check voice features
    cy.get('[data-cy=voice-input]').should('be.visible');
    cy.get('[data-cy=voice-settings]').should('be.visible');
    
    // Mock voice input
    cy.get('[data-cy=voice-input]').click();
    cy.get('[data-cy=recording-indicator]').should('be.visible');
    
    // Simulate voice command
    cy.window().then((win) => {
      // Mock speech recognition
      win.speechRecognitionMock = {
        start: cy.stub(),
        stop: cy.stub(),
        onresult: null,
        onerror: null
      };
    });
    
    cy.get('[data-cy=stop-recording]').click();
    cy.get('[data-cy=voice-text]').should('be.visible');
  });

  it('should maintain conversation history', () => {
    cy.visit('/ai-assistant');
    
    // Have multiple conversations
    const questions = [
      'What is recursion?',
      'How do I optimize database queries?',
      'Explain async/await in JavaScript'
    ];
    
    questions.forEach((question, index) => {
      cy.get('[data-cy=chat-input]').type(question);
      cy.get('[data-cy=send-button]').click();
      cy.get('[data-cy=ai-response]', { timeout: 5000 }).should('have.length', index + 1);
    });
    
    // Check history persistence
    cy.reload();
    cy.get('[data-cy=chat-history]').should('be.visible');
    cy.get('[data-cy=history-item]').should('have.length', 3);
    
    // Search conversation history
    cy.get('[data-cy=history-search]').type('recursion');
    cy.get('[data-cy=search-result]').should('contain', 'recursion');
  });

  it('should provide personalized recommendations', () => {
    cy.visit('/ai-assistant');
    
    // Check personalized recommendations
    cy.get('[data-cy=recommendations]').should('be.visible');
    cy.get('[data-cy=recommended-topics]').should('have.length.greaterThan', 0);
    cy.get('[data-cy=recommended-courses]').should('have.length.greaterThan', 0);
    cy.get('[data-cy=recommended-challenges]').should('have.length.greaterThan', 0);
    
    // Based on user progress
    cy.get('[data-cy=progress-based-suggestions]').should('be.visible');
    cy.get('[data-cy=next-steps]').should('be.visible');
  });

  it('should handle offline mode gracefully', () => {
    cy.visit('/ai-assistant');
    
    // Simulate offline mode
    cy.window().then((win) => {
      win.navigator.onLine = false;
    });
    
    // Try to use AI assistant
    cy.get('[data-cy=chat-input]').type('Test question');
    cy.get('[data-cy=send-button]').click();
    
    // Should show offline message
    cy.get('[data-cy=offline-message]').should('be.visible');
    cy.get('[data-cy=cached-responses]').should('be.visible');
    
    // Restore online mode
    cy.window().then((win) => {
      win.navigator.onLine = true;
    });
    
    // Should resume normal operation
    cy.get('[data-cy=online-indicator]').should('be.visible');
  });

  it('should respect privacy and data handling', () => {
    cy.visit('/ai-assistant/settings');
    
    // Check privacy settings
    cy.get('[data-cy=privacy-settings]').should('be.visible');
    cy.get('[data-cy=data-collection]').should('be.visible');
    cy.get('[data-cy=conversation-storage]').should('be.visible');
    cy.get('[data-cy=personalization]').should('be.visible');
    
    // Disable data collection
    cy.get('[data-cy=disable-collection]').click();
    cy.get('[data-cy=save-settings]').click();
    
    // Verify settings saved
    cy.get('[data-cy=settings-saved]').should('contain', 'Settings saved');
    cy.get('[data-cy=collection-status]').should('contain', 'Disabled');
  });

  it('should integrate with gamification', () => {
    cy.visit('/ai-assistant');
    
    // Check gamification integration
    cy.get('[data-cy=learning-points]').should('be.visible');
    cy.get('[data-cy=achievement-progress]').should('be.visible');
    
    // Earn points through AI interaction
    cy.get('[data-cy=chat-input]').type('Help me understand closures in JavaScript');
    cy.get('[data-cy=send-button]').click();
    
    // Verify points earned
    cy.get('[data-cy=points-earned]').should('be.visible');
    cy.get('[data-cy=achievement-unlock]').should('be.visible');
  });

  it('should provide multi-language support', () => {
    cy.visit('/ai-assistant');
    
    // Test language switching
    cy.get('[data-cy=language-selector]').select('Spanish');
    cy.get('[data-cy=interface-text]').should('contain', 'español');
    
    // Test AI responses in different languages
    cy.get('[data-cy=chat-input]').type('¿Qué es la recursión?');
    cy.get('[data-cy=send-button]').click();
    
    cy.get('[data-cy=ai-response]').should('be.visible');
    cy.get('[data-cy=response-language]').should('contain', 'Español');
  });

  it('should handle rate limiting and quotas', () => {
    cy.visit('/ai-assistant');
    
    // Make multiple rapid requests
    for (let i = 0; i < 10; i++) {
      cy.get('[data-cy=chat-input]').type(`Question ${i}`);
      cy.get('[data-cy=send-button]').click();
    }
    
    // Should eventually show rate limit
    cy.get('[data-cy=rate-limit-message]', { timeout: 5000 }).should('be.visible');
    cy.get('[data-cy=quota-status]').should('be.visible');
    cy.get('[data-cy=reset-time]').should('be.visible');
  });

  it('should provide accessibility features', () => {
    cy.visit('/ai-assistant');
    
    // Check accessibility features
    cy.get('[data-cy=screen-reader-mode]').should('be.visible');
    cy.get('[data-cy=high-contrast]').should('be.visible');
    cy.get('[data-cy=font-size-controls]').should('be.visible');
    cy.get('[data-cy=keyboard-shortcuts]').should('be.visible');
    
    // Enable screen reader mode
    cy.get('[data-cy=screen-reader-mode]').click();
    cy.get('[data-cy=aria-labels]').should('have.attr', 'aria-live');
    
    // Test keyboard navigation
    cy.get('[data-cy=chat-input]').focus();
    cy.get('body').type('{enter}');
    cy.get('[data-cy=ai-response]').should('be.visible');
  });
});