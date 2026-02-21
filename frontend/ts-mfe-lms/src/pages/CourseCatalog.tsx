import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Course, CourseListResponse } from '../types/course';
import { CourseCard } from '../components/CourseCard';

const CourseCatalog: React.FC = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setIsLoading(true);
            const response = await api.get<CourseListResponse>('/courses?isPublished=true');
            setCourses(response.data.data);
        } catch (err) {
            setError('Failed to load courses. Please try again later.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCourseClick = (id: string) => {
        navigate(`/courses/${id}`);
    };

    if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading courses...</div>;
    if (error) return <div style={{ padding: '2rem', color: 'red', textAlign: 'center' }}>{error}</div>;

    return (
        <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>Explore Courses</h1>
                <p style={{ color: '#6b7280' }}>Discover new skills and advance your career.</p>
            </div>

            {courses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                    No courses found. Check back later!
                </div>
            ) : (
                <div className="course-grid">
                    {courses.map(course => (
                        <CourseCard key={course.id} course={course} onClick={handleCourseClick} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CourseCatalog;
