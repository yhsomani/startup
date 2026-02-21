import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Course, Lesson } from '../types/course';
import { progressService } from '../services/progressService';
import { certificateService } from '../services/certificateService';
import { VideoPlayer } from '../components/VideoPlayer';

const CoursePlayer: React.FC = () => {
    const navigate = useNavigate();
    const { courseId } = useParams<{ courseId: string }>();
    const [course, setCourse] = useState<Course | null>(null);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [completedLessons, setCompletedLessons] = useState<string[]>([]);
    const [certificateAvailable, setCertificateAvailable] = useState(false);
    const [enrollmentId, setEnrollmentId] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                if (!courseId) return;

                // Fetch course structure
                const response = await api.get<Course>(`/courses/${courseId}`);
                setCourse(response.data);

                // Fetch progress
                const userId = localStorage.getItem('userId');
                if (userId) {
                    const enrollment = await progressService.getEnrollment(courseId, userId);
                    if (enrollment) {
                        setCompletedLessons(enrollment.completedLessons);
                        setEnrollmentId(enrollment.id);

                        // Check if 100% complete
                        let total = 0;
                        response.data.sections?.forEach(s => total += s.lessons.length);
                        if (enrollment.completedLessons.length >= total && total > 0) {
                            setCertificateAvailable(true);
                        }
                    }
                }

                // Set default active lesson (first one)
                if (response.data.sections && response.data.sections.length > 0) {
                    const firstLesson = response.data.sections[0].lessons[0];
                    if (firstLesson) setActiveLesson(firstLesson);
                }

            } catch (err) {
                console.error("Failed to load course player", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [courseId]);

    const handleLessonSelect = (lesson: Lesson) => {
        setActiveLesson(lesson);
    };

    const handleMarkComplete = async () => {
        if (!activeLesson || !courseId || !course) return;

        const userId = localStorage.getItem('userId');
        if (!userId) return;

        // Count total lessons
        let totalLessons = 0;
        course.sections?.forEach(s => totalLessons += s.lessons.length);

        const enrollment = await progressService.getEnrollment(courseId, userId);
        if (enrollment) {
            await progressService.completeLesson(enrollment.id, activeLesson.id);
            const newCompleted = [...completedLessons, activeLesson.id];
            setCompletedLessons(newCompleted);

            // Check if now 100% complete
            let total = 0;
            course.sections?.forEach(s => total += s.lessons.length);
            if (newCompleted.length >= total) {
                setCertificateAvailable(true);
            }
        }
    };

    const handleDownloadCertificate = async () => {
        if (!enrollmentId) return;
        try {
            const cert = await certificateService.getCertificate(enrollmentId);
            if (cert) {
                const fileName = cert.certificateUrl.split('/').pop() || `certificate_${enrollmentId}.pdf`;
                await certificateService.downloadCertificate(fileName);
            }
        } catch (err) {
            console.error("Failed to download certificate", err);
            alert("Failed to download certificate. Please try again later.");
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading player...</div>;
    if (!course) return <div style={{ padding: '2rem' }}>Course not found.</div>;

    return (
        <div className="player-layout">
            {/* Sidebar */}
            <div className="player-sidebar">
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{course.title}</h2>
                    <button onClick={() => navigate('..')} style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        ← Back to Course Info
                    </button>

                    {certificateAvailable && (
                        <button
                            onClick={handleDownloadCertificate}
                            style={{
                                marginTop: '1rem',
                                width: '100%',
                                padding: '0.6rem',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <span>🎓</span> Download Certificate
                        </button>
                    )}
                </div>
                <div>
                    {course.sections?.map(section => (
                        <div key={section.id}>
                            <div style={{ padding: '1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: '0.95rem' }}>
                                {section.title}
                            </div>
                            <div>
                                {section.lessons.map(lesson => {
                                    const isActive = activeLesson?.id === lesson.id;
                                    const isCompleted = completedLessons.includes(lesson.id);
                                    return (
                                        <div
                                            key={lesson.id}
                                            onClick={() => handleLessonSelect(lesson)}
                                            style={{
                                                padding: '0.75rem 1rem',
                                                borderBottom: '1px solid #f3f4f6',
                                                cursor: 'pointer',
                                                background: isActive ? '#eef2ff' : 'white',
                                                borderLeft: isActive ? '4px solid #4f46e5' : '4px solid transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                border: isCompleted ? 'none' : '2px solid #d1d5db',
                                                background: isCompleted ? '#10b981' : 'transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '0.8rem'
                                            }}>
                                                {isCompleted && '✓'}
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: isActive ? '#1f2937' : '#4b5563' }}>
                                                {lesson.title}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="player-content">
                {activeLesson ? (
                    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '2rem' }}>{activeLesson.title}</h1>

                        {activeLesson.type === 'video' && activeLesson.videoUrl && (
                            <div className="mb-8">
                                <VideoPlayer url={activeLesson.videoUrl} />
                            </div>
                        )}

                        <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            {activeLesson.content ? (
                                <div>{activeLesson.content}</div>
                            ) : (
                                <div style={{ color: '#6b7280' }}>No additional text content for this lesson. Watch the video above!</div>
                            )}

                            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
                                {completedLessons.includes(activeLesson.id) ? (
                                    <button disabled style={{ padding: '0.75rem 2rem', background: '#d1d5db', color: '#374151', borderRadius: '6px', border: 'none', fontWeight: 600 }}>
                                        Completed
                                    </button>
                                ) : (
                                    <button onClick={handleMarkComplete} style={{ padding: '0.75rem 2rem', background: '#4f46e5', color: 'white', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                                        Mark as Complete
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280' }}>
                        Select a lesson to start learning.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoursePlayer;
