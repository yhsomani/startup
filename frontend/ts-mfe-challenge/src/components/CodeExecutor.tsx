import React, { useState } from 'react';
import api from '../services/api';

interface CodeExecutorProps {
    challengeId: string;
}

export const CodeExecutor: React.FC<CodeExecutorProps> = ({ challengeId }) => {
    const [code, setCode] = useState('# Write your Python code here\nprint("Hello, TalentSphere!")');
    const [output, setOutput] = useState('');
    const [testResults, setTestResults] = useState<{ passedTests: number; totalTests: number; results: Array<{ status: string; name: string; duration: string }> } | null>(null);
    const [loading, setLoading] = useState(false);

    const runCode = async () => {
        setLoading(true);
        try {
            // Use the centralized API client which handles base URL and auth tokens
            const response = await api.post(`/challenges/${challengeId}/run`, {
                code,
                language: 'python'
            });
            const data = response.data;
            setOutput(data.stdout || data.stderr);
        } catch (error) {
            setOutput('Error: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const runTests = async () => {
        setLoading(true);
        try {
            const response = await api.post(`/challenges/${challengeId}/test`, { code });
            const data = response.data;
            setTestResults(data);
        } catch (error) {
            setOutput('Error: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                    onClick={runCode}
                    disabled={loading}
                    style={{
                        padding: '0.5rem 1rem',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'wait' : 'pointer'
                    }}
                >
                    ▶️ Run Code
                </button>
                <button
                    onClick={runTests}
                    disabled={loading}
                    style={{
                        padding: '0.5rem 1rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'wait' : 'pointer'
                    }}
                >
                    🧪 Run Tests
                </button>
            </div>

            <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{
                    flex: 1,
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    padding: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    resize: 'none'
                }}
            />

            {output && (
                <div style={{
                    background: '#1f2937',
                    color: '#10b981',
                    padding: '1rem',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap'
                }}>
                    <strong>Output:</strong>
                    <br />
                    {output}
                </div>
            )}

            {testResults && (
                <div style={{
                    background: '#f3f4f6',
                    padding: '1rem',
                    borderRadius: '6px'
                }}>
                    <strong>Test Results: {testResults.passedTests}/{testResults.totalTests} Passed</strong>
                    <div style={{ marginTop: '0.5rem' }}>
                        {testResults.results?.map((result, idx: number) => (
                            <div key={idx} style={{
                                padding: '0.5rem',
                                marginTop: '0.25rem',
                                background: result.status === 'passed' ? '#d1fae5' : '#fee2e2',
                                borderRadius: '4px'
                            }}>
                                {result.status === 'passed' ? '✅' : '❌'} {result.name} ({result.duration})
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
