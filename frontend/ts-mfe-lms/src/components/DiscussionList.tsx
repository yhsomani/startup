import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { DiscussionDTO, DiscussionSearchRequest, DiscussionStats, DiscussionSortOrder, DiscussionType } from '../types/discussion';

interface DiscussionListProps {
  courseId?: string;
  courseTitle?: string;
}

const DiscussionList: React.FC<DiscussionListProps> = ({ courseId, courseTitle }) => {
  const [discussions, setDiscussions] = useState<DiscussionDTO[]>([]);
  const [stats, setStats] = useState<DiscussionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchRequest, setSearchRequest] = useState<DiscussionSearchRequest>({
    courseId: courseId ? new URLSearchParams(courseId).get('id') as any || courseId : undefined,
    query: searchParams.get('q') || '',
    type: searchParams.get('type') as any || undefined,
    isResolved: searchParams.get('resolved') === 'true' ? true : searchParams.get('resolved') === 'false' ? false : undefined,
    isPinned: searchParams.get('pinned') === 'true' ? true : undefined,
    sortBy: (searchParams.get('sort') as any) || DiscussionSortOrder.Latest,
    page: parseInt(searchParams.get('page') || '1'),
    pageSize: 20
  });

  useEffect(() => {
    fetchDiscussions();
  }, [searchRequest]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchRequest.query) params.set('q', searchRequest.query);
    if (searchRequest.type) params.set('type', searchRequest.type.toString());
    if (searchRequest.isResolved !== undefined) params.set('resolved', searchRequest.isResolved.toString());
    if (searchRequest.isPinned) params.set('pinned', 'true');
    if (searchRequest.sortBy !== DiscussionSortOrder.Latest) params.set('sort', searchRequest.sortBy.toString());
    if (searchRequest.page > 1) params.set('page', searchRequest.page.toString());

    setSearchParams(params);
  }, [searchRequest, setSearchParams]);

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/discussions', {
        params: {
          ...searchRequest,
          courseId: searchRequest.courseId
        }
      });

      setDiscussions(response.data.discussions);
      setStats(response.data.stats);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load discussions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (newSearch: Partial<DiscussionSearchRequest>) => {
    setSearchRequest(prev => ({
      ...prev,
      ...newSearch,
      page: 1 // Reset to first page on new search
    }));
  };

  const handlePageChange = (page: number) => {
    setSearchRequest(prev => ({
      ...prev,
      page
    }));
  };

  const formatTypeLabel = (type: DiscussionType) => {
    switch (type) {
      case DiscussionType.Question: return '❓ Question';
      case DiscussionType.Announcement: return '📢 Announcement';
      case DiscussionType.Resource: return '📚 Resource';
      case DiscussionType.Assignment: return '📝 Assignment';
      default: return '💬 General';
    }
  };

  const getTypeColor = (type: DiscussionType) => {
    switch (type) {
      case DiscussionType.Question: return '#3b82f6';
      case DiscussionType.Announcement: return '#ef4444';
      case DiscussionType.Resource: return '#10b981';
      case DiscussionType.Assignment: return '#f59e0b';
      default: return '#6b7280';
    }
  };

  if (loading && discussions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📚</div>
        <h3>Loading discussions...</h3>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          {courseTitle ? `${courseTitle} Discussions` : 'Course Discussions'}
        </h1>
        {courseTitle && (
          <Link
            to={`/courses/${courseId}`}
            style={{ color: '#4f46e5', textDecoration: 'none', fontSize: '0.9rem' }}
          >
            ← Back to Course
          </Link>
        )}
      </div>

      {/* Stats Bar */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#4f46e5' }}>
              {stats.totalDiscussions}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Discussions</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
              {stats.totalReplies}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total Replies</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>
              {stats.pendingQuestions}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Pending Questions</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
              {stats.resolvedQuestions}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Resolved Questions</div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Search Discussions
            </label>
            <input
              type="text"
              placeholder="Search by title or content..."
              value={searchRequest.query || ''}
              onChange={(e) => handleSearch({ query: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Type
            </label>
            <select
              value={searchRequest.type || ''}
              onChange={(e) => handleSearch({
                type: e.target.value ? parseInt(e.target.value) as DiscussionType : undefined
              })}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            >
              <option value="">All Types</option>
              <option value={DiscussionType.Question}>Questions</option>
              <option value={DiscussionType.General}>General</option>
              <option value={DiscussionType.Announcement}>Announcements</option>
              <option value={DiscussionType.Resource}>Resources</option>
              <option value={DiscussionType.Assignment}>Assignments</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Sort By
            </label>
            <select
              value={searchRequest.sortBy}
              onChange={(e) => handleSearch({ sortBy: parseInt(e.target.value) as DiscussionSortOrder })}
              style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            >
              <option value={DiscussionSortOrder.Latest}>Latest</option>
              <option value={DiscussionSortOrder.MostReplies}>Most Replies</option>
              <option value={DiscussionSortOrder.MostLikes}>Most Likes</option>
              <option value={DiscussionSortOrder.MostViews}>Most Views</option>
              <option value={DiscussionSortOrder.PinnedFirst}>Pinned First</option>
            </select>
          </div>
        </div>

        {/* Additional Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={searchRequest.isPinned || false}
              onChange={(e) => handleSearch({ isPinned: e.target.checked || undefined })}
            />
            Pinned Only
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={searchRequest.isResolved === true}
              onChange={(e) => handleSearch({ isResolved: e.target.checked ? true : undefined })}
            />
            Resolved Only
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={searchRequest.isResolved === false}
              onChange={(e) => handleSearch({ isResolved: e.target.checked ? false : undefined })}
            />
            Unresolved Only
          </label>
        </div>
      </div>

      {/* New Discussion Button */}
      {courseId && (
        <div style={{ marginBottom: '2rem', textAlign: 'right' }}>
          <Link
            to={`/courses/${courseId}/discussions/new`}
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#4f46e5',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '1rem'
            }}
          >
            📝 New Discussion
          </Link>
        </div>
      )}

      {/* Error */}
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

      {/* Discussions List */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        {discussions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
            <h3>No discussions found</h3>
            <p>Be the first to start a conversation!</p>
            {courseId && (
              <Link
                to={`/courses/${courseId}/discussions/new`}
                style={{
                  display: 'inline-block',
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontWeight: 600
                }}
              >
                Start Discussion
              </Link>
            )}
          </div>
        ) : (
          <div>
            {discussions.map((discussion) => (
              <div
                key={discussion.id}
                style={{
                  padding: '1.5rem',
                  borderBottom: '1px solid #f3f4f6'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                  {/* Author Avatar */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#e5e7eb',
                    backgroundImage: discussion.authorAvatar ? `url(${discussion.authorAvatar})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    flexShrink: 0
                  }}>
                    {!discussion.authorAvatar && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        fontSize: '1.2rem',
                        color: '#6b7280'
                      }}>
                        {discussion.authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Discussion Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title and Meta */}
                    <div style={{ marginBottom: '0.5rem' }}>
                      <Link
                        to={`/courses/${discussion.courseId}/discussions/${discussion.id}`}
                        style={{
                          fontSize: '1.125rem',
                          fontWeight: 600,
                          color: '#1f2937',
                          textDecoration: 'none'
                        }}
                      >
                        {discussion.isPinned && '📌 '}
                        {discussion.title}
                      </Link>
                    </div>

                    {/* Type and Status Badges */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          backgroundColor: getTypeColor(discussion.type) + '20',
                          color: getTypeColor(discussion.type),
                          fontWeight: 500
                        }}
                      >
                        {formatTypeLabel(discussion.type)}
                      </span>

                      {discussion.isResolved && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '12px',
                            backgroundColor: '#10b98120',
                            color: '#10b981',
                            fontWeight: 500
                          }}
                        >
                          ✅ Resolved
                        </span>
                      )}

                      {discussion.isLocked && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '12px',
                            backgroundColor: '#ef444420',
                            color: '#ef4444',
                            fontWeight: 500
                          }}
                        >
                          🔒 Locked
                        </span>
                      )}
                    </div>

                    {/* Content Preview */}
                    <p style={{
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      marginBottom: '0.75rem',
                      lineHeight: '1.4'
                    }}>
                      {discussion.content}
                    </p>

                    {/* Meta Info */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>
                      <span>
                        <strong>{discussion.authorName}</strong>
                        {discussion.authorRole !== 'Student' && ` (${discussion.authorRole})`}
                      </span>
                      <span>•</span>
                      <span>{discussion.formattedCreatedAt}</span>
                      <span>•</span>
                      <span>👁 {discussion.viewCount} views</span>
                      <span>•</span>
                      <span>💬 {discussion.replyCount} replies</span>
                      <span>•</span>
                      <span>❤️ {discussion.likeCount} likes</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {stats && stats.totalDiscussions > 20 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          marginTop: '2rem'
        }}>
          <button
            onClick={() => handlePageChange(searchRequest.page - 1)}
            disabled={searchRequest.page <= 1}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: searchRequest.page <= 1 ? 'not-allowed' : 'pointer',
              opacity: searchRequest.page <= 1 ? 0.5 : 1
            }}
          >
            Previous
          </button>

          <span style={{ padding: '0.5rem 1rem' }}>
            Page {searchRequest.page} of {Math.ceil(stats.totalDiscussions / 20)}
          </span>

          <button
            onClick={() => handlePageChange(searchRequest.page + 1)}
            disabled={searchRequest.page * 20 >= stats.totalDiscussions}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: searchRequest.page * 20 >= stats.totalDiscussions ? 'not-allowed' : 'pointer',
              opacity: searchRequest.page * 20 >= stats.totalDiscussions ? 0.5 : 1
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default DiscussionList;