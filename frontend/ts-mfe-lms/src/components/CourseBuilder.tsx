import React, { useState } from 'react';

import { CourseBasicInfo } from './CourseBasicInfo';
import { SectionEditor } from './SectionEditor';
import { CourseSettings } from './CourseSettings';
import { CoursePreview } from './CoursePreview';
import api from '../services/api';

interface CourseData {
  title: string;
  subtitle: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  level: string;
  language: string;
  thumbnail: string;
  sections: Section[];
  isPublished: boolean;
}

interface Section {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order: number;
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  content: any;
  duration: number;
  order: number;
  isPreview: boolean;
}

const CourseBuilder: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [courseData, setCourseData] = useState<CourseData>({
    title: '',
    subtitle: '',
    description: '',
    price: 0,
    currency: 'USD',
    category: '',
    level: 'beginner',
    language: 'English',
    thumbnail: '',
    sections: [],
    isPublished: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { title: 'Basic Info', component: CourseBasicInfo },
    { title: 'Course Content', component: SectionEditor },
    { title: 'Settings', component: CourseSettings },
    { title: 'Preview & Publish', component: CoursePreview }
  ];

  const updateCourseData = (newData: Partial<CourseData>) => {
    setCourseData(prev => ({ ...prev, ...newData }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async (publish: boolean = false) => {
    setIsLoading(true);
    setError(null);

    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('You must be logged in to create a course.');
      setIsLoading(false);
      return;
    }

    try {
      const courseToSave = {
        ...courseData,
        isPublished: publish,
        instructorId: userId
      };

      const response = await api.post(`/courses?instructorId=${userId}`, courseToSave);

      if (publish) {
        // Navigate to course details or dashboard
        window.location.href = `/courses/${response.data.id}`;
      } else {
        // Show success message and stay on page
        alert('Course saved successfully!');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save course');
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
          Course Builder
        </h1>
        <p style={{ color: '#6b7280' }}>
          Create an engaging course with our step-by-step wizard
        </p>
      </div>

      {/* Step Navigation */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          {steps.map((step, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                textAlign: 'center',
                position: 'relative'
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: index <= currentStep ? '#4f46e5' : '#e5e7eb',
                  color: index <= currentStep ? 'white' : '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.5rem',
                  fontWeight: 600
                }}
              >
                {index + 1}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                {step.title}
              </div>
              {index < steps.length - 1 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: '-50%',
                    width: '100%',
                    height: '2px',
                    backgroundColor: index < currentStep ? '#4f46e5' : '#e5e7eb',
                    zIndex: -1
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      {/* Current Step Component */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <CurrentStepComponent
          courseData={courseData}
          updateCourseData={updateCourseData}
        />
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
            opacity: currentStep === 0 ? 0.5 : 1
          }}
        >
          Previous
        </button>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => handleSave(false)}
            disabled={isLoading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            {isLoading ? 'Saving...' : 'Save Draft'}
          </button>

          {currentStep === steps.length - 1 ? (
            <button
              onClick={() => handleSave(true)}
              disabled={isLoading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1
              }}
            >
              {isLoading ? 'Publishing...' : 'Publish Course'}
            </button>
          ) : (
            <button
              onClick={handleNext}
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
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseBuilder;