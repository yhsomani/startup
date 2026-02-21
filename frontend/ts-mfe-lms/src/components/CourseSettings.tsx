import React from 'react';

interface CourseSettingsProps {
  courseData: any;
  updateCourseData: (newData: any) => void;
}

export const CourseSettings: React.FC<CourseSettingsProps> = ({ courseData, updateCourseData }) => {
  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
        Course Settings
      </h2>

      <div style={{ display: 'grid', gap: '2rem' }}>
        {/* Access Settings */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
            Access Settings
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={courseData.requireEnrollment ?? true}
                onChange={(e) => updateCourseData({ requireEnrollment: e.target.checked })}
                style={{ cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 500 }}>Require Enrollment</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Students must enroll to access course content
                </div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={courseData.allowPreview ?? false}
                onChange={(e) => updateCourseData({ allowPreview: e.target.checked })}
                style={{ cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 500 }}>Allow Free Preview</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Students can preview some lessons without enrollment
                </div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={courseData.certificateEnabled ?? true}
                onChange={(e) => updateCourseData({ certificateEnabled: e.target.checked })}
                style={{ cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontWeight: 500 }}>Enable Certificate</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Students receive certificate upon completion
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Enrollment Settings */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
            Enrollment Settings
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Max Students
              </label>
              <input
                type="number"
                min="1"
                value={courseData.maxStudents || ''}
                onChange={(e) => updateCourseData({ maxStudents: e.target.value ? Number(e.target.value) : null })}
                placeholder="Unlimited"
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
                Enrollment Period (days)
              </label>
              <input
                type="number"
                min="1"
                value={courseData.enrollmentPeriod || 365}
                onChange={(e) => updateCourseData({ enrollmentPeriod: Number(e.target.value) })}
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

        {/* Prerequisites */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
            Prerequisites
          </h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '1rem' }}>
              <input
                type="checkbox"
                checked={courseData.hasPrerequisites ?? false}
                onChange={(e) => updateCourseData({ hasPrerequisites: e.target.checked })}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 500 }}>This course has prerequisites</span>
            </label>

            {courseData.hasPrerequisites && (
              <div>
                <textarea
                  value={courseData.prerequisites || ''}
                  onChange={(e) => updateCourseData({ prerequisites: e.target.value })}
                  placeholder="List the required knowledge, skills, or courses students should have before enrolling..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    resize: 'vertical'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Learning Objectives */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
            Learning Objectives
          </h3>
          <textarea
            value={courseData.learningObjectives || ''}
            onChange={(e) => updateCourseData({ learningObjectives: e.target.value })}
            placeholder="What will students be able to do after completing this course?&#10;• Learn to build web applications&#10;• Master JavaScript fundamentals&#10;• Understand database design"
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              resize: 'vertical',
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}
          />
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Use bullet points (•) to list objectives. This helps students understand what they'll learn.
          </p>
        </div>

        {/* Target Audience */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
            Target Audience
          </h3>
          <textarea
            value={courseData.targetAudience || ''}
            onChange={(e) => updateCourseData({ targetAudience: e.target.value })}
            placeholder="Who is this course for?&#10;• Beginners looking to start programming&#10;• Developers wanting to learn React&#10;• Students building their portfolio"
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              resize: 'vertical',
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}
          />
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
            Be specific about who will benefit most from this course.
          </p>
        </div>

        {/* Difficulty & Time */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
            Difficulty & Time Commitment
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                Estimated Duration (hours)
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={courseData.estimatedDuration || ''}
                onChange={(e) => updateCourseData({ estimatedDuration: e.target.value ? Number(e.target.value) : null })}
                placeholder="e.g., 10.5"
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
                Weekly Hours
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={courseData.weeklyHours || ''}
                onChange={(e) => updateCourseData({ weeklyHours: e.target.value ? Number(e.target.value) : null })}
                placeholder="e.g., 3"
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

        {/* Additional Resources */}
        <div>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
            Additional Resources
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                GitHub Repository (optional)
              </label>
              <input
                type="url"
                value={courseData.githubRepo || ''}
                onChange={(e) => updateCourseData({ githubRepo: e.target.value })}
                placeholder="https://github.com/username/repository"
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
                Slack/Discord Community (optional)
              </label>
              <input
                type="url"
                value={courseData.communityUrl || ''}
                onChange={(e) => updateCourseData({ communityUrl: e.target.value })}
                placeholder="https://discord.gg/invite"
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

        {/* Tips */}
        <div style={{
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          padding: '1rem'
        }}>
          <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#0369a1' }}>
            💡 Course Settings Tips
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#0c4a6e', fontSize: '0.875rem' }}>
            <li>Clear learning objectives help students set expectations</li>
            <li>Define your target audience to attract the right students</li>
            <li>Enable certificates to increase course completion rates</li>
            <li>Set realistic time commitments to reduce dropouts</li>
            <li>Provide community resources for better engagement</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
