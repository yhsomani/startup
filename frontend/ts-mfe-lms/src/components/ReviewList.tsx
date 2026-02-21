import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';

interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerified: boolean;
}

interface ReviewListProps {
  courseId: string;
  userCanReview?: boolean;
}

const ReviewList: React.FC<ReviewListProps> = ({ courseId, userCanReview = true }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  } | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [courseId, sortBy, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      // Import api dynamically to avoid circular dependency
      const { default: api } = await import('../services/api');
      const response = await api.get(`/courses/${courseId}/reviews`, {
        params: { page, pageSize: 10, sortBy }
      });

      setReviews(response.data.data);
      setPagination(response.data.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load reviews');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSortBy: typeof sortBy) => {
    setSortBy(newSortBy);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };



  if (loading && reviews.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <div>Loading reviews...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '1rem',
        margin: '1rem 0',
        color: '#dc2626'
      }}>
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
          Student Reviews
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Sort Controls */}
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
            style={{
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>

          {userCanReview && (
            <button
              onClick={() => {
                // Scroll to review form
                const reviewForm = document.getElementById('review-form');
                if (reviewForm) {
                  reviewForm.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Write a Review
            </button>
          )}
        </div>
      </div>

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          backgroundColor: '#f8fafc',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⭐</div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            No Reviews Yet
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
            Be the first to share your thoughts on this course!
          </p>
          {userCanReview && (
            <button
              onClick={() => {
                const reviewForm = document.getElementById('review-form');
                if (reviewForm) {
                  reviewForm.scrollIntoView({ behavior: 'smooth' });
                }
              }}
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
              Write the First Review
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reviews.map((review) => (
            <div
              key={review.id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Review Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                {/* User Avatar */}
                {review.userAvatar ? (
                  <img
                    src={review.userAvatar}
                    alt={review.userName}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #e5e7eb'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#4f46e5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1.25rem',
                    border: '2px solid #e5e7eb'
                  }}>
                    {review.userName.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* User Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                    {review.userName}
                    {review.isVerified && (
                      <span style={{
                        marginLeft: '0.5rem',
                        padding: '0.125rem 0.5rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 500
                      }}>
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {formatDate(review.createdAt)}
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div style={{ marginBottom: '1rem' }}>
                <StarRating rating={review.rating} readonly size="small" />
              </div>

              {/* Comment */}
              {review.comment && (
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  padding: '1rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  color: '#374151'
                }}>
                  {review.comment}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '2rem'
        }}>
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={!pagination.hasPrevious}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f3f4f6',
              color: pagination.hasPrevious ? '#374151' : '#9ca3af',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: pagination.hasPrevious ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem'
            }}
          >
            Previous
          </button>

          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={!pagination.hasNext}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f3f4f6',
              color: pagination.hasNext ? '#374151' : '#9ca3af',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: pagination.hasNext ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewList;