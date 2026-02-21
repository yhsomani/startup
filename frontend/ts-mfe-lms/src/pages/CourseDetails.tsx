import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Course } from '../types/course';
import { progressService } from '../services/progressService';
import ReviewForm from '../components/ReviewForm';
import ReviewList from '../components/ReviewList';
import PaymentForm from '../components/PaymentForm';

const CourseDetails: React.FC = () => {
    const navigate = useNavigate();
    const { courseId } = useParams<{ courseId: string }>();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    useEffect(() => {
        const fetchCourseAndStatus = async () => {
            try {
                if (!courseId) return;

                // Parallel fetch
                const coursePromise = api.get<Course>(`/courses/${courseId}`);

                const userId = localStorage.getItem('userId');
                let enrolled = false;
                if (userId) {
                    const enrollment = await progressService.getEnrollment(courseId, userId);
                    if (enrollment) enrolled = true;
                }

                const response = await coursePromise;
                setCourse(response.data);
                setIsEnrolled(enrolled);

            } catch (err) {
                setError('Failed to load course details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourseAndStatus();
    }, [courseId]);

    const handleEnroll = async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            alert("Please log in to enroll.");
            return;
        }

        if (!courseId) return;

        setEnrolling(true);
        try {
            await progressService.enroll(courseId, userId);
            setIsEnrolled(true);
        } catch (err) {
            alert("Failed to enroll.");
        } finally {
            setEnrolling(false);
        }
    };

    const handlePaymentSuccess = () => {
        setPaymentSuccess(true);
        setTimeout(() => setPaymentSuccess(false), 5000);
    };

    const handlePaymentError = (error: string) => {
        setError(error);
        setTimeout(() => setError(null), 5000);
    };

    if (loading) return <div style={{ padding: '2rem' }}>Loading course...</div>;
    if (error || !course) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error || 'Course not found'}</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            {/* Course Header */}
            <div style={{ background: '#1f2937', color: 'white', padding: '3rem', borderRadius: '12px', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>{course.title}</h1>
                <p style={{ fontSize: '1.25rem', color: '#d1d5db', marginBottom: '2rem', maxWidth: '800px' }}>{course.subtitle}</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                        {course.currency} {course.price}
                    </div>
                    {isEnrolled ? (
                        <button
                            onClick={() => navigate(`${courseId}/learn`)}
                            style={{
                                backgroundColor: '#10b981',
                                color: 'white',
                                padding: '0.75rem 2rem',
                                borderRadius: '6px',
                                border: 'none',
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                cursor: 'pointer'
                            }}>
                            Continue Learning
                        </button>
                    ) : (
                        <button
                            onClick={handleEnroll}
                            disabled={enrolling}
                            style={{
                                backgroundColor: '#4f46e5',
                                color: 'white',
                                padding: '0.75rem 2rem',
                                borderRadius: '6px',
                                border: 'none',
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                cursor: enrolling ? 'wait' : 'pointer',
                                opacity: enrolling ? 0.7 : 1
                            }}>
                            {enrolling ? 'Enrolling...' : 'Enroll Now'}
                        </button>
                    )}
                </div>
            </div>

            {/* Success Message */}
            {paymentSuccess && (
                <div style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #10b981',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '2rem',
                    textAlign: 'center',
                    color: '#065f46'
                }}>
                    <strong>✅ Payment Successful!</strong> You now have full access to this course.
                </div>
            )}

            {/* Main Content Layout */}
            <div className="details-layout" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                {/* Left Column: Description & Curriculum */}
                <div>
                    <section style={{ marginBottom: '3rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>About This Course</h2>
                        <div style={{ lineHeight: '1.6', color: '#374151' }}>
                            {course.description || 'No description available.'}
                        </div>
                    </section>

                    <section>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Course Content</h2>
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                            {course.sections && course.sections.length > 0 ? (
                                course.sections.map((section) => (
                                    <div key={section.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <div style={{ padding: '1rem', background: '#f9fafb', fontWeight: 600 }}>
                                            {section.title}
                                        </div>
                                        <div>
                                            {section.lessons && section.lessons.map((lesson) => (
                                                <div key={lesson.id} style={{
                                                    padding: '0.75rem 1rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    borderTop: '1px solid #f3f4f6',
                                                    cursor: 'pointer'
                                                }}>
                                                    <span style={{ fontSize: '1.2rem' }}>
                                                        {lesson.type === 'video' ? '📺' : lesson.type === 'quiz' ? '📝' : '📄'}
                                                    </span>
                                                    <span>{lesson.title}</span>
                                                    <span style={{ marginLeft: 'auto', color: '#6b7280', fontSize: '0.9rem' }}>
                                                        {lesson.duration ? `${Math.round(lesson.duration / 60)} min` : ''}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                                    No content uploaded yet.
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Right Column: Instructor / Payment */}
                <div>
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Instructor</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '48px', height: '48px', background: '#e5e7eb', borderRadius: '50%' }}></div>
                            <div>
                                <div style={{ fontWeight: 500 }}>{course.instructorName || 'TalentSphere Instructor'}</div>
                                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Senior Developer</div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Section */}
                    {!isEnrolled && course.price > 0 && (
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
                                Get Full Course Access
                            </h3>
                            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                Purchase this course to access all content permanently.
                            </p>
                            <PaymentForm
                                courseId={courseId}
                                courseTitle={course.title}
                                amount={course.price}
                                currency={course.currency}
                                onPaymentSuccess={handlePaymentSuccess}
                                onPaymentError={handlePaymentError}
                                isEnrolled={isEnrolled}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Discussions Section */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '2rem',
                marginTop: '2rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
                    💬 Course Discussions
                </h2>
                <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                    Join the conversation, ask questions, and share insights with fellow learners.
                </p>
                <Link
                    to={`/courses/${courseId}/discussions`}
                    style={{
                        display: 'inline-block',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: '#4f46e5',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '1rem'
                    }}
                >
                    View All Discussions
                </Link>
            </div>

            {/* Reviews Section */}
            <div id="reviews-section" style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '2rem',
                marginTop: '2rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <ReviewList courseId={courseId!} userCanReview={isEnrolled} />

                {showReviewForm && (
                    <div style={{
                        marginTop: '2rem',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                                Write a Review
                            </h3>
                            <button
                                onClick={() => setShowReviewForm(false)}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    backgroundColor: '#f3f4f6',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <ReviewForm
                            courseId={courseId!}
                            onReviewSubmitted={() => {
                                setShowReviewForm(false);
                                // Refresh reviews list
                                window.location.reload();
                            }}
                            isEnrolled={isEnrolled}
                        />
                    </div>
                )}

                {!showReviewForm && isEnrolled && (
                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <button
                            onClick={() => setShowReviewForm(true)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: '#4f46e5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Write a Review
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseDetails;