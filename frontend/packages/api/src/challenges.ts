/**
 * Challenges API Service
 * 
 * Handles challenge and submission endpoints.
 */
import api from './http';
import type { Challenge, Submission, PaginatedResponse } from './types';

interface ChallengesListParams {
    page?: number;
    limit?: number;
    isActive?: boolean;
}

export const challengesApi = {
    /**
     * Get paginated list of challenges
     */
    async getChallenges(params: ChallengesListParams = {}): Promise<PaginatedResponse<Challenge>> {
        const response = await api.get<PaginatedResponse<Challenge>>('/challenges', { params });
        return response.data;
    },

    /**
     * Get a single challenge by ID
     */
    async getChallengeById(challengeId: string): Promise<Challenge> {
        const response = await api.get<Challenge>(`/challenges/${challengeId}`);
        return response.data;
    },

    /**
     * Submit solution for a challenge
     */
    async submitSolution(challengeId: string, file: File): Promise<Submission> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('challengeId', challengeId);

        const response = await api.post<Submission>('/submissions', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Get all submissions for a challenge
     */
    async getSubmissions(challengeId: string): Promise<Submission[]> {
        const response = await api.get<Submission[]>(`/challenges/${challengeId}/submissions`);
        return response.data;
    },

    /**
     * Get my submissions for a challenge
     */
    async getMySubmissions(challengeId: string): Promise<Submission[]> {
        const response = await api.get<Submission[]>(`/challenges/${challengeId}/submissions/my`);
        return response.data;
    },

    /**
     * Get submission by ID
     */
    async getSubmissionById(submissionId: string): Promise<Submission> {
        const response = await api.get<Submission>(`/submissions/${submissionId}`);
        return response.data;
    },
};

export default challengesApi;
