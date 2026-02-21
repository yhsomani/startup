import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { isFeatureEnabled } from '../services/FeatureFlags';

const GradingPage: React.FC = () => {
    const { challengeId, submissionId } = useParams<{ challengeId: string; submissionId: string }>();
    const navigate = useNavigate();
    const [score, setScore] = useState('');
    const [feedback, setFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isFeatureEnabled('ENABLE_MANUAL_GRADING')) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-400">Feature Disabled</h2>
                <p className="text-gray-500">Manual Grading is currently unavailable.</p>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.put(`/challenges/submissions/${submissionId}/grade`, {
                score: parseFloat(score),
                feedback
            });
            // Redirect back to user's submissions or leaderboard?
            // For now, back to challenge
            navigate(`/${challengeId}`);
        } catch (err) {
            setError('Failed to submit grade');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-lg">
            <h1 className="text-2xl font-bold mb-6">Grade Submission</h1>
            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Score (0-100)</label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Feedback</label>
                    <textarea
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        {submitting ? 'Grading...' : 'Submit Grade'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(`/${challengeId}`)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default GradingPage;
