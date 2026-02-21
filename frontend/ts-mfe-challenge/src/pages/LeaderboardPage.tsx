import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

interface LeaderboardEntry {
    rank: number;
    username: string;
    score: number;
    submittedAt: string;
}

const LeaderboardPage: React.FC = () => {
    const { challengeId } = useParams<{ challengeId: string }>();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeaderboard = useCallback(async () => {
        if (!challengeId) return;
        try {
            const response = await api.get(`/challenges/${challengeId}/leaderboard`);
            setEntries(response.data.entries || []);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to load leaderboard.');
            setLoading(false);
        }
    }, [challengeId]);

    useEffect(() => {
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 30000); // 30s auto-refresh
        return () => clearInterval(interval);
    }, [challengeId, fetchLeaderboard]);

    if (loading) return <div className="p-8">Loading leaderboard...</div>;
    if (error) return <div className="p-8 text-red-600">{error}</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Challenge Leaderboard</h1>

            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f3f4f6' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Rank</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>User</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>Score</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>Submitted At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                    No submissions yet. Be the first!
                                </td>
                            </tr>
                        ) : (
                            entries.map((entry) => (
                                <tr key={`${entry.rank}-${entry.username}`} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            display: 'inline-block', width: '2rem', height: '2rem', textAlign: 'center', lineHeight: '2rem',
                                            background: entry.rank <= 3 ? '#fbbf24' : '#e5e7eb',
                                            color: entry.rank <= 3 ? 'white' : 'black',
                                            borderRadius: '50%', fontWeight: 'bold'
                                        }}>
                                            {entry.rank}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{entry.username}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{entry.score.toFixed(1)}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', color: '#6b7280', fontSize: '0.9rem' }}>
                                        {new Date(entry.submittedAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeaderboardPage;
