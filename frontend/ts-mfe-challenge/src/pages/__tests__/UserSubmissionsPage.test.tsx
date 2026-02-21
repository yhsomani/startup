import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import UserSubmissionsPage from '../UserSubmissionsPage';
import api from '../../services/api';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { isFeatureEnabled } from '../../services/FeatureFlags';

// Mock dependencies
vi.mock('../../services/api');
vi.mock('../../services/FeatureFlags', () => ({
    isFeatureEnabled: vi.fn(),
    FeatureFlags: {
        ENABLE_USER_HISTORY: 'ENABLE_USER_HISTORY'
    }
}));

const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('UserSubmissionsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows disabled message when flag is OFF', () => {
        (isFeatureEnabled as Mock).mockReturnValue(false);
        renderWithRouter(<UserSubmissionsPage />);
        expect(screen.getByText(/Feature Disabled/i)).toBeInTheDocument();
        expect(screen.queryByText(/My Submissions/i)).not.toBeInTheDocument();
    });

    it('shows submissions when flag is ON', async () => {
        (isFeatureEnabled as Mock).mockReturnValue(true);
        (api.get as Mock).mockResolvedValue({
            data: [
                { id: '1', title: 'Challenge 1', status: 'passed', score: 95, submittedAt: new Date().toISOString() }
            ]
        });

        // Mock localStorage
        vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('test-user-id');

        renderWithRouter(<UserSubmissionsPage />);

        expect(screen.getByText(/Loading/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Challenge 1')).toBeInTheDocument();
            expect(screen.getByText('passed')).toBeInTheDocument();
            expect(screen.getByText('95')).toBeInTheDocument();
        });
    });
});
