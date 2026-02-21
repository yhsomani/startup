import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Challenge } from '../types/challenge';

const ChallengeList: React.FC = () => {
    const navigate = useNavigate();
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChallenges = async () => {
            try {
                const response = await api.get('/challenges/');
                setChallenges(response.data);
            } catch (error) {
                console.error("Failed to fetch challenges", error);
            } finally {
                setLoading(false);
            }
        };
        fetchChallenges();
    }, []);

    if (loading) return <div className="p-8">Loading challenges...</div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Coding Challenges</h1>

            {challenges.length === 0 ? (
                <div>No challenges available.</div>
            ) : (
                <div className="challenge-grid">
                    {challenges.map(challenge => (
                        <div
                            key={challenge.id}
                            onClick={() => navigate(`${challenge.id}`)}
                            className="challenge-card"
                        >
                            <h3 className="challenge-title">{challenge.title}</h3>
                            <p className="challenge-desc">
                                {challenge.description}
                            </p>
                            <div className="challenge-meta">
                                Metric: <span style={{ fontWeight: 500 }}>{challenge.evaluationMetric}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChallengeList;
