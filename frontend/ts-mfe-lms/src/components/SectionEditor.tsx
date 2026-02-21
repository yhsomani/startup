import React, { useState } from 'react';
import { LessonEditor } from './LessonEditor';

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

interface SectionEditorProps {
  courseData: any;
  updateCourseData: (newData: any) => void;
}

export const SectionEditor: React.FC<SectionEditorProps> = ({ courseData, updateCourseData }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editingLesson, setEditingLesson] = useState<{ sectionId: string; lesson: Lesson | null }>({
    sectionId: '',
    lesson: null
  });

  const addSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      title: '',
      description: '',
      lessons: [],
      order: courseData.sections.length
    };

    updateCourseData({
      sections: [...courseData.sections, newSection]
    });

    // Auto-expand the new section
    setExpandedSections(prev => new Set([...prev, newSection.id]));
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    const updatedSections = courseData.sections.map((section: Section) =>
      section.id === sectionId ? { ...section, ...updates } : section
    );
    updateCourseData({ sections: updatedSections });
  };

  const deleteSection = (sectionId: string) => {
    const updatedSections = courseData.sections.filter((section: Section) => section.id !== sectionId);
    updateCourseData({ sections: updatedSections });
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const sections = [...courseData.sections];
    const index = sections.findIndex((s: Section) => s.id === sectionId);

    if ((direction === 'up' && index > 0) || (direction === 'down' && index < sections.length - 1)) {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];

      // Update order numbers
      sections.forEach((section, i) => {
        section.order = i;
      });

      updateCourseData({ sections });
    }
  };

  const addLesson = (sectionId: string) => {
    const section = courseData.sections.find((s: Section) => s.id === sectionId);
    if (!section) return;

    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: '',
      type: 'video',
      content: {},
      duration: 0,
      order: section.lessons.length,
      isPreview: false
    };

    updateSection(sectionId, {
      lessons: [...section.lessons, newLesson]
    });

    setEditingLesson({ sectionId, lesson: newLesson });
  };

  const updateLesson = (sectionId: string, lessonId: string, updates: Partial<Lesson>) => {
    const section = courseData.sections.find((s: Section) => s.id === sectionId);
    if (!section) return;

    const updatedLessons = section.lessons.map((lesson: Lesson) =>
      lesson.id === lessonId ? { ...lesson, ...updates } : lesson
    );

    updateSection(sectionId, { lessons: updatedLessons });
  };

  const deleteLesson = (sectionId: string, lessonId: string) => {
    const section = courseData.sections.find((s: Section) => s.id === sectionId);
    if (!section) return;

    const updatedLessons = section.lessons.filter((lesson: Lesson) => lesson.id !== lessonId);
    updateSection(sectionId, { lessons: updatedLessons });
  };

  const moveLesson = (sectionId: string, lessonId: string, direction: 'up' | 'down') => {
    const section = courseData.sections.find((s: Section) => s.id === sectionId);
    if (!section) return;

    const lessons = [...section.lessons];
    const index = lessons.findIndex((l: Lesson) => l.id === lessonId);

    if ((direction === 'up' && index > 0) || (direction === 'down' && index < lessons.length - 1)) {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      [lessons[index], lessons[newIndex]] = [lessons[newIndex], lessons[index]];

      // Update order numbers
      lessons.forEach((lesson, i) => {
        lesson.order = i;
      });

      updateSection(sectionId, { lessons });
    }
  };

  const toggleSectionExpanded = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getTotalDuration = () => {
    return courseData.sections.reduce((total: number, section: Section) => {
      return total + section.lessons.reduce((sectionTotal: number, lesson: Lesson) => {
        return sectionTotal + lesson.duration;
      }, 0);
    }, 0);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
          Course Content
        </h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {courseData.sections.length} sections • {formatDuration(getTotalDuration())} total
          </span>
          <button
            onClick={addSection}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            + Add Section
          </button>
        </div>
      </div>

      {courseData.sections.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '2px dashed #d1d5db'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Start Building Your Course
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Add sections to organize your course content
          </p>
          <button
            onClick={addSection}
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
            Add Your First Section
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {courseData.sections.map((section: Section, sectionIndex: number) => (
            <div
              key={section.id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                overflow: 'hidden'
              }}
            >
              {/* Section Header */}
              <div
                style={{
                  padding: '1rem 1.5rem',
                  backgroundColor: '#f9fafb',
                  borderBottom: expandedSections.has(section.id) ? '1px solid #e5e7eb' : 'none',
                  cursor: 'pointer'
                }}
                onClick={() => toggleSectionExpanded(section.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#4f46e5',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      {sectionIndex + 1}
                    </div>
                    <div>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        placeholder="Section Title"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          border: 'none',
                          backgroundColor: 'transparent',
                          fontSize: '1rem',
                          fontWeight: 600,
                          padding: '0.25rem',
                          borderRadius: '4px',
                          width: '300px'
                        }}
                      />
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        {section.lessons.length} lessons • {formatDuration(
                          section.lessons.reduce((total: number, lesson: Lesson) => total + lesson.duration, 0)
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(section.id, 'up');
                      }}
                      disabled={sectionIndex === 0}
                      style={{
                        padding: '0.25rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: sectionIndex === 0 ? 'not-allowed' : 'pointer',
                        opacity: sectionIndex === 0 ? 0.5 : 1
                      }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSection(section.id, 'down');
                      }}
                      disabled={sectionIndex === courseData.sections.length - 1}
                      style={{
                        padding: '0.25rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: sectionIndex === courseData.sections.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: sectionIndex === courseData.sections.length - 1 ? 0.5 : 1
                      }}
                    >
                      ↓
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSection(section.id);
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      Delete
                    </button>
                    <div style={{ fontSize: '1.25rem', color: '#6b7280' }}>
                      {expandedSections.has(section.id) ? '▼' : '▶'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Content */}
              {expandedSections.has(section.id) && (
                <div style={{ padding: '1.5rem' }}>
                  <textarea
                    value={section.description}
                    onChange={(e) => updateSection(section.id, { description: e.target.value })}
                    placeholder="Section description (optional)"
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      marginBottom: '1rem',
                      resize: 'vertical'
                    }}
                  />

                  {/* Lessons */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                        Lessons
                      </h4>
                      <button
                        onClick={() => addLesson(section.id)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#4f46e5',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        + Add Lesson
                      </button>
                    </div>

                    {section.lessons.length === 0 ? (
                      <div style={{
                        textAlign: 'center',
                        padding: '1.5rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px dashed #d1d5db'
                      }}>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                          No lessons yet. Add your first lesson to get started.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {section.lessons.map((lesson: Lesson, lessonIndex: number) => (
                          <div
                            key={lesson.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.75rem',
                              backgroundColor: '#f9fafb',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb'
                            }}
                          >
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              fontWeight: 500,
                              minWidth: '20px'
                            }}>
                              {lessonIndex + 1}.
                            </div>

                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                  type="text"
                                  value={lesson.title}
                                  onChange={(e) => updateLesson(section.id, lesson.id, { title: e.target.value })}
                                  placeholder="Lesson Title"
                                  style={{
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    padding: '0.25rem',
                                    borderRadius: '4px',
                                    flex: 1
                                  }}
                                />
                                <span style={{
                                  padding: '0.125rem 0.5rem',
                                  backgroundColor: '#e5e7eb',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  color: '#374151'
                                }}>
                                  {lesson.type}
                                </span>
                                {lesson.isPreview && (
                                  <span style={{
                                    padding: '0.125rem 0.5rem',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem'
                                  }}>
                                    Preview
                                  </span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <button
                                onClick={() => moveLesson(section.id, lesson.id, 'up')}
                                disabled={lessonIndex === 0}
                                style={{
                                  padding: '0.125rem',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  cursor: lessonIndex === 0 ? 'not-allowed' : 'pointer',
                                  opacity: lessonIndex === 0 ? 0.5 : 1,
                                  fontSize: '0.75rem'
                                }}
                              >
                                ↑
                              </button>
                              <button
                                onClick={() => moveLesson(section.id, lesson.id, 'down')}
                                disabled={lessonIndex === section.lessons.length - 1}
                                style={{
                                  padding: '0.125rem',
                                  backgroundColor: 'transparent',
                                  border: 'none',
                                  cursor: lessonIndex === section.lessons.length - 1 ? 'not-allowed' : 'pointer',
                                  opacity: lessonIndex === section.lessons.length - 1 ? 0.5 : 1,
                                  fontSize: '0.75rem'
                                }}
                              >
                                ↓
                              </button>
                              <button
                                onClick={() => setEditingLesson({ sectionId: section.id, lesson })}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteLesson(section.id, lesson.id)}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lesson Editor Modal */}
      {editingLesson.lesson && (
        <LessonEditor
          lesson={editingLesson.lesson}
          sectionId={editingLesson.sectionId}
          onSave={(updatedLesson) => {
            updateLesson(editingLesson.sectionId, editingLesson.lesson!.id, updatedLesson);
            setEditingLesson({ sectionId: '', lesson: null });
          }}
          onCancel={() => setEditingLesson({ sectionId: '', lesson: null })}
        />
      )}
    </div>
  );
};
