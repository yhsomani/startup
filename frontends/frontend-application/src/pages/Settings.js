/**
 * Settings Page Component
 * Application settings and preferences
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Notifications,
  Security,
  Palette,
  Language,
  Email,
  Sms,
  Push,
  DarkMode,
  LightMode,
  DeleteForever
} from '@mui/icons-material';

const Settings = () => {
  const [settings, setSettings] = useState({
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    jobAlerts: true,
    messageAlerts: true,
    applicationUpdates: true,
    newsletterEmails: false,
    
    // Appearance
    theme: 'light',
    language: 'en',
    fontSize: 'medium',
    
    // Privacy
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowMessages: true,
    
    // Account
    twoFactorAuth: false,
    sessionTimeout: 30
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // Mock API call
      setTimeout(() => {
        setLoading(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }, 1000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    // Handle account deletion
    setShowDeleteDialog(false);
  };

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account settings and preferences
        </Typography>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      {/* Notification Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Notifications sx={{ mr: 1 }} />
            Notifications
          </Typography>
          
          <List>
            <ListItem>
              <ListItemText 
                primary="Email Notifications" 
                secondary="Receive notifications via email"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemText 
                primary="Push Notifications" 
                secondary="Receive push notifications in your browser"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.pushNotifications}
                  onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemText 
                primary="SMS Notifications" 
                secondary="Receive text message alerts"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.smsNotifications}
                  onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemText 
                primary="Job Alerts" 
                secondary="Get notified about new matching jobs"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.jobAlerts}
                  onChange={(e) => handleSettingChange('jobAlerts', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemText 
                primary="Message Alerts" 
                secondary="Get notified when you receive new messages"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.messageAlerts}
                  onChange={(e) => handleSettingChange('messageAlerts', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemText 
                primary="Application Updates" 
                secondary="Track your application status changes"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.applicationUpdates}
                  onChange={(e) => handleSettingChange('applicationUpdates', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemText 
                primary="Newsletter Emails" 
                secondary="Receive weekly career tips and updates"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.newsletterEmails}
                  onChange={(e) => handleSettingChange('newsletterEmails', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Palette sx={{ mr: 1 }} />
            Appearance
          </Typography>
          
          <Box display="flex" gap={3} flexWrap="wrap">
            <FormControl>
              <InputLabel>Theme</InputLabel>
              <Select
                value={settings.theme}
                label="Theme"
                onChange={(e) => handleSettingChange('theme', e.target.value)}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="light">
                  <Box display="flex" alignItems="center">
                    <LightMode sx={{ mr: 1 }} />
                    Light
                  </Box>
                </MenuItem>
                <MenuItem value="dark">
                  <Box display="flex" alignItems="center">
                    <DarkMode sx={{ mr: 1 }} />
                    Dark
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>Language</InputLabel>
              <Select
                value={settings.language}
                label="Language"
                onChange={(e) => handleSettingChange('language', e.target.value)}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Español</MenuItem>
                <MenuItem value="fr">Français</MenuItem>
                <MenuItem value="de">Deutsch</MenuItem>
              </Select>
            </FormControl>

            <FormControl>
              <InputLabel>Font Size</InputLabel>
              <Select
                value={settings.fontSize}
                label="Font Size"
                onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="large">Large</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Security sx={{ mr: 1 }} />
            Privacy & Security
          </Typography>
          
          <List>
            <ListItem>
              <ListItemText 
                primary="Profile Visibility" 
                secondary="Control who can see your profile"
              />
              <ListItemSecondaryAction>
                <Select
                  value={settings.profileVisibility}
                  onChange={(e) => handleSettingChange('profileVisibility', e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="public">Public</MenuItem>
                  <MenuItem value="private">Private</MenuItem>
                  <MenuItem value="connections">Connections Only</MenuItem>
                </Select>
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemText 
                primary="Show Online Status" 
                secondary="Let others see when you're online"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.showOnlineStatus}
                  onChange={(e) => handleSettingChange('showOnlineStatus', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemText 
                primary="Allow Messages" 
                secondary="Receive messages from other users"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.allowMessages}
                  onChange={(e) => handleSettingChange('allowMessages', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemText 
                primary="Two-Factor Authentication" 
                secondary="Add an extra layer of security to your account"
              />
              <ListItemSecondaryAction>
                <Switch
                  checked={settings.twoFactorAuth}
                  onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemText 
                primary="Session Timeout" 
                secondary="Automatically log out after inactivity"
              />
              <ListItemSecondaryAction>
                <Select
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value={15}>15 minutes</MenuItem>
                  <MenuItem value={30}>30 minutes</MenuItem>
                  <MenuItem value={60}>1 hour</MenuItem>
                  <MenuItem value={120}>2 hours</MenuItem>
                </Select>
              </ListItemSecondaryAction>
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Account Management
          </Typography>
          
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button variant="outlined" color="primary">
              Export Data
            </Button>
            <Button variant="outlined" color="warning">
              Change Password
            </Button>
            <Button 
              variant="outlined" 
              color="error"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete Account
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Box display="flex" justifyContent="center">
        <Button
          variant="contained"
          size="large"
          onClick={handleSave}
          disabled={loading}
          sx={{ minWidth: 200 }}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteAccount}
            startIcon={<DeleteForever />}
          >
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;