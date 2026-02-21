import React from 'react';

interface CoursePreviewProps {
  courseData: any;
  updateCourseData: (newData: any) => void;
}

export const CoursePreview: React.FC<CoursePreviewProps> = ({ courseData, updateCourseData }) => {
  const getTotalDuration = () => {
    return courseData.sections?.reduce((total: number, section: any) => {
      return total + section.lessons?.reduce((sectionTotal: number, lesson: any) => {
        return sectionTotal + (lesson.duration || 0);
      }, 0) || 0;
    }, 0) || 0;
  };

  const getTotalLessons = () => {
    return courseData.sections?.reduce((total: number, section: any) => {
      return total + (section.lessons?.length || 0);
    }, 0) || 0;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getCompletionChecklist = () => {
    const checklist = [];

    // Basic info checks
    if (courseData.title) checklist.push({ item: 'Course title', completed: true });
    else checklist.push({ item: 'Course title', completed: false });

    if (courseData.description && courseData.description.length >= 200) checklist.push({ item: 'Course description (200+ chars)', completed: true });
    else checklist.push({ item: 'Course description (200+ chars)', completed: false });

    if (courseData.category) checklist.push({ item: 'Course category', completed: true });
    else checklist.push({ item: 'Course category', completed: false });

    // Content checks
    if (courseData.sections && courseData.sections.length > 0) checklist.push({ item: 'At least one section', completed: true });
    else checklist.push({ item: 'At least one section', completed: false });

    if (getTotalLessons() > 0) checklist.push({ item: 'At least one lesson', completed: true });
    else checklist.push({ item: 'At least one lesson', completed: false });

    // Settings checks
    if (courseData.learningObjectives) checklist.push({ item: 'Learning objectives', completed: true });
    else checklist.push({ item: 'Learning objectives', completed: false });

    if (courseData.targetAudience) checklist.push({ item: 'Target audience', completed: true });
    else checklist.push({ item: 'Target audience', completed: false });

    return checklist;
  };

  const getCompletionPercentage = () => {
    const checklist = getCompletionChecklist();
    const completed = checklist.filter(item => item.completed).length;
    return Math.round((completed / checklist.length) * 100);
  };

  const isReadyToPublish = () => {
    return getCompletionPercentage() >= 80;
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
        Course Preview & Publish
      </h2>

      <div style={{ display: 'grid', gap: '2rem' }}>
        {/* Completion Status */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '1.5rem'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
            Course Completion Status
          </h3>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 500 }}>Overall Completion</span>
              <span style={{ fontWeight: 600, color: getCompletionPercentage() >= 80 ? '#059669' : '#d97706' }}>
                {getCompletionPercentage()}%
              </span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${getCompletionPercentage()}%`,
                height: '100%',
                backgroundColor: getCompletionPercentage() >= 80 ? '#10b981' : '#f59e0b',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
            {isReadyToPublish()
              ? '✅ Your course is ready to publish!'
              : '⚠️ Complete more sections before publishing for best results.'
            }
          </div>

          {/* Checklist */}
          <div>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>
              Publication Checklist:
            </h4>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {getCompletionChecklist().map((check, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: check.completed ? '#10b981' : '#ef4444', fontSize: '1rem' }}>
                    {check.completed ? '✓' : '○'}
                  </span>
                  <span style={{
                    fontSize: '0.875rem',
                    color: check.completed ? '#374151' : '#6b7280',
                    textDecoration: check.completed ? 'none' : 'line-through'
                  }}>
                    {check.item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Course Preview Card */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
            How Students Will See Your Course
          </h3>

          <div style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Course Header */}
            <div style={{
              height: '200px',
              backgroundColor: courseData.thumbnail ? '#f3f4f6' : '#4f46e5',
              backgroundImage: courseData.thumbnail ? `url(${courseData.thumbnail})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              {!courseData.thumbnail && (
                <div style={{ textAlign: 'center', color: 'white' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📚</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Course Thumbnail</div>
                </div>
              )}

              {/* Category Badge */}
              {courseData.category && (
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#374151'
                }}>
                  {courseData.category}
                </div>
              )}
            </div>

            {/* Course Info */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', lineHeight: '1.4' }}>
                    {courseData.title || 'Course Title'}
                  </h4>
                  {courseData.subtitle && (
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      {courseData.subtitle}
                    </p>
                  )}
                </div>

                <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                  {courseData.price > 0 ? (
                    <div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#059669' }}>
                        ${courseData.price}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        {courseData.currency}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#10b981',
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}>
                      FREE
                    </div>
                  )}
                </div>
              </div>

              {/* Course Meta */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                <span>📖 {courseData.sections?.length || 0} sections</span>
                <span>🎬 {getTotalLessons()} lessons</span>
                <span>⏱️ {formatDuration(getTotalDuration())}</span>
                <span>📊 {courseData.level || 'beginner'}</span>
                <span>🌐 {courseData.language || 'English'}</span>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1rem' }}>
                <p style={{
                  color: '#374151',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  maxHeight: '3rem',
                  overflow: 'hidden'
                }}>
                  {courseData.description || 'Course description will appear here...'}
                </p>
              </div>

              {/* Learning Objectives */}
              {courseData.learningObjectives && (
                <div style={{ marginBottom: '1rem' }}>
                  <h5 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>
                    What you'll learn:
                  </h5>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {courseData.learningObjectives.split('•').filter((item: string) => item.trim()).slice(0, 3).map((item: string, index: number) => (
                      <div key={index} style={{ marginBottom: '0.25rem' }}>
                        • {item.trim()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructor Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                backgroundColor: '#f9fafb',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600
                }}>
                  I
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Instructor Name</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Course Author</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Structure Preview */}
        {courseData.sections && courseData.sections.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
              Course Structure
            </h3>
            <div style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1rem',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              {courseData.sections.map((section: any, sectionIndex: number) => (
                <div key={section.id} style={{ marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                    {sectionIndex + 1}. {section.title || 'Section Title'}
                  </div>
                  {section.lessons && section.lessons.length > 0 && (
                    <div style={{ marginLeft: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {section.lessons.map((lesson: any, lessonIndex: number) => (
                        <div key={lesson.id} style={{ marginBottom: '0.25rem' }}>
                          {lessonIndex + 1}. {lesson.title || 'Lesson Title'}
                          <span style={{ marginLeft: '0.5rem' }}>
                            ({lesson.type || 'video'} • {lesson.duration || 0}min)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Publishing Options */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
            Publishing Options
          </h3>

          <div style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#92400e' }}>
              📢 Before You Publish
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#78350f', fontSize: '0.875rem' }}>
              <li>Review all content for accuracy and completeness</li>
              <li>Test video playback and quiz functionality</li>
              <li>Ensure learning objectives are measurable</li>
              <li>Check that pricing matches course value</li>
              <li>Verify all settings are configured correctly</li>
            </ul>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={courseData.notifyStudents ?? false}
                onChange={(e) => updateCourseData({ notifyStudents: e.target.checked })}
                style={{ cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 500 }}>Notify enrolled students</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Send email notification when course is published
                </div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={courseData.listInCatalog ?? true}
                onChange={(e) => updateCourseData({ listInCatalog: e.target.checked })}
                style={{ cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 500 }}>List in course catalog</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Make course discoverable to all students
                </div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={courseData.enableReviews ?? true}
                onChange={(e) => updateCourseData({ enableReviews: e.target.checked })}
                style={{ cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 500 }}>Enable student reviews</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Allow students to rate and review the course
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
