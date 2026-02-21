import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { CreateDiscussionRequest, DiscussionType } from '../types/discussion';

const CreateDiscussion: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [courseTitle, setCourseTitle] = useState('');
  const [formData, setFormData] = useState<CreateDiscussionRequest>({
    title: '',
    content: '',
    courseId: courseId || '',
    type: DiscussionType.General
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourseInfo();
      setFormData(prev => ({ ...prev, courseId }));
    }
  }, [courseId]);

  const fetchCourseInfo = async () => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      setCourseTitle(response.data.title);
    } catch (err) {
      console.error('Failed to fetch course info:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await api.post('/discussions', formData);
      
      // Navigate to the newly created discussion
      navigate(`/courses/${courseId}/discussions/${response.data.id}`, {
        state: { message: 'Discussion created successfully!' }
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create discussion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const discussionTypes = [
    { value: DiscussionType.General, label: '💬 General Discussion', description: 'General course-related discussions' },
    { value: DiscussionType.Question, label: '❓ Question', description: 'Ask questions about course content' },
    { value: DiscussionType.Resource, label: '📚 Resource', description: 'Share helpful resources and materials' },
    { value: DiscussionType.Announcement, label: '📢 Announcement', description: 'Important announcements and updates' },
    { value: DiscussionType.Assignment, label: '📝 Assignment', description: 'Assignment-related discussions' }
  ];

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const charCount = formData.content.length;
  const wordCount = getWordCount(formData.content);
  const isContentTooShort = charCount < 10 || wordCount < 3;
  const isContentTooLong = charCount > 5000;

  if (!courseId) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <h2>Course ID is required</h2>
        <Link to="/courses" style={{ color: '#4f46e5', textDecoration: 'none' }}>
          ← Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <Link
          to={`/courses/${courseId}/discussions`}
          style={{ color: '#4f46e5', textDecoration: 'none', fontSize: '0.9rem' }}
        >
          ← Back to Discussions
        </Link>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', marginTop: '1rem' }}>
          Create New Discussion
        </h1>
        {courseTitle && (
          <p style={{ color: '#6b7280', fontSize: '1rem' }}>
            Course: {courseTitle}
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '2rem',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      {/* Form */}
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Discussion Type Selection */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>
              Discussion Type
            </label>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {discussionTypes.map(type => (
                <label
                  key={type.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    border: formData.type === type.value ? '2px solid #4f46e5' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: formData.type === type.value ? '#f8faff' : 'white',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={formData.type === type.value}
                    onChange={handleInputChange}
                    style={{ margin: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                      {type.label}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {type.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: '2rem' }}>
            <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: 600 }}>
              Discussion Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter a clear and descriptive title..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                marginBottom: '0.5rem'
              }}
              required
              minLength={5}
              maxLength={200}
            />
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              {formData.title.length}/200 characters minimum 5 characters
            </div>
          </div>

          {/* Content */}
          <div style={{ marginBottom: '2rem' }}>
            <label htmlFor="content" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.125rem', fontWeight: 600 }}>
              Discussion Content *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Share your thoughts, questions, or resources..."
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                lineHeight: '1.4',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              required
              minLength={10}
              maxLength={5000}
            />
            <div style={{
              fontSize: '0.875rem',
              color: isContentTooShort || isContentTooLong ? '#ef4444' : '#6b7280',
              marginTop: '0.5rem'
            }}>
              {charCount}/5000 characters • {wordCount} words
              {isContentTooShort && ' • Minimum 10 characters and 3 words required'}
              {isContentTooLong && ' • Character limit exceeded'}
            </div>
          </div>

          {/* Guidelines */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
              Discussion Guidelines
            </h3>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.6' }}>
              <li>Be respectful and constructive in your discussions</li>
              <li>Keep discussions relevant to the course topic</li>
              <li>Search existing discussions before creating a new one</li>
              <li>Use appropriate discussion types for better organization</li>
              <li>Provide enough context for others to understand your question or point</li>
              <li>Avoid sharing personal information or sensitive data</li>
              <li>Follow the community code of conduct at all times</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Link
              to={`/courses/${courseId}/discussions`}
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6b7280',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                textAlign: 'center'
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !formData.title.trim() || !formData.content.trim() || isContentTooShort || isContentTooLong}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: submitting || !formData.title.trim() || !formData.content.trim() || isContentTooShort || isContentTooLong ? '#9ca3af' : '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: submitting || !formData.title.trim() || !formData.content.trim() || isContentTooShort || isContentTooLong ? 'not-allowed' : 'pointer',
                opacity: submitting || !formData.title.trim() || !formData.content.trim() || isContentTooShort || isContentTooLong ? 0.7 : 1
              }}
            >
              {submitting ? 'Creating...' : 'Create Discussion'}
            </button>
          </div>
        </form>
      </div>

      {/* Tips */}
      <div style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '1.5rem',
        marginTop: '2rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1e40af' }}>
          💡 Tips for Great Discussions
        </h3>
        <div style={{ lineHeight: '1.6', color: '#1e40af' }}>
          <p style={{ marginBottom: '1rem' }}>
            <strong>For Questions:</strong> Be specific about what you're asking, include relevant context, and mention what you've already tried.
          </p>
          <p style={{ marginBottom: '1rem' }}>
            <strong>For Resources:</strong> Explain why the resource is helpful and how it relates to the course content.
          </p>
          <p style={{ marginBottom: '1rem' }}>
            <strong>For General Discussions:</strong> Start with a clear topic and encourage participation from others.
          </p>
          <p>
            <strong>For Announcements:</strong> Keep it concise and focused on important information relevant to all course participants.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreateDiscussion;