import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // Plugin code here
    },
    env: {
      apiUrl: 'http://localhost:5000/api/v1',
      assistantUrl: 'http://localhost:5005',
      recruitmentUrl: 'http://localhost:5006/api/v1',
      gamificationUrl: 'http://localhost:5007/api/v1',
      collaborationUrl: 'http://localhost:5008',
      timeout: 10000,
      retry: 3
    },
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    taskTimeout: 60000
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    }
  }
});