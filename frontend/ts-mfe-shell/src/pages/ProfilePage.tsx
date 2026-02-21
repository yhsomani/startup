import React, { useState, useEffect } from 'react';
// import { useAuth } from '../contexts/AuthContext';
import ProfileEditor, { ProfileData } from '../components/ProfileEditor';
import api from '../services/api';

interface UserProfile extends ProfileData {
  id: string;
  email: string;
  role: string;
  profilePictureUrl: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

const ProfilePage: React.FC = () => {
  // const { user } = useAuth(); // user unused
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/profile');
      setProfile(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (updatedProfile: ProfileData) => {
    try {
      setProfile(prev => prev ? { ...prev, ...updatedProfile } : null);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handlePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and GIF are allowed.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsLoading(true);
      const response = await api.post('/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update local profile with new picture URL
      if (profile) {
        setProfile({
          ...profile,
          profilePictureUrl: response.data.profilePictureUrl,
          updatedAt: new Date().toISOString()
        });
      }

      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setIsLoading(false);
    }
  };

  const getDisplayName = () => {
    if (!profile) return 'User';
    return profile.firstName || profile.lastName
      ? `${profile.firstName} ${profile.lastName}`.trim()
      : profile.email.split('@')[0];
  };

  const getInitials = () => {
    if (!profile) return 'U';
    if (profile.firstName && profile.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();
    }
    return profile.email?.charAt(0).toUpperCase() || 'U';
  };

  if (isLoading && !profile) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          width: '90%',
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
            Error Loading Profile
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            {error}
          </p>
          <button
            onClick={fetchProfile}
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
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null; // or loading state
  }

  if (isEditing) {
    return (
      <ProfileEditor
        profile={profile}
        onSave={handleSaveProfile}
        onCancel={() => setIsEditing(false)}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Profile Header */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
            {/* Profile Picture */}
            <div style={{ position: 'relative' }}>
              {profile.profilePictureUrl ? (
                <img
                  src={profile.profilePictureUrl}
                  alt={getDisplayName()}
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid #e5e7eb'
                  }}
                />
              ) : (
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  backgroundColor: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '2rem',
                  fontWeight: 600,
                  border: '4px solid #e5e7eb'
                }}>
                  {getInitials()}
                </div>
              )}

              {/* Upload Button Overlay */}
              <label style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                backgroundColor: '#4f46e5',
                color: 'white',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1rem'
              }}>
                📷
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePictureUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* User Info */}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                {getDisplayName()}
              </h1>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                {profile.email}
              </p>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  fontWeight: 600
                }}>
                  {profile.role}
                </span>
                {profile.location && (
                  <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    📍 {profile.location}
                  </span>
                )}
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setIsEditing(true)}
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
              Edit Profile
            </button>
          </div>

          {profile.bio && (
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                About
              </h3>
              <p style={{ color: '#374151', lineHeight: '1.6' }}>
                {profile.bio}
              </p>
            </div>
          )}
        </div>

        {/* Additional Information */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
            Profile Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Left Column */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
                Contact Information
              </h4>

              {profile.phone && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Phone
                  </div>
                  <p style={{ color: '#374151' }}>
                    📞 {profile.phone}
                  </p>
                </div>
              )}

              {profile.website && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Website
                  </div>
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#4f46e5',
                      textDecoration: 'none',
                      fontWeight: 500
                    }}
                  >
                    🌐 {profile.website}
                  </a>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
                Social Links
              </h4>

              {profile.linkedin && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    LinkedIn
                  </div>
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#4f46e5',
                      textDecoration: 'none',
                      fontWeight: 500
                    }}
                  >
                    💼 LinkedIn Profile
                  </a>
                </div>
              )}

              {profile.github && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    GitHub
                  </div>
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#4f46e5',
                      textDecoration: 'none',
                      fontWeight: 500
                    }}
                  >
                    🐙 GitHub Profile
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Learning Preferences */}
          {profile.learningPreferences && (
            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#374151' }}>
                Learning Preferences
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Preferred Languages
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {profile.learningPreferences.languages?.map(lang => (
                      <span key={lang} style={{
                        padding: '0.125rem 0.5rem',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        color: '#374151'
                      }}>
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Difficulty Level
                  </div>
                  <span style={{
                    padding: '0.125rem 0.5rem',
                    backgroundColor: '#e0f2fe',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    color: '#0369a1',
                    textTransform: 'capitalize'
                  }}>
                    {profile.learningPreferences.difficulty_level || 'All Levels'}
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                    Topics of Interest
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {profile.learningPreferences.topics?.slice(0, 3).map(topic => (
                      <span key={topic} style={{
                        padding: '0.125rem 0.5rem',
                        backgroundColor: '#fef3c7',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        color: '#92400e'
                      }}>
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Account Stats */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            Member since: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
          </div>
          {profile.updatedAt && (
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Last updated: {new Date(profile.updatedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>

  );
};

export default ProfilePage;