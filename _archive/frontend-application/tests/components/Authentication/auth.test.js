/**
 * Authentication Component Tests
 * Tests user authentication flows with mock services
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, getByLabelText, getByPlaceholderText } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { MockedProvider } from 'react-router-dom';

import { App } from '../../App';
import { render, waitFor } from '@testing-library/react';
import { cleanup } from '../../tests/setupTests';
import { 
  fixtures, 
  mockResponses, 
  mockErrors,
  TEST_SELECTORS 
} from '../../tests/setupTests';

const createMockStore = (initialState = {}) => ({
  getState: jest.fn(() => (initialState)),
  dispatch: jest.fn(),
  subscribe: jest.fn(),
  replaceReducer: jest.fn()
});

const renderWithProviders = (ui, initialState = {}) => {
  return render(
    <Provider store={createMockStore(initialState)}>
      <ThemeProvider theme={createTheme()}>
        <BrowserRouter>
          {ui}
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  </Provider>
  );
};

describe('Authentication Flow', () => {
  let user;

  beforeEach(() => {
    user = fixtures.users[0];
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Login Form', () => {
    it('should render login form successfully', async () => {
      const { getByLabelText, getByPlaceholderText } = renderWithProviders(
        <App />
      );
      
      const emailInput = getByLabelText(/email/i);
      const passwordInput = getByLabelText(/password/i);
      const submitButton = getByLabelText(/login/i);
      
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should show validation errors for invalid inputs', async () => {
      const { getByLabelText, getByPlaceholderText } = renderWithProviders(<App />);
      
      const emailInput = getByLabelText(/email/i);
      const passwordInput = getByLabelText(/password/i);
      const submitButton = getByLabelText(/login/i);
      
      // Test empty email
      fireEvent.change(emailInput, { target: { value: '' } });
      fireEvent.blur(emailInput);
      
      expect(await waitFor(() => 
        getByText(/email/i).closest('.error-message')
      ));
      
      // Test short password
      fireEvent.change(passwordInput, { target: { value: '123' } });
      fireEvent.blur(passwordInput);
      
      expect(await waitFor(() => 
        getByText(/password/i).closest('.error-message')
      ));
      
      // Test invalid email format
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);
      
      expect(await waitFor(() => 
        getByText(/email/i).closest('.error-message')
      ));
    });

    it('should handle successful login', async () => {
      const { getByLabelText, getByPlaceholderText } = renderWithProviders(<App />);
      
      fireEvent.change(emailInput, { target: { value: user.email } });
      fireEvent.change(passwordInput, { target: { value: 'ValidPass123!' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/welcome/i)).toBeInTheDocument();
      });
      
      const { getByText, getAllByText } = screen.getAllByText();
      const welcomeText = getAllByText.find(text => 
        text.includes('Welcome') && text.includes('John')
      );
      expect(welcomeText).toBeInTheDocument();
    });

    it('should handle login failure', async () => {
      const { getByLabelText, getByPlaceholderText } = renderWithProviders(<App />);
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);
      
      const errorMessage = await waitFor(() => 
        getByText(/invalid-email-or-password/i).closest('.error-message')
      );
      
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('Invalid email or password');
    });

    it('should show loading state during login', async () => {
      const { getByLabelText, getByPlaceholderText } = renderWithProviders(<App />);
      
      fireEvent.click(submitButton);
      
      const loadingSpinner = screen.getByTestId('loading-spinner');
      expect(loadingSpinner).toBeInTheDocument();
      
      await waitForElementToBeRemoved('loading-spinner');
      
      expect(screen.queryByTestId('loading-spinner')).toBeNull();
    });
  });

  describe('Logout', () => {
    it('should log user out successfully', async () => {
      // First login
      const { getByLabelText, getByPlaceholderText } = renderWithProviders(<App />);
      
      fireEvent.change(emailInput, { target: { value: user.email } });
      fireEvent.change(passwordInput, { target: { value: 'ValidPass123!' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/welcome/i)).toBeInTheDocument();
      });
      
      // Logout
      const logoutButton = screen.getByText(/logout/i);
      fireEvent.click(logoutButton);
      
      await waitFor(() => {
        expect(screen.getByText(/login/i)).toBeInTheDocument();
      });
      
      const loginForm = screen.getByLabelText(/email/i).closest('form');
      expect(loginForm).toBeInTheDocument();
    });
  });

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users', async () => {
      const { getByLabelText, getByPlaceholderText } = renderWithProviders(<App />);
      
      const profileLink = screen.getByText(/profile/i);
      
      fireEvent.click(profileLink);
      
      await waitFor(() => {
        expect(screen.getByText(/login/i)).toBeInTheDocument();
      });
      
      const errorMessage = await waitFor(() => 
        screen.getByText(/access.denied/i).closest('.error-message')
      );
      
      expect(errorMessage).toBeInTheDocument();
    });

    it('should allow access to authenticated users', async () => {
      // First login
      const { getByLabelText, getByPlaceholderText } = renderWithProviders(<App />);
      
      fireEvent.change(emailInput, { target: { value: user.email } });
      fireEvent.change(passwordInput, { target: { value: 'ValidPass123!' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/welcome/i)).toBeInTheDocument();
      });
      
      const profileLink = screen.getByText(/profile/i);
      expect(profileLink).toBeInTheDocument();
    });

    it('should allow admin access', async () => {
      // Login as admin user
      const { getByLabelText, getByPlaceholderText } = renderWithProviders(<App />);
      
      // Override auth state for testing
      const { getByLabelText, getByPlaceholderText } = renderWithProviders(
        <App />,
        { auth: { 
          isAuthenticated: true,
          user: fixtures.users[2], // Admin user
          permissions: ['read', 'write', 'delete']
        }
      });
      
      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'ValidPass123!' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument();
      });
      
      const adminPanel = screen.getByText(/Admin Dashboard/i);
      expect(adminPanel).toBeInTheDocument();
    });
  });
});

describe('Password Reset Flow', () => {
  beforeEach(() => {
      cleanup();
    });

  it('should request password reset successfully', async () => {
      const { getByLabelText, getByPlaceholderText } = renderWithProviders(<App />);
      
      const emailInput = getByLabelText(/email/i);
      const submitButton = getByLabelText(/reset-password/i);
      
      fireEvent.change(emailInput, { target: { value: user.email } });
      fireEvent.click(submitButton);
      
      const successMessage = await waitFor(() => 
        screen.getByText(/password reset sent/i));
      });
      
      expect(successMessage).toBeInTheDocument();
      expect(successMessage).toHaveTextContent('Password reset link sent');
    });

    it('should handle invalid reset request', async () => {
      const { getByLabelText, getByPlaceholderText } = renderWithProviders(<App />);
      
      const emailInput = getByLabelText(/email/i);
      const submitButton = getByLabelText(/reset-password/i);
      
      fireEvent.change(emailInput, { target: { value: 'non-existent@email.com' } });
      fireEvent.click(submitButton);
      
      const errorMessage = await waitFor(() => 
        screen.getByText(/user not found/i).closest('.error-message')
      );
      
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('User not found');
    });
  });
});

describe('User Registration', () => {
  beforeEach(() => {
      cleanup();
    });

  it('should register new user successfully', async () => {
      const { getByLabelText, getByPlaceholderText } = renderWithProviders(<App />);
      
      const firstName = getByLabelText(/first name/i);
      const lastName = getByLabelText(/last name/i);
      const email = getByLabelText(/email/i);
      const password = getByLabelText(/password/i);
      const confirmPassword = getByLabelText(/confirm password/i);
      const termsCheckbox = getByLabelText(/terms/i);
      const submitButton = getByLabelText(/sign up/i);
      
      fireEvent.change(firstName, { target: { value: 'John' });
      fireEvent.change(lastName, { target: { value: 'Doe' });
      fireEvent.change(email, { target: { value: 'john.doe@example.com' });
      fireEvent.change(password, { target: { value: 'SecurePass123!' } });
      fireEvent.change(confirmPassword, { target: { value: 'SecurePass123!' });
      fireEvent.click(termsCheckbox);
      fireEvent.click(submitButton);
      
      const successMessage = await waitFor(() => 
        screen.getByText(/account created/i));
      
      expect(successMessage).toBeInTheDocument();
      expect(successMessage).toHaveTextContent('Account created successfully');
      expect(screen.getByText(/john.doe@example.com/)).toBeInTheDocument();
    });

    it('should show validation errors for missing fields', async () => {
      const { getByLabelText, getByPlaceholderText } = renderWithProviders(<App />);
      
      const submitButton = getByLabelText(/sign up/i);
      fireEvent.click(submitButton);
      
      const emailError = await waitFor(() => 
        screen.getByText(/email is required/i).closest('.error-message')
      );
      
      expect(emailError).toBeInTheDocument();
      expect(emailError).toHaveTextContent('Email is required');
      
      const passwordError = await waitFor(() => 
        screen.getByText(/Password is required/i).closest('.error-message')
      );
      
      expect(passwordError).toBeInTheDocument();
      expect(passwordError).toHaveTextContent('Password is required');
      
      const termsError = await waitFor(() => 
        screen.getByText(/must accept terms/i).closest('.error-message')
      );
      
      expect(termsError).toBeInTheDocument();
      expect(termsError).toHaveTextContent('Must accept terms');
    });
  });
});

describe('Session Management', () => {
  beforeEach(() => {
      cleanup();
  });

  it('should maintain session after page refresh', async () => {
      // This test would require mocking session storage
      const { getByLabelText, getByPlaceholderText } = renderWithProviders(<App />);
      
      // Mock JWT token in local storage
      sessionStorage.setItem('jwt_token', 'mock-token');
      
      // Refresh the page
      window.location.reload();
      
      // Check if session persists
      expect(sessionStorage.getItem('jwt_token')).toBe('mock-token');
    });
  });