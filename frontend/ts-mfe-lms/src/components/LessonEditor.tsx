import React, { useState } from 'react';
import { VideoUploader } from './VideoUploader';
import { QuizBuilder } from './QuizBuilder';

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  content: any;
  duration: number;
  order: number;
  isPreview: boolean;
}

interface LessonEditorProps {
  lesson: Lesson;
  sectionId: string;
  onSave: (lesson: Partial<Lesson>) => void;
  onCancel: () => void;
}

export const LessonEditor: React.FC<LessonEditorProps> = ({ lesson, onSave, onCancel }) => {
  const [editedLesson, setEditedLesson] = useState<Lesson>(lesson);
  const [showVideoUploader, setShowVideoUploader] = useState(false);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);

  const lessonTypes = [
    { value: 'video', label: 'Video Lesson', icon: '🎥' },
    { value: 'text', label: 'Text/Article', icon: '📝' },
    { value: 'quiz', label: 'Quiz', icon: '📋' },
    { value: 'assignment', label: 'Assignment', icon: '📚' }
  ];

  const handleSave = () => {
    onSave(editedLesson);
  };

  const updateLessonContent = (content: any) => {
    setEditedLesson(prev => ({ ...prev, content }));
  };

  const renderContentEditor = () => {
    switch (editedLesson.type) {
      case 'video':
        return (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Video Content
              </label>
              {editedLesson.content?.videoUrl ? (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  border: '1px solid #bae6fd',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                        📹 Video Uploaded
                      </p>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {editedLesson.content.videoUrl}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowVideoUploader(true)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowVideoUploader(true)}
                  style={{
                    width: '100%',
                    padding: '2rem',
                    backgroundColor: '#f8fafc',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ fontSize: '2rem' }}>📹</div>
                  <div style={{ fontWeight: 500 }}>Upload Video</div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    MP4, WebM, or OGG (Max 2GB)
                  </div>
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editedLesson.duration}
                  onChange={(e) => setEditedLesson(prev => ({
                    ...prev,
                    duration: Number(e.target.value)
                  }))}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Video Quality
                </label>
                <select
                  value={editedLesson.content?.quality || 'hd'}
                  onChange={(e) => updateLessonContent({
                    ...editedLesson.content,
                    quality: e.target.value
                  })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                >
                  <option value="sd">SD (480p)</option>
                  <option value="hd">HD (720p)</option>
                  <option value="fhd">Full HD (1080p)</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Article Content
            </label>
            <textarea
              value={editedLesson.content?.text || ''}
              onChange={(e) => updateLessonContent({
                ...editedLesson.content,
                text: e.target.value
              })}
              placeholder="Write your lesson content here. You can use Markdown for formatting."
              rows={12}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Supports Markdown formatting. Use ## for headings, ** for bold, * for italic.
            </p>
          </div>
        );

      case 'quiz':
        return (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Quiz Configuration
              </label>
              {editedLesson.content?.questions?.length > 0 ? (
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #bbf7d0',
                  marginBottom: '1rem'
                }}>
                  <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                    ✅ Quiz Created
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {editedLesson.content.questions.length} questions
                  </p>
                </div>
              ) : null}
              <button
                onClick={() => setShowQuizBuilder(true)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  backgroundColor: editedLesson.content?.questions?.length > 0 ? '#f8fafc' : '#f0f9ff',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <div style={{ fontSize: '1.5rem' }}>📋</div>
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {editedLesson.content?.questions?.length > 0 ? 'Edit Quiz' : 'Create Quiz'}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {editedLesson.content?.questions?.length > 0
                      ? `${editedLesson.content.questions.length} questions`
                      : 'Add multiple choice questions'
                    }
                  </div>
                </div>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editedLesson.content?.passingScore || 70}
                  onChange={(e) => updateLessonContent({
                    ...editedLesson.content,
                    passingScore: Number(e.target.value)
                  })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editedLesson.content?.timeLimit || 0}
                  onChange={(e) => updateLessonContent({
                    ...editedLesson.content,
                    timeLimit: Number(e.target.value)
                  })}
                  placeholder="No limit"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'assignment':
        return (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
              Assignment Details
            </label>
            <textarea
              value={editedLesson.content?.description || ''}
              onChange={(e) => updateLessonContent({
                ...editedLesson.content,
                description: e.target.value
              })}
              placeholder="Describe the assignment requirements, objectives, and deliverables..."
              rows={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                resize: 'vertical',
                marginBottom: '1rem'
              }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Assignment Type
                </label>
                <select
                  value={editedLesson.content?.assignmentType || 'project'}
                  onChange={(e) => updateLessonContent({
                    ...editedLesson.content,
                    assignmentType: e.target.value
                  })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                >
                  <option value="project">Project</option>
                  <option value="coding">Coding Challenge</option>
                  <option value="essay">Essay</option>
                  <option value="presentation">Presentation</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Due Date (days from start)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editedLesson.content?.dueDays || 7}
                  onChange={(e) => updateLessonContent({
                    ...editedLesson.content,
                    dueDays: Number(e.target.value)
                  })}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px'
                  }}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Header */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
              Edit Lesson
            </h2>
            <button
              onClick={onCancel}
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '1.5rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Lesson Title
              </label>
              <input
                type="text"
                value={editedLesson.title}
                onChange={(e) => setEditedLesson(prev => ({
                  ...prev,
                  title: e.target.value
                }))}
                placeholder="Enter lesson title"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Lesson Type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {lessonTypes.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setEditedLesson(prev => ({
                      ...prev,
                      type: type.value as Lesson['type'],
                      content: {} // Reset content when changing type
                    }))}
                    style={{
                      padding: '1rem',
                      backgroundColor: editedLesson.type === type.value ? '#4f46e5' : '#f8fafc',
                      border: editedLesson.type === type.value ? '2px solid #4f46e5' : '2px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{type.icon}</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{
                        fontWeight: 600,
                        color: editedLesson.type === type.value ? 'white' : '#374151'
                      }}>
                        {type.label}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Editor */}
            <div style={{ marginBottom: '1.5rem' }}>
              {renderContentEditor()}
            </div>

            {/* Additional Settings */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={editedLesson.isPreview}
                  onChange={(e) => setEditedLesson(prev => ({
                    ...prev,
                    isPreview: e.target.checked
                  }))}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontWeight: 500 }}>Make this lesson available for free preview</span>
              </label>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
                Students can watch this lesson without purchasing the course
              </p>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '1.5rem',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem'
          }}>
            <button
              onClick={onCancel}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
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
              Save Lesson
            </button>
          </div>
        </div>
      </div>

      {/* Video Uploader Modal */}
      {showVideoUploader && (
        <VideoUploader
          onUpload={(videoData) => {
            updateLessonContent({
              ...editedLesson.content,
              videoUrl: videoData.url,
              fileSize: videoData.size,
              duration: videoData.duration
            });
            setShowVideoUploader(false);
          }}
          onCancel={() => setShowVideoUploader(false)}
        />
      )}

      {/* Quiz Builder Modal */}
      {showQuizBuilder && (
        <QuizBuilder
          questions={editedLesson.content?.questions || []}
          onSave={(questions) => {
            updateLessonContent({
              ...editedLesson.content,
              questions
            });
            setShowQuizBuilder(false);
          }}
          onCancel={() => setShowQuizBuilder(false)}
        />
      )}
    </>
  );
};
