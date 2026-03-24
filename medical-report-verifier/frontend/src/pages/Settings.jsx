import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Settings = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notifications, setNotifications] = useState({
    emailNotifications: user?.settings?.emailNotifications || true,
    reportVerifications: user?.settings?.reportVerifications || true,
    accessRequests: user?.settings?.accessRequests || true,
    weeklyDigest: user?.settings?.weeklyDigest || false
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error changing password' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleNotificationChange = async (key, value) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    try {
      await api.put('/auth/settings', { notifications: { ...notifications, [key]: value } });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await api.delete('/auth/account');
        logout();
      } catch (error) {
        setMessage({ type: 'error', text: error.response?.data?.message || 'Error deleting account' });
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {message && (
        <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Change Password */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current Password</label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="w-full border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full border rounded p-2"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm New Password</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full border rounded p-2"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Notification Preferences</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive email updates about your account</p>
            </div>
            <button
              onClick={() => handleNotificationChange('emailNotifications', !notifications.emailNotifications)}
              className={`w-12 h-6 rounded-full transition ${notifications.emailNotifications ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transform transition ${notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Report Verifications</p>
              <p className="text-sm text-gray-500">Get notified when your reports are verified</p>
            </div>
            <button
              onClick={() => handleNotificationChange('reportVerifications', !notifications.reportVerifications)}
              className={`w-12 h-6 rounded-full transition ${notifications.reportVerifications ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transform transition ${notifications.reportVerifications ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Access Requests</p>
              <p className="text-sm text-gray-500">Get notified when someone requests access to your reports</p>
            </div>
            <button
              onClick={() => handleNotificationChange('accessRequests', !notifications.accessRequests)}
              className={`w-12 h-6 rounded-full transition ${notifications.accessRequests ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transform transition ${notifications.accessRequests ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Weekly Digest</p>
              <p className="text-sm text-gray-500">Receive a weekly summary of your activity</p>
            </div>
            <button
              onClick={() => handleNotificationChange('weeklyDigest', !notifications.weeklyDigest)}
              className={`w-12 h-6 rounded-full transition ${notifications.weeklyDigest ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transform transition ${notifications.weeklyDigest ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Security</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
              Coming Soon
            </button>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Session Management</p>
              <p className="text-sm text-gray-500">View and manage active sessions</p>
            </div>
            <button className="text-blue-500 hover:text-blue-700">
              View Sessions →
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow border border-red-200">
        <div className="p-6 border-b border-red-200 bg-red-50">
          <h2 className="text-xl font-bold text-red-600">Danger Zone</h2>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-red-600">Delete Account</p>
              <p className="text-sm text-gray-500">
                Permanently delete your account and all associated data.
                This action cannot be undone.
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;