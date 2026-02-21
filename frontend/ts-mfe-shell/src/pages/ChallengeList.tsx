import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const ChallengeList: React.FC = () => {
    const [challenges, setChallenges] = useState<any[]>([]);

    useEffect(() => {
        // Mock challenges
        setChallenges([
            {
                id: 'challenge-1',
                title: 'Titanic Survival Prediction',
                description: 'Predict survival on the Titanic',
                difficulty: 'Medium'
            }
        ]);
    }, []);

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Challenges</h1>
            <div style={{ marginTop: '2rem' }}>
                {challenges.map(challenge => (
                    <Link
                        key={challenge.id}
                        to={`/challenges/${challenge.id}`}
                        style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: '1rem' }}
                    >
                        <div style={{
                            padding: '1.5rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}>
                            <h3>{challenge.title}</h3>
                            <p style={{ color: '#6b7280' }}>{challenge.description}</p>
                            <span style={{
                                display: 'inline-block',
                                marginTop: '0.5rem',
                                padding: '0.25rem 0.75rem',
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                                borderRadius: '999px',
                                fontSize: '0.875rem'
                            }}>
                                {challenge.difficulty}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default ChallengeList;
