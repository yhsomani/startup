import React, { useState } from 'react';
import StarRating from './StarRating';

interface ReviewFormProps {
  courseId: string;
  onReviewSubmitted: () => void;
  isEnrolled?: boolean;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ courseId, onReviewSubmitted, isEnrolled = true }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Import api dynamically to avoid circular dependency
      const { default: api } = await import('../services/api');
      await api.post(`/courses/${courseId}/reviews`, {
        rating,
        comment: comment.trim()
      });

      setSuccess(true);
      setRating(0);
      setComment('');

      // Call the callback after successful submission
      setTimeout(() => {
        onReviewSubmitted();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    setError(null);
  };

  if (success) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Thank You for Your Review!
        </h3>
        <p style={{ color: '#166534', marginBottom: '1rem' }}>
          Your review has been submitted successfully and will be visible after moderation.
        </p>
        <button
          onClick={() => setSuccess(false)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Write Another Review
        </button>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#fef3c7',
        border: '1px solid #fde68a',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📚</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Enroll to Leave a Review
        </h3>
        <p style={{ color: '#92400e', marginBottom: '1rem' }}>
          You must be enrolled in this course to write a review.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
        Write a Review
      </h3>

      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '1rem',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Rating Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 500,
            fontSize: '0.875rem'
          }}>
            How would you rate this course?
          </label>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <StarRating
              rating={rating}
              onRatingChange={handleRatingChange}
              size="large"
              showValue
            />
          </div>
          {rating > 0 && (
            <p style={{
              textAlign: 'center',
              fontSize: '0.875rem',
              color: '#6b7280',
              marginTop: '0.25rem'
            }}>
              You selected {rating} star{rating !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Comment Box */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: 500,
            fontSize: '0.875rem'
          }}>
            Tell us more about your experience (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like? What could be improved? Your feedback helps other students make better decisions."
            rows={4}
            maxLength={2000}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
          <p style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            marginTop: '0.25rem',
            textAlign: 'right'
          }}>
            {comment.length}/2000 characters
          </p>
        </div>

        {/* Guidelines */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <h4 style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '0.75rem',
            color: '#374151'
          }}>
            Review Guidelines
          </h4>
          <ul style={{
            margin: 0,
            paddingLeft: '1.25rem',
            fontSize: '0.813rem',
            color: '#6b7280',
            lineHeight: '1.5'
          }}>
            <li style={{ marginBottom: '0.5rem' }}>
              Be specific about what you liked or disliked
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              Keep your review respectful and constructive
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              Mention specific lessons or features you found helpful
            </li>
            <li>
              Avoid sharing personal information or off-topic content
            </li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || (rating === 0 && !comment.trim())}
          style={{
            width: '100%',
            padding: '0.875rem 1.5rem',
            backgroundColor: isSubmitting ? '#d1d5db' : (rating === 0 && !comment.trim()) ? '#9ca3af' : '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease'
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;