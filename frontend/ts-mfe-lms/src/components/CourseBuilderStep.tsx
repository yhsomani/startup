import React from 'react';

interface CourseBuilderStepProps {
  courseData: any;
  updateCourseData: (newData: any) => void;
}

// This is a placeholder component that will be replaced by specific step components
export const CourseBuilderStep: React.FC<CourseBuilderStepProps> = () => {
  return (
    <div>
      <h2>Course Builder Step</h2>
      <p>This component will be replaced by specific step components.</p>
    </div>
  );
};
