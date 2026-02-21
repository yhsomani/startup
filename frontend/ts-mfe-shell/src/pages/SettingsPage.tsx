import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface UserSettings {
  profile: {
    email: string;
    firstName: string;
    lastName: string;
    bio: string;
    avatar: string;
    linkedIn: string;
    github: string;
    website: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    newDiscussionAlerts: boolean;
    replyAlerts: boolean;
    achievementAlerts: boolean;
    weeklyDigest: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
    autoPlayVideos: boolean;
    showCaptions: boolean;
    quality: 'auto' | '360p' | '720p' | '1080p';
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'connections';
    showLearningProgress: boolean;
    showAchievements: boolean;
    allowMessages: boolean;
    allowConnectionRequests: boolean;
  };
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'preferences' | 'privacy'>('profile');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/settings');
      setSettings(response.data);
    } catch (err: unknown) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updatedSettings: UserSettings) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      await api.put('/user/settings', updatedSettings);
      setSettings(updatedSettings);
      setSuccessMessage('Settings saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setError((err as any).response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileChange = (field: keyof UserSettings['profile'], value: string) => {
    if (settings) {
      setSettings(prev => ({
        ...prev!,
        profile: { ...prev!.profile, [field]: value }
      }));
    }
  };

  const handleNotificationChange = (field: keyof UserSettings['notifications'], value: boolean) => {
    if (settings) {
      setSettings(prev => ({
        ...prev!,
        notifications: { ...prev!.notifications, [field]: value }
      }));
    }
  };

  const handlePreferenceChange = (field: keyof UserSettings['preferences'], value: string | boolean) => {
    if (settings) {
      setSettings(prev => ({
        ...prev!,
        preferences: { ...prev!.preferences, [field]: value }
      }));
    }
  };

  const handlePrivacyChange = (field: keyof UserSettings['privacy'], value: boolean | string) => {
    if (settings) {
      setSettings(prev => ({
        ...prev!,
        privacy: { ...prev!.privacy, [field]: value as any }
      }));
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⚙️</div>
        <h2>Loading settings...</h2>
      </div>
    );
  }

  if (!settings) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>❌</div>
        <h2>Failed to load settings</h2>
        <button
          onClick={fetchSettings}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: '👤 Profile', icon: '👤' },
    { id: 'notifications', label: '🔔 Notifications', icon: '🔔' },
    { id: 'preferences', label: '⚙️ Preferences', icon: '⚙️' },
    { id: 'privacy', label: '🔒 Privacy', icon: '🔒' }
  ] as const;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>
        Settings
      </h1>

      {/* Success/Error Messages */}
      {successMessage && (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #10b981',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '2rem',
          color: '#065f46'
        }}>
          ✅ {successMessage}
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '2rem',
          color: '#dc2626'
        }}>
          ❌ {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '1rem 1.5rem',
                backgroundColor: activeTab === tab.id ? '#4f46e5' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#6b7280',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #4f46e5' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '1rem',
                marginBottom: activeTab === tab.id ? '-1px' : '0'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        border: '1px solid #e5e7eb'
      }}>
        {/* Profile Settings */}
        {activeTab === 'profile' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>
              Profile Settings
            </h2>

            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Basic Information
                </h3>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={settings.profile.firstName}
                    onChange={(e) => handleProfileChange('firstName', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={settings.profile.lastName}
                    onChange={(e) => handleProfileChange('lastName', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Bio
                  </label>
                  <textarea
                    value={settings.profile.bio}
                    onChange={(e) => handleProfileChange('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      lineHeight: '1.4',
                      resize: 'vertical'
                    }}
                    maxLength={500}
                  />
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Social Links
                </h3>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={settings.profile.linkedIn}
                    onChange={(e) => handleProfileChange('linkedIn', e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    GitHub
                  </label>
                  <input
                    type="url"
                    value={settings.profile.github}
                    onChange={(e) => handleProfileChange('github', e.target.value)}
                    placeholder="https://github.com/yourusername"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Website
                  </label>
                  <input
                    type="url"
                    value={settings.profile.website}
                    onChange={(e) => handleProfileChange('website', e.target.value)}
                    placeholder="https://yourwebsite.com"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>
              Notification Settings
            </h2>

            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
              {Object.entries(settings.notifications).map(([key, value]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handleNotificationChange(key as keyof UserSettings['notifications'], e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {key === 'emailNotifications' && 'Receive email notifications for your activities'}
                      {key === 'pushNotifications' && 'Receive browser push notifications'}
                      {key === 'newDiscussionAlerts' && 'Get notified when someone posts in your discussions'}
                      {key === 'replyAlerts' && 'Get notified when someone replies to your posts'}
                      {key === 'achievementAlerts' && 'Celebrate your achievements as they happen'}
                      {key === 'weeklyDigest' && 'Weekly summary of your learning progress'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Preference Settings */}
        {activeTab === 'preferences' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>
              Preferences
            </h2>

            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Display
                </h3>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Language
                  </label>
                  <select
                    value={settings.preferences.language}
                    onChange={(e) => handlePreferenceChange('language', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Theme
                  </label>
                  <select
                    value={settings.preferences.theme}
                    onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="auto">Auto</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Font Size
                  </label>
                  <select
                    value={settings.preferences.fontSize}
                    onChange={(e) => handlePreferenceChange('fontSize', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Video
                </h3>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      checked={settings.preferences.autoPlayVideos}
                      onChange={(e) => handlePreferenceChange('autoPlayVideos', e.target.checked)}
                    />
                    Auto-play videos
                  </label>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      checked={settings.preferences.showCaptions}
                      onChange={(e) => handlePreferenceChange('showCaptions', e.target.checked)}
                    />
                    Show captions by default
                  </label>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                    Default Video Quality
                  </label>
                  <select
                    value={settings.preferences.quality}
                    onChange={(e) => handlePreferenceChange('quality', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="auto">Auto</option>
                    <option value="1080p">1080p (HD)</option>
                    <option value="720p">720p (SD)</option>
                    <option value="360p">360p (Low)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Settings */}
        {activeTab === 'privacy' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem' }}>
              Privacy Settings
            </h2>

            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr' }}>
              {Object.entries(settings.privacy).map(([key, value]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={value as any}
                    onChange={(e) => handlePrivacyChange(key as keyof UserSettings['privacy'], e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {key === 'profileVisibility' && 'Control who can see your profile'}
                      {key === 'showLearningProgress' && 'Display your learning progress to others'}
                      {key === 'showAchievements' && 'Show your achievements on your profile'}
                      {key === 'allowMessages' && 'Allow other users to send you messages'}
                      {key === 'allowConnectionRequests' && 'Allow others to request connections'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button
          onClick={() => settings && saveSettings(settings)}
          disabled={saving}
          style={{
            padding: '0.875rem 2rem',
            backgroundColor: saving ? '#9ca3af' : '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: saving ? 'wait' : 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;