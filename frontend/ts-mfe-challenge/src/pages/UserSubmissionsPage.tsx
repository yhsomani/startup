import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { isFeatureEnabled } from '../services/FeatureFlags';

interface Submission {
    id: string;
    challengeId: string;
    title: string;
    status: string;
    score: number | null;
    submittedAt: string;
}

const UserSubmissionsPage: React.FC = () => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isFeatureEnabled('ENABLE_USER_HISTORY')) {
            setLoading(false);
            return;
        }

        const fetchSubmissions = async () => {
            try {
                // Assuming we can get userId from token or store, but for now strict implementation might need manual ID or proper auth context.
                // Since this is a MFE, we might rely on the shell or decode token.
                // For simplicity/demo: fetching for current user via endpoint that extracts ID from token?
                // The backend endpoint is /submissions/user/<id>. The frontend needs to know its ID.
                // Let's assume we decode it from localStorage 'userId' for now as per likely auth flow.
                const userId = localStorage.getItem('userId');
                if (!userId) {
                    setError('User not authenticated');
                    setLoading(false);
                    return;
                }

                const response = await api.get(`/challenges/submissions/user/${userId}`);
                setSubmissions(response.data);
            } catch (err) {
                setError('Failed to load submissions');
            } finally {
                setLoading(false);
            }
        };

        fetchSubmissions();
    }, []);

    if (!isFeatureEnabled('ENABLE_USER_HISTORY')) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-400">Feature Disabled</h2>
                <p className="text-gray-500">User History is currently unavailable.</p>
            </div>
        );
    }

    if (loading) return <div className="p-8">Loading...</div>;
    if (error) return <div className="p-8 text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">My Submissions</h1>
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challenge</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {submissions.map((sub) => (
                            <tr key={sub.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{sub.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sub.status === 'passed' ? 'bg-green-100 text-green-800' :
                                            sub.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {sub.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.score ?? '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(sub.submittedAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {submissions.length === 0 && <div className="p-4 text-center text-gray-500">No submissions found.</div>}
            </div>
        </div>
    );
};

export default UserSubmissionsPage;
