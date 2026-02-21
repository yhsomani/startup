import React, { useState } from 'react';

interface Candidate {
    id: string;
    name: string;
    role: string;
    skills: string[];
    percentile: number;
}

export const RecruiterDashboard: React.FC = () => {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [searchSkill, setSearchSkill] = useState('');
    const [minPercentile, setMinPercentile] = useState(80);
    const [loading, setLoading] = useState(false);

    const searchCandidates = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                ...(searchSkill && { skill: searchSkill }),
                min_percentile: minPercentile.toString()
            });

            const response = await fetch(`http://localhost:8000/api/v1/candidates/search?${params}`);
            const data = await response.json();
            setCandidates(data);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const viewResume = async (candidateId: string) => {
        try {
            const response = await fetch(`http://localhost:8000/api/v1/candidates/${candidateId}/verified-resume`);
            const data = await response.json();

            // Open in new window or show modal
            alert(JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Resume error:', error);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>
                🏢 Talent Search
            </h1>

            {/* Search Controls */}
            <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginBottom: '2rem'
            }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'end' }}>
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Skill
                        </label>
                        <input
                            type="text"
                            value={searchSkill}
                            onChange={(e) => setSearchSkill(e.target.value)}
                            placeholder="e.g., Python, React, Java"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '6px'
                            }}
                        />
                    </div>

                    <div style={{ minWidth: '150px' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                            Min Percentile
                        </label>
                        <input
                            type="number"
                            value={minPercentile}
                            onChange={(e) => setMinPercentile(Number(e.target.value))}
                            min="0"
                            max="100"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '6px'
                            }}
                        />
                    </div>

                    <button
                        onClick={searchCandidates}
                        disabled={loading}
                        style={{
                            padding: '0.75rem 2rem',
                            background: '#4f46e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: loading ? 'wait' : 'pointer',
                            fontWeight: 600
                        }}
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Results */}
            {candidates.length > 0 && (
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
                        {candidates.length} Candidates Found
                    </h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {candidates.map(candidate => (
                            <div
                                key={candidate.id}
                                style={{
                                    background: 'white',
                                    padding: '1.5rem',
                                    borderRadius: '12px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: '1rem'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                                            {candidate.name}
                                        </h3>
                                        <span style={{
                                            background: '#eef2ff',
                                            color: '#4f46e5',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '12px',
                                            fontSize: '0.875rem',
                                            fontWeight: 500
                                        }}>
                                            Top {100 - candidate.percentile}%
                                        </span>
                                    </div>
                                    <div style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                                        {candidate.role}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {candidate.skills.map(skill => (
                                            <span
                                                key={skill}
                                                style={{
                                                    background: '#f3f4f6',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.875rem'
                                                }}
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => viewResume(candidate.id)}
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        background: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    View Resume
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {candidates.length === 0 && !loading && (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: '#6b7280'
                }}>
                    Search for verified candidates by skill and percentile
                </div>
            )}
        </div>
    );
};
