import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

const CoursePlayer: React.FC = () => {
    useParams<{ courseId: string }>();
    const [progress, setProgress] = useState(0);

    const handleMarkComplete = () => {
        setProgress(50);
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Lesson 1</h1>
            <p>Course content goes here...</p>

            <div style={{ marginTop: '2rem' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                    <span>{progress}% Complete</span>
                </div>
                <button
                    onClick={handleMarkComplete}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#4f46e5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Mark Complete
                </button>
            </div>
        </div>
    );
};

export default CoursePlayer;
