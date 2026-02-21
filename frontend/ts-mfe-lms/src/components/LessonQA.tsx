import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface LessonQAProps {
  lessonId: string;
  courseId: string;
}

interface Question {
  id: string;
  content: string;
  timestamp: number;
  user: string;
  isCurrentUser: boolean;
  isAnswered: boolean;
  answer?: {
    content: string;
    instructor: string;
    timestamp: number;
    isHelpful: boolean;
    helpfulCount: number;
  };
}

const LessonQA: React.FC<LessonQAProps> = ({ lessonId, courseId }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lessonId && isExpanded) {
      fetchQuestions();
    }
  }, [lessonId, isExpanded]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch questions specific to this lesson
      const response = await api.get(`/lessons/${lessonId}/qa`);
      setQuestions(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch lesson Q&A:', err);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    try {
      setSubmitting(true);
      const response = await api.post(`/lessons/${lessonId}/qa`, {
        content: newQuestion.trim(),
        courseId: courseId
      });

      setQuestions(prev => [{
        id: response.data.id,
        content: newQuestion.trim(),
        timestamp: Date.now(),
        user: 'You', // Would come from user context
        isCurrentUser: true,
        isAnswered: false
      }, ...prev]);

      setNewQuestion('');
    } catch (err: any) {
      console.error('Failed to submit question:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkHelpful = async (questionId: string) => {
    try {
      await api.post(`/lessons/${lessonId}/qa/${questionId}/helpful`);
      
      setQuestions(prev => prev.map(q => {
        if (q.id === questionId && q.answer) {
          return {
            ...q,
            answer: {
              ...q.answer,
              isHelpful: !q.answer.isHelpful,
              helpfulCount: q.answer.isHelpful ? q.answer.helpfulCount - 1 : q.answer.helpfulCount + 1
            }
          };
        }
        return q;
      }));
    } catch (err: any) {
      console.error('Failed to mark answer as helpful:', err);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unansweredQuestions = questions.filter(q => !q.isAnswered);
  const answeredQuestions = questions.filter(q => q.isAnswered);

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      marginTop: '1rem'
    }}>
      {/* Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: '1rem 1.5rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none',
          transition: 'background-color 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
            💬 Lesson Q&A
          </h3>
          <span style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            backgroundColor: '#f3f4f6',
            padding: '0.25rem 0.5rem',
            borderRadius: '12px'
          }}>
            {unansweredQuestions.length} pending
          </span>
        </div>
        <div style={{
          color: '#9ca3af',
          fontSize: '1.25rem',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ padding: '1.5rem' }}>
          {/* Question Form */}
          <form onSubmit={handleSubmitQuestion} style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Ask a question about this lesson
              </label>
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="What specific part of this lesson would you like help with?"
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  lineHeight: '1.4',
                  resize: 'vertical'
                }}
                required
                minLength={10}
                maxLength={500}
              />
              <div style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                marginTop: '0.25rem'
              }}>
                {newQuestion.length}/500 characters
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting || !newQuestion.trim()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: submitting || !newQuestion.trim() ? '#9ca3af' : '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: submitting || !newQuestion.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Posting...' : 'Ask Question'}
            </button>
          </form>

          {/* Loading State */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '1rem', color: '#6b7280' }}>Loading questions...</div>
            </div>
          )}

          {/* Questions List */}
          {questions.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💬</div>
              <h4>No questions yet</h4>
              <p>Be the first to ask a question about this lesson!</p>
            </div>
          )}

          {questions.length > 0 && (
            <div>
              {/* Unanswered Questions */}
              {unansweredQuestions.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#dc2626' }}>
                    ❓ Pending Questions ({unansweredQuestions.length})
                  </h4>
                  {unansweredQuestions.map(question => (
                    <div
                      key={question.id}
                      style={{
                        padding: '1rem',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        backgroundColor: '#fef2f2',
                        marginBottom: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#4f46e5',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.875rem',
                          fontWeight: 600
                        }}>
                          {question.user.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{
                            margin: 0,
                            fontSize: '0.875rem',
                            lineHeight: '1.4'
                          }}>
                            {question.content}
                          </p>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginTop: '0.5rem'
                          }}>
                            Asked by {question.user} • {formatTimestamp(question.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Answered Questions */}
              {answeredQuestions.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#059669' }}>
                    ✅ Answered Questions ({answeredQuestions.length})
                  </h4>
                  {answeredQuestions.map(question => (
                    <div
                      key={question.id}
                      style={{
                        padding: '1rem',
                        border: '1px solid #d1fae5',
                        borderRadius: '6px',
                        backgroundColor: '#f0fdf4',
                        marginBottom: '1rem'
                      }}
                    >
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 600
                          }}>
                            {question.user.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{
                              margin: 0,
                              fontSize: '0.875rem',
                              lineHeight: '1.4',
                              fontWeight: 500
                            }}>
                              {question.content}
                            </p>
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              marginTop: '0.5rem'
                            }}>
                              Asked by {question.user} • {formatTimestamp(question.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Instructor Answer */}
                      {question.answer && (
                        <div style={{
                          padding: '1rem',
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: '#10b981',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.875rem',
                              fontWeight: 600
                            }}>
                              I
                            </div>
                            <div style={{ flex: 1 }}>
                              <p style={{
                                margin: 0,
                                fontSize: '0.875rem',
                                lineHeight: '1.4'
                              }}>
                                {question.answer.content}
                              </p>
                              <div style={{
                                fontSize: '0.75rem',
                                color: '#6b7280',
                                marginTop: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem'
                              }}>
                                <span>
                                  Answered by {question.answer.instructor} • {formatTimestamp(question.answer.timestamp)}
                                </span>
                                <button
                                  onClick={() => handleMarkHelpful(question.id)}
                                  style={{
                                    padding: '0.25rem 0.5rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '4px',
                                    backgroundColor: question.answer.isHelpful ? '#10b981' : 'white',
                                    color: question.answer.isHelpful ? 'white' : '#6b7280',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  👍 {question.answer.helpfulCount} Helpful
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LessonQA;