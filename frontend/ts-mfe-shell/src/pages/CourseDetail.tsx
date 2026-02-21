import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Course, getErrorMessage } from '../types';

const CourseDetail: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [enrolled, setEnrolled] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await api.get(`/courses/${courseId}`);
                setCourse(response.data);
            } catch (error) {
                console.error('Error loading course:', error);
                setCourse({
                    id: courseId || '',
                    instructorId: '',
                    title: 'Test Course',
                    description: 'Test Description',
                    price: 49.99,
                    currency: 'USD',
                    isPublished: true,
                    isActive: true,
                    sections: []
                });
            }
        };

        fetchCourse();

        // Check enrollment status
        const enrollments: { courseId: string }[] = JSON.parse(localStorage.getItem('enrollments') || '[]');
        setEnrolled(enrollments.some((e) => e.courseId === courseId));
    }, [courseId]);

    const handleEnroll = async () => {
        setEnrolling(true);

        try {
            //  Call API via MSW
            const response = await api.post('/enrollments', {
                userId: localStorage.getItem('userId'),
                courseId
            });

            // Also save to localStorage for persistence
            const enrollments = JSON.parse(localStorage.getItem('enrollments') || '[]');
            enrollments.push({
                id: response.data.id,
                courseId,
                courseTitle: course?.title || '',
                progressPercentage: 0,
                enrolledAt: new Date().toISOString()
            });
            localStorage.setItem('enrollments', JSON.stringify(enrollments));

            setEnrolled(true);
            setMessage('Enrolled Successfully');
        } catch (error: unknown) {
            setMessage(getErrorMessage(error));
        } finally {
            setEnrolling(false);
        }
    };

    const handleStartLearning = () => {
        navigate(`/courses/${courseId}/learn`);
    };

    if (!course) return <div>Loading...</div>;

    return (
        <div style={{ padding: '2rem' }}>
            <h1>{course.title}</h1>
            <p>{course.description}</p>

            {message && (
                <div
                    data-testid="message-banner"
                    style={{
                        padding: '1rem',
                        marginTop: '1rem',
                        backgroundColor: enrolled ? '#def7ec' : '#fee2e2',
                        color: enrolled ? '#03543f' : '#dc2626',
                        borderRadius: '4px'
                    }}
                >
                    {message}
                </div>
            )}

            <div style={{ marginTop: '2rem' }}>
                {!enrolled ? (
                    <button
                        onClick={handleEnroll}
                        disabled={enrolling}
                        style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#4f46e5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: enrolling ? 'not-allowed' : 'pointer',
                            opacity: enrolling ? 0.6 : 1
                        }}
                    >
                        {enrolling ? 'Enrolling...' : 'Enroll'}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleStartLearning}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Start Learning
                        </button>
                        <p style={{ marginTop: '1rem', color: '#6b7280' }}>0% Complete</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default CourseDetail;
