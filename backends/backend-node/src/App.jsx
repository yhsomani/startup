import React, { useState, useEffect } from 'react';

const App = () => {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3001/api/candidates')
            .then((res) => res.json())
            .then((data) => {
                setCandidates(data.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to fetch candidates:', err);
                setLoading(false);
            });
    }, []);

    return (
        <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
            <header style={{ marginBottom: '2rem' }}>
                <h1 style={{ color: '#2c3e50' }}>TalentSphere</h1>
                <p>Candidate Management Portal</p>
            </header>

            {loading ? (
                <p>Loading candidates...</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                    {candidates.map((candidate) => (
                        <div key={candidate.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0' }}>{candidate.name}</h3>
                            <p style={{ margin: '0', color: '#666' }}>{candidate.role}</p>
                            <span style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.25rem 0.5rem', background: '#e3f2fd', color: '#1565c0', borderRadius: '4px', fontSize: '0.875rem' }}>
                                {candidate.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default App;