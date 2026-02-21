import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import TestApp from '../../src/TestApp';

describe('App Shell', () => {
    it('renders the home page by default', () => {
        render(
            <MemoryRouter initialEntries={['/']}>
                <TestApp />
            </MemoryRouter>
        );
        expect(screen.getByRole('heading', { level: 1, name: /Welcome to TalentSphere/i })).toBeInTheDocument();
    });

    it('renders the browse courses page', () => {
        render(
            <MemoryRouter initialEntries={['/courses']}>
                <TestApp />
            </MemoryRouter>
        );
        expect(screen.getByRole('heading', { level: 1, name: /Browse Courses/i })).toBeInTheDocument();
    });
});
