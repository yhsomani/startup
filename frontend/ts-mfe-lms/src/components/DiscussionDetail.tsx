import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { DiscussionDTO, DiscussionReplyDTO, CreateReplyRequest, UpdateReplyRequest, DiscussionType } from '../types/discussion';

const DiscussionDetail: React.FC = () => {
  const { courseId, discussionId } = useParams<{ courseId: string; discussionId: string }>();
  const [discussion, setDiscussion] = useState<DiscussionDTO | null>(null);
  const [replies, setReplies] = useState<DiscussionReplyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (discussionId) {
      fetchDiscussion();
    }
  }, [discussionId]);

  const fetchDiscussion = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/discussions/${discussionId}`);
      setDiscussion(response.data.Discussion);
      setReplies(response.data.Replies);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load discussion');
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !discussionId) return;

    try {
      setSubmittingReply(true);
      const request: CreateReplyRequest = {
        content: replyContent.trim()
      };

      const response = await api.post(`/discussions/${discussionId}/replies`, request);
      setReplies(prev => [...prev, response.data]);
      setReplyContent('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleLikeToggle = async (type: 'discussion' | 'reply', id: string) => {
    try {
      const endpoint = type === 'discussion' 
        ? `/discussions/${id}/like`
        : `/discussions/replies/${id}/like`;
      
      const response = await api.post(endpoint);
      
      if (type === 'discussion') {
        setDiscussion(prev => prev ? { ...prev, likeCount: prev.likeCount + (response.data.IsLiked ? 1 : -1) } : null);
      } else {
        const updateReplyLikes = (replies: DiscussionReplyDTO[]): DiscussionReplyDTO[] => {
          return replies.map(reply => {
            if (reply.id === id) {
              return { ...reply, likeCount: reply.likeCount + (response.data.IsLiked ? 1 : -1) };
            }
            return { ...reply, childReplies: updateReplyLikes(reply.childReplies) };
          });
        };
        setReplies(prev => updateReplyLikes(prev));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle like');
    }
  };

  const handleAcceptAnswer = async (replyId: string) => {
    if (!discussionId) return;

    try {
      await api.post(`/discussions/${discussionId}/replies/${replyId}/accept`);
      setDiscussion(prev => prev ? { ...prev, isResolved: true } : null);
      
      const updateAcceptedAnswer = (replies: DiscussionReplyDTO[]): DiscussionReplyDTO[] => {
        return replies.map(reply => ({
          ...reply,
          isAcceptedAnswer: reply.id === replyId,
          childReplies: updateAcceptedAnswer(reply.childReplies)
        }));
      };
      setReplies(prev => updateAcceptedAnswer(prev));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept answer');
    }
  };

  const handleEditReply = (reply: DiscussionReplyDTO) => {
    setEditingReply(reply.id);
    setEditContent(reply.content);
  };

  const handleUpdateReply = async (replyId: string) => {
    try {
      const request: UpdateReplyRequest = {
        content: editContent.trim()
      };

      await api.put(`/discussions/replies/${replyId}`, request);
      
      const updateReplyContent = (replies: DiscussionReplyDTO[]): DiscussionReplyDTO[] => {
        return replies.map(reply => {
          if (reply.id === replyId) {
            return { ...reply, content: editContent.trim(), isEdited: true };
          }
          return { ...reply, childReplies: updateReplyContent(reply.childReplies) };
        });
      };
      
      setReplies(prev => updateReplyContent(prev));
      setEditingReply(null);
      setEditContent('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update reply');
    }
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

  const renderReply = (reply: DiscussionReplyDTO, depth: number = 0) => {
    const marginLeft = depth * 2; // 2rem per level of nesting

    return (
      <div
        key={reply.id}
        style={{
          marginLeft: `${marginLeft}rem`,
          padding: '1rem',
          borderLeft: depth > 0 ? '2px solid #e5e7eb' : 'none',
          backgroundColor: depth > 0 ? '#f9fafb' : 'transparent'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
          {/* Author Avatar */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#e5e7eb',
            backgroundImage: reply.authorAvatar ? `url(${reply.authorAvatar})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            flexShrink: 0
          }}>
            {!reply.authorAvatar && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                fontSize: '0.9rem',
                color: '#6b7280'
              }}>
                {reply.authorName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Reply Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Author Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <strong>{reply.authorName}</strong>
              {reply.authorRole !== 'Student' && (
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '8px',
                  backgroundColor: '#4f46e520',
                  color: '#4f46e5',
                  fontWeight: 500
                }}>
                  {reply.authorRole}
                </span>
              )}
              {reply.isInstructorReply && (
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '8px',
                  backgroundColor: '#10b98120',
                  color: '#10b981',
                  fontWeight: 500
                }}>
                  Instructor
                </span>
              )}
              {reply.isAcceptedAnswer && (
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '8px',
                  backgroundColor: '#10b98120',
                  color: '#10b981',
                  fontWeight: 500
                }}>
                  ✅ Accepted Answer
                </span>
              )}
            </div>

            {/* Reply Content */}
            {editingReply === reply.id ? (
              <div style={{ marginBottom: '1rem' }}>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    lineHeight: '1.4'
                  }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={() => handleUpdateReply(reply.id)}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#4f46e5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingReply(null);
                      setEditContent('');
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{
                  color: '#374151',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  margin: 0
                }}>
                  {reply.content}
                </p>
                {reply.isEdited && (
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
                    Edited on {reply.formattedEditedAt}
                  </p>
                )}
              </div>
            )}

            {/* Reply Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              <button
                onClick={() => handleLikeToggle('reply', reply.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: reply.isLikedByCurrentUser ? '#ef4444' : '#6b7280'
                }}
              >
                ❤️ {reply.likeCount}
              </button>

              <button
                onClick={() => {
                  setReplyContent(reply.parentReplyAuthorName ? `@${reply.parentReplyAuthorName} ` : '');
                  // Focus on reply input
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                💬 Reply
              </button>

              <span>{reply.formattedCreatedAt}</span>

              {/* Edit/Delete options - would need user role checking */}
              {false && ( // Placeholder for author role check
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEditReply(reply)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#4f46e5'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#ef4444'
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}

              {/* Accept Answer button - for discussion author or instructor */}
              {discussion && discussion.type === DiscussionType.Question && !discussion.isResolved && (
                <button
                  onClick={() => handleAcceptAnswer(reply.id)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  Accept Answer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Child Replies */}
        {reply.childReplies.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            {reply.childReplies.map(childReply => renderReply(childReply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>💬</div>
        <h3>Loading discussion...</h3>
      </div>
    );
  }

  if (error || !discussion) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>❌</div>
        <h3>{error || 'Discussion not found'}</h3>
        {courseId && (
          <Link
            to={`/courses/${courseId}/discussions`}
            style={{
              display: 'inline-block',
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#4f46e5',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px'
            }}
          >
            ← Back to Discussions
          </Link>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      {/* Navigation */}
      <div style={{ marginBottom: '2rem' }}>
        <Link
          to={`/courses/${courseId}/discussions`}
          style={{ color: '#4f46e5', textDecoration: 'none', fontSize: '0.9rem' }}
        >
          ← Back to Course Discussions
        </Link>
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

      {/* Discussion Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
          {/* Author Avatar */}
          <div style={{
            width: '48px',
            height: '48px',
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
            {/* Title */}
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              marginBottom: '0.75rem',
              color: '#1f2937'
            }}>
              {discussion.isPinned && '📌 '}
              {discussion.title}
            </h1>

            {/* Type and Status Badges */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.875rem',
                  padding: '0.25rem 0.75rem',
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
                    fontSize: '0.875rem',
                    padding: '0.25rem 0.75rem',
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
                    fontSize: '0.875rem',
                    padding: '0.25rem 0.75rem',
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

            {/* Content */}
            <div style={{
              fontSize: '1rem',
              lineHeight: '1.6',
              color: '#374151',
              marginBottom: '1.5rem'
            }}>
              {discussion.content.split('\n').map((paragraph, index) => (
                <p key={index} style={{ marginBottom: '0.75rem' }}>
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Meta Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              fontSize: '0.875rem',
              color: '#6b7280',
              paddingBottom: '1rem',
              borderBottom: '1px solid #f3f4f6'
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
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                onClick={() => handleLikeToggle('discussion', discussion.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: discussion.isLikedByCurrentUser ? '#fef2f2' : '#f9fafb',
                  color: discussion.isLikedByCurrentUser ? '#ef4444' : '#6b7280'
                }}
              >
                ❤️ {discussion.likeCount} Like
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reply Form */}
      {!discussion.isLocked && (
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          marginBottom: '2rem'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
            Write a Reply
          </h3>
          <form onSubmit={handleReplySubmit}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Share your thoughts..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                lineHeight: '1.4',
                resize: 'vertical'
              }}
              required
            />
            <div style={{ marginTop: '1rem' }}>
              <button
                type="submit"
                disabled={submittingReply || !replyContent.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: submittingReply || !replyContent.trim() ? '#9ca3af' : '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: submittingReply || !replyContent.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                {submittingReply ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Replies Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #f3f4f6' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
            {discussion.replyCount} {discussion.replyCount === 1 ? 'Reply' : 'Replies'}
          </h2>
        </div>

        {replies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💬</div>
            <h3>No replies yet</h3>
            <p>Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div style={{ padding: '1.5rem' }}>
            {replies.map(reply => renderReply(reply))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionDetail;