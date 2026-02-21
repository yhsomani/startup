import React from 'react';

interface CourseBasicInfoProps {
  courseData: any;
  updateCourseData: (newData: any) => void;
}

export const CourseBasicInfo: React.FC<CourseBasicInfoProps> = ({ courseData, updateCourseData }) => {
  const categories = [
    'Programming',
    'Web Development',
    'Mobile Development',
    'Data Science',
    'Machine Learning',
    'DevOps',
    'Design',
    'Business',
    'Marketing',
    'Other'
  ];

  const levels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const languages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Chinese',
    'Japanese',
    'Other'
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
        Basic Course Information
      </h2>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {/* Title */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Course Title *
          </label>
          <input
            type="text"
            required
            value={courseData.title}
            onChange={(e) => updateCourseData({ title: e.target.value })}
            placeholder="Enter a compelling course title"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Keep it under 60 characters for best results
          </p>
        </div>

        {/* Subtitle */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Subtitle
          </label>
          <input
            type="text"
            value={courseData.subtitle}
            onChange={(e) => updateCourseData({ subtitle: e.target.value })}
            placeholder="A short description that appears under your title"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        {/* Description */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Course Description *
          </label>
          <textarea
            required
            value={courseData.description}
            onChange={(e) => updateCourseData({ description: e.target.value })}
            placeholder="Provide a detailed description of your course"
            rows={6}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem',
              resize: 'vertical'
            }}
          />
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Minimum 200 characters. Include learning objectives and target audience.
          </p>
        </div>

        {/* Category and Level */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Category *
            </label>
            <select
              required
              value={courseData.category}
              onChange={(e) => updateCourseData({ category: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Level *
            </label>
            <select
              required
              value={courseData.level}
              onChange={(e) => updateCourseData({ level: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            >
              {levels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Language and Thumbnail */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Language *
            </label>
            <select
              required
              value={courseData.language}
              onChange={(e) => updateCourseData({ language: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            >
              {languages.map(language => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Thumbnail URL
            </label>
            <input
              type="url"
              value={courseData.thumbnail}
              onChange={(e) => updateCourseData({ thumbnail: e.target.value })}
              placeholder="https://example.com/thumbnail.jpg"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>
        </div>

        {/* Pricing */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Price
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={courseData.price}
              onChange={(e) => updateCourseData({ price: Number(e.target.value) })}
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Currency
            </label>
            <select
              value={courseData.currency}
              onChange={(e) => updateCourseData({ currency: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="INR">INR</option>
            </select>
          </div>
        </div>

        {/* Tips */}
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          padding: '1rem',
          marginTop: '1rem'
        }}>
          <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#0369a1' }}>
            💡 Pro Tips
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#0c4a6e', fontSize: '0.875rem' }}>
            <li>Use clear, descriptive titles that include keywords students might search for</li>
            <li>Your description should clearly state what students will be able to do after completing the course</li>
            <li>Include specific topics, tools, or technologies covered</li>
            <li>Set competitive pricing by researching similar courses in your category</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
