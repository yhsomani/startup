import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const CourseBrowse: React.FC = () => {
    const [courses, setCourses] = useState<any[]>([]);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get('/courses');
                setCourses(response.data);
            } catch (error) {
                console.error('Error loading courses:', error);
                // Fallback to mock data
                setCourses([
                    {
                        id: 'course-1',
                        title: 'Test Course',
                        description: 'Test Description',
                        price: 49.99,
                        thumbnailUrl: 'https://via.placeholder.com/300x200'
                    }
                ]);
            }
        };

        fetchCourses();
    }, []);

    return (
        <div style={{ padding: '2rem' }}>
            <h1>Browse Courses</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                {courses.map(course => (
                    <Link key={course.id} to={`/courses/${course.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}>
                            <img src={course.thumbnailUrl} alt={course.title} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                            <div style={{ padding: '1rem' }}>
                                <h3>{course.title}</h3>
                                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{course.description}</p>
                                <p style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>${course.price}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default CourseBrowse;
