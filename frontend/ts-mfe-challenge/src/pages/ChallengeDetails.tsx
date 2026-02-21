import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Challenge, Submission } from '../types/challenge';
import { CollaborativeEditor } from '../components/CollaborativeEditor';

const ChallengeDetails: React.FC = () => {
    const { challengeId } = useParams<{ challengeId: string }>();
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submission, setSubmission] = useState<Submission | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!challengeId) return;
            try {
                const response = await api.get(`/challenges/${challengeId}`);
                setChallenge(response.data);
            } catch (error) {
                console.error("Failed to load details", error);
            }
        };
        fetchDetails();
    }, [challengeId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files ? e.target.files[0] : null;
        setError(null);
        setFile(null);

        if (!selectedFile) return;

        // Validation
        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
        const ALLOWED_EXTS = ['.csv', '.zip', '.py'];

        if (selectedFile.size > MAX_SIZE) {
            setError("File too large. Maximum size is 10MB.");
            return;
        }

        const fileName = selectedFile.name.toLowerCase();
        const isValidExt = ALLOWED_EXTS.some(ext => fileName.endsWith(ext));

        if (!isValidExt) {
            setError("Invalid file type. Allowed: .csv, .zip, .py");
            return;
        }

        setFile(selectedFile);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !challengeId) return;

        setSubmitting(true);
        setUploadProgress(0);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post(`/challenges/${challengeId}/submit`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percent);
                    }
                }
            });
            setSubmission(response.data);
        } catch (error) {
            setError('Submission failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const [code, setCode] = useState('# Write your Python code here\nprint("Hello, TalentSphere!")');
    const [execOutput, setExecOutput] = useState('');
    const [testResults, setTestResults] = useState<{ passedTests: number; failedTests: number; totalTests: number; results: Array<{ status: string; name: string; duration: string; expected_output?: string; actual_output?: string }> } | null>(null);
    const [executing, setExecuting] = useState(false);

    if (!challenge) return <div className="p-8">Loading...</div>;

    const runCode = async () => {
        if (!challengeId) return;
        setExecuting(true);
        setExecOutput('Running...');
        setTestResults(null);
        try {
            const token = localStorage.getItem('accessToken'); // Assuming key from Shell
            const response = await api.post(`/challenges/${challengeId}/run`,
                { code, language: 'python' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = response.data;
            setExecOutput(data.stdout || data.stderr || 'No output');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            setExecOutput('Error: ' + (err.response?.data?.message || err.message || 'Unknown error'));
        } finally {
            setExecuting(false);
        }
    };

    const runTests = async () => {
        if (!challengeId) return;
        setExecuting(true);
        setExecOutput('Running tests...');
        setTestResults(null);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await api.post(`/challenges/${challengeId}/test`,
                { code, language: 'python' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setTestResults(response.data);
            setExecOutput(''); // Clear standard output focus
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            setExecOutput('Error: ' + (err.response?.data?.message || err.message || 'Unknown error'));
        } finally {
            setExecuting(false);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <div className="challenge-details-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="challenge-info-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{challenge.title}</h1>
                        <a href={`/challenges/${challenge.id}/leaderboard`} style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600 }}>
                            View Leaderboard &rarr;
                        </a>
                    </div>
                    <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '4px', marginBottom: '2rem' }}>
                        <p style={{ lineHeight: '1.6', color: '#374151' }}>{challenge.description}</p>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Submission Requirements</h3>
                        <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', color: '#4b5563' }}>
                            <li>Evaluation Metric: {challenge.evaluationMetric}</li>
                            <li>Passing Score: {challenge.passingScore}</li>
                            <li>Format: CSV or ZIP</li>
                        </ul>
                    </div>

                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '2rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Submit Solution (File)</h3>
                        {error && (
                            <div style={{ background: '#fef2f2', color: '#991b1b', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                                {error}
                            </div>
                        )}
                        {submission ? (
                            <div style={{ background: '#ecfdf5', color: '#065f46', padding: '1rem', borderRadius: '4px' }}>
                                <p><strong>Status:</strong> {submission.status.toUpperCase()}</p>
                                <p>Submission ID: {submission.id}</p>
                                <p>Check back later for results.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <input
                                        data-testid="file-input"
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".csv,.zip,.py"
                                        style={{ display: 'block', width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }}
                                    />
                                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                                        Max file size: 10MB. Allowed formats: CSV, ZIP, PY.
                                    </p>
                                </div>
                                {uploadProgress > 0 && submitting && (
                                    <div style={{ marginBottom: '1rem', width: '100%', background: '#e5e7eb', borderRadius: '9999px', height: '0.5rem' }}>
                                        <div style={{ background: '#4f46e5', height: '0.5rem', borderRadius: '9999px', width: `${uploadProgress}%`, transition: 'width 0.3s' }}></div>
                                        <p style={{ textAlign: 'right', fontSize: '0.75rem', color: '#4b5563' }}>{uploadProgress}%</p>
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    disabled={!file || submitting}
                                    style={{
                                        backgroundColor: '#4f46e5',
                                        color: 'white',
                                        padding: '0.75rem 2rem',
                                        borderRadius: '6px',
                                        border: 'none',
                                        fontWeight: 600,
                                        cursor: submitting ? 'wait' : 'pointer',
                                        opacity: submitting || !file ? 0.7 : 1
                                    }}
                                >
                                    {submitting ? 'Uploading...' : 'Submit File'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <div className="challenge-editor-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Code Executor</h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={runCode} disabled={executing} style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                ▶️ Run
                            </button>
                            <button onClick={runTests} disabled={executing} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                                🧪 Test
                            </button>
                        </div>
                    </div>

                    <div style={{ border: '1px solid #d1d5db', borderRadius: '4px', height: '500px', background: '#1e1e1e', marginBottom: '1rem' }}>
                        <CollaborativeEditor
                            roomId={challengeId || 'lobby'}
                            userName={`User-${Math.floor(Math.random() * 1000)}`}
                            initialValue={code}
                            onChange={(val) => setCode(val || '')}
                        />
                    </div>

                    {/* Output Console */}
                    <div style={{ background: '#1e1e1e', color: '#d1d5db', padding: '1rem', borderRadius: '4px', minHeight: '150px', maxHeight: '300px', overflowY: 'auto', fontFamily: 'monospace' }}>
                        <div style={{ color: '#9ca3af', borderBottom: '1px solid #374151', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>Console Output</div>
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{execOutput}</pre>

                        {testResults && (
                            <div style={{ marginTop: '1rem', borderTop: '1px solid #374151', paddingTop: '1rem' }}>
                                <div style={{ fontWeight: 600, color: testResults.failedTests === 0 ? '#10b981' : '#ef4444' }}>
                                    Test Results: {testResults.passedTests}/{testResults.totalTests} Passed
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    {testResults.results?.map((res: { status: string; name: string; duration: string; expected_output?: string; actual_output?: string }, idx: number) => (
                                        <div key={idx} style={{ background: res.status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px', borderLeft: `3px solid ${res.status === 'success' ? '#10b981' : '#ef4444'}` }}>
                                            <div style={{ fontWeight: 600 }}>Tests Case #{idx + 1}: {res.status === 'success' ? 'PASS' : 'FAIL'}</div>
                                            {res.status !== 'success' && (
                                                <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                                    <div>Expected: {res.expected_output}</div>
                                                    <div>Actual: {res.actual_output}</div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChallengeDetails;
