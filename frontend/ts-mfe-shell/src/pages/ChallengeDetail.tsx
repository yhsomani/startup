import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const ChallengeDetail: React.FC = () => {
    const { challengeId } = useParams<{ challengeId: string }>();
    // Use challengeId for debugging/logging
    if (!challengeId) console.warn('No challengeId provided');

    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submissionId, setSubmissionId] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('problem');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        setError('');

        if (selectedFile) {
            // Validate file type
            if (!selectedFile.name.endsWith('.csv')) {
                setError('Invalid file type. Please upload a CSV file.');
                setFile(null);
                return;
            }

            // Validate file size (50MB limit)
            if (selectedFile.size > 50 * 1024 * 1024) {
                setError('File too large. Maximum size is 50MB.');
                setFile(null);
                return;
            }

            setFile(selectedFile);
        }
    };

    const handleSubmit = async () => {
        if (!file) return;
        setSubmitting(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post(`/challenges/${challengeId}/submit`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setSubmissionId(response.data.submissionId);
            setSubmitted(true);
        } catch (err: any) {
            console.error('Submission failed:', err);
            setError(err.response?.data?.error?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Titanic Survival Prediction</h1>

            <div style={{ marginTop: '2rem', borderBottom: '1px solid #e5e7eb' }}>
                <button
                    onClick={() => setActiveTab('problem')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'problem' ? '2px solid #4f46e5' : 'none',
                        cursor: 'pointer'
                    }}
                >
                    Problem Statement
                </button>
                <button
                    onClick={() => setActiveTab('leaderboard')}
                    style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeTab === 'leaderboard' ? '2px solid #4f46e5' : 'none',
                        cursor: 'pointer'
                    }}
                >
                    Leaderboard
                </button>
            </div>

            {activeTab === 'problem' && (
                <div style={{ marginTop: '2rem' }}>
                    <h3>Problem Statement</h3>
                    <p>Predict survival on the Titanic using machine learning.</p>

                    <button
                        style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#4f46e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Download Dataset
                    </button>

                    <div style={{ marginTop: '2rem' }}>
                        <h4>Upload Solution</h4>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept=".csv"
                            aria-label="Upload solution"
                            style={{ display: 'block', marginTop: '0.5rem' }}
                        />

                        {file && (
                            <p style={{ marginTop: '0.5rem', color: '#10b981' }}>{file.name}</p>
                        )}

                        {error && (
                            <p data-testid="error-message" style={{ marginTop: '0.5rem', color: '#dc2626' }}>{error}</p>
                        )}

                        {submitted && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                backgroundColor: '#def7ec',
                                borderRadius: '4px'
                            }}>
                                <p style={{ color: '#03543f' }}>Submission Queued</p>
                                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Submission ID: {submissionId}</p>
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={!file || submitting || !!error}
                            style={{
                                marginTop: '1rem',
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: (!file || submitting || !!error) ? 'not-allowed' : 'pointer',
                                opacity: (!file || submitting || !!error) ? 0.5 : 1
                            }}
                        >
                            {submitting ? 'Submitting...' : 'Submit'}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'leaderboard' && (
                <div style={{ marginTop: '2rem' }}>
                    <h3>Leaderboard</h3>
                    <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Rank</th>
                                <th style={{ padding: '0.75rem', textAlign: 'left' }}>User</th>
                                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '0.75rem' }}>1</td>
                                <td style={{ padding: '0.75rem' }}>user@example.com</td>
                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>95.5</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ChallengeDetail;
