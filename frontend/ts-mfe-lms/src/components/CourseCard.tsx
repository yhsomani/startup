import React from 'react';
import { Course } from '../types/course';

interface CourseCardProps {
    course: Course;
    onClick: (id: string) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onClick }) => {
    return (
        <div onClick={() => onClick(course.id)} className="course-card">
            <div className="course-thumbnail">
                {course.thumbnailUrl ? (
                    <img src={course.thumbnailUrl} alt={course.title} />
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
                        No Image
                    </div>
                )}
            </div>

            <div className="course-content">
                <div className="instructor-name">
                    {course.instructorName || 'Unknown Instructor'}
                </div>

                <h3 className="course-title">
                    {course.title}
                </h3>

                <p className="course-subtitle">
                    {course.subtitle}
                </p>

                <div className="course-footer">
                    <div className="course-price">
                        {course.price === 0 ? 'Free' : `${course.currency} ${course.price}`}
                    </div>
                </div>
            </div>
        </div>
    );
};


