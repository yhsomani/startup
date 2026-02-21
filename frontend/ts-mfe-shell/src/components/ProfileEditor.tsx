import React, { useState } from 'react';
import api from '../services/api';

export interface ProfileData {
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  linkedin: string | null;
  github: string | null;
  learningPreferences: {
    languages: string[];
    topics: string[];
    difficulty_level: string;
  };
}

interface ProfileEditorProps {
  profile: ProfileData;
  onSave: (profile: ProfileData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, onSave, onCancel, isLoading = false }) => {
  const [editedProfile, setEditedProfile] = useState<ProfileData>(profile);
  const [activeTab, setActiveTab] = useState<'basic' | 'preferences' | 'social'>('basic');
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);

    try {
      await api.put('/profile', editedProfile);
      onSave(editedProfile);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const updateProfile = (updates: Partial<ProfileData>) => {
    setEditedProfile(prev => ({ ...prev, ...updates }));
  };

  const updateLearningPreferences = (updates: Partial<ProfileData['learningPreferences']>) => {
    setEditedProfile(prev => ({
      ...prev,
      learningPreferences: { ...prev.learningPreferences, ...updates }
    }));
  };

  const renderBasicTab = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            First Name
          </label>
          <input
            type="text"
            value={editedProfile.firstName || ''}
            onChange={(e) => updateProfile({ firstName: e.target.value })}
            placeholder="John"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Last Name
          </label>
          <input
            type="text"
            value={editedProfile.lastName || ''}
            onChange={(e) => updateProfile({ lastName: e.target.value })}
            placeholder="Doe"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          Bio
        </label>
        <textarea
          value={editedProfile.bio || ''}
          onChange={(e) => updateProfile({ bio: e.target.value })}
          placeholder="Tell us about yourself..."
          rows={4}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '1rem',
            resize: 'vertical'
          }}
        />
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
          {editedProfile.bio?.length || 0}/500 characters
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Phone
          </label>
          <input
            type="tel"
            value={editedProfile.phone || ''}
            onChange={(e) => updateProfile({ phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            Location
          </label>
          <input
            type="text"
            value={editedProfile.location || ''}
            onChange={(e) => updateProfile({ location: e.target.value })}
            placeholder="San Francisco, CA"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
        </div>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          Preferred Languages
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'].map(lang => (
            <label key={lang} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editedProfile.learningPreferences.languages?.includes(lang) || false}
                onChange={(e) => {
                  const languages = editedProfile.learningPreferences.languages || [];
                  if (e.target.checked) {
                    updateLearningPreferences({ languages: [...languages, lang] });
                  } else {
                    updateLearningPreferences({ languages: languages.filter(l => l !== lang) });
                  }
                }}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.875rem' }}>{lang}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          Learning Topics
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {[
            'Web Development', 'Mobile Development', 'Data Science',
            'Machine Learning', 'DevOps', 'Design', 'Business'
          ].map(topic => (
            <label key={topic} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editedProfile.learningPreferences.topics?.includes(topic) || false}
                onChange={(e) => {
                  const topics = editedProfile.learningPreferences.topics || [];
                  if (e.target.checked) {
                    updateLearningPreferences({ topics: [...topics, topic] });
                  } else {
                    updateLearningPreferences({ topics: topics.filter(t => t !== topic) });
                  }
                }}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.875rem' }}>{topic}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          Difficulty Level
        </label>
        <select
          value={editedProfile.learningPreferences.difficulty_level || 'beginner'}
          onChange={(e) => updateLearningPreferences({ difficulty_level: e.target.value })}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="all">All Levels</option>
        </select>
      </div>
    </div>
  );

  const renderSocialTab = () => (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          Personal Website
        </label>
        <input
          type="url"
          value={editedProfile.website || ''}
          onChange={(e) => updateProfile({ website: e.target.value })}
          placeholder="https://example.com"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          LinkedIn
        </label>
        <input
          type="url"
          value={editedProfile.linkedin || ''}
          onChange={(e) => updateProfile({ linkedin: e.target.value })}
          placeholder="https://linkedin.com/in/johndoe"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
          GitHub
        </label>
        <input
          type="url"
          value={editedProfile.github || ''}
          onChange={(e) => updateProfile({ github: e.target.value })}
          placeholder="https://github.com/johndoe"
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '1rem'
          }}
        />
      </div>
    </div>
  );

  return (
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
        maxWidth: '600px',
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
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
            Edit Profile
          </h2>
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              color: '#6b7280',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            ×
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '0.75rem',
            margin: '1rem',
            color: '#dc2626'
          }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
          <button
            onClick={() => setActiveTab('basic')}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'basic' ? 'white' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'basic' ? '2px solid #4f46e5' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              color: activeTab === 'basic' ? '#4f46e5' : '#6b7280'
            }}
          >
            Basic Info
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'preferences' ? 'white' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'preferences' ? '2px solid #4f46e5' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              color: activeTab === 'preferences' ? '#4f46e5' : '#6b7280'
            }}
          >
            Preferences
          </button>
          <button
            onClick={() => setActiveTab('social')}
            style={{
              padding: '1rem 1.5rem',
              backgroundColor: activeTab === 'social' ? 'white' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'social' ? '2px solid #4f46e5' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              color: activeTab === 'social' ? '#4f46e5' : '#6b7280'
            }}
          >
            Social Links
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '1.5rem' }}>
          {activeTab === 'basic' && renderBasicTab()}
          {activeTab === 'preferences' && renderPreferencesTab()}
          {activeTab === 'social' && renderSocialTab()}
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
            disabled={isLoading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.5 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: isLoading ? '#d1d5db' : '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;