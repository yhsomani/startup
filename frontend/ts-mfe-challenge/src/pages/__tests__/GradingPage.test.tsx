import React from 'react';
import { render, screen } from '@testing-library/react';
import GradingPage from '../GradingPage';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { isFeatureEnabled } from '../../services/FeatureFlags';

// Mock dependencies
vi.mock('../../services/api');
vi.mock('../../services/FeatureFlags', () => ({
    isFeatureEnabled: vi.fn(),
    FeatureFlags: {
        ENABLE_MANUAL_GRADING: 'ENABLE_MANUAL_GRADING'
    }
}));

const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('GradingPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows disabled message when flag is OFF', () => {
        (isFeatureEnabled as Mock).mockReturnValue(false);
        renderWithRouter(<GradingPage />);
        expect(screen.getByText(/Feature Disabled/i)).toBeInTheDocument();
        expect(screen.queryByText(/Grade Submission/i)).not.toBeInTheDocument();
    });

    it('shows form when flag is ON', () => {
        (isFeatureEnabled as Mock).mockReturnValue(true);
        renderWithRouter(<GradingPage />);
        expect(screen.getByText(/Grade Submission/i)).toBeInTheDocument();
        expect(screen.getByText(/Score/i)).toBeInTheDocument();
        expect(screen.getByText(/Feedback/i)).toBeInTheDocument();
    });
});
