import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    ...(user?.role === 'patient' && {
      dateOfBirth: user?.dateOfBirth?.split('T')[0] || '',
      address: user?.address || { street: '', city: '', state: '', zipCode: '', country: '' }
    }),
    ...(user?.role === 'lab' && {
      hospitalName: user?.hospitalName || '',
      labPhone: user?.labPhone || '',
      labAddress: user?.labAddress || { street: '', city: '', state: '', zipCode: '', country: '' }
    }),
    ...(user?.role === 'employer' && {
      companyName: user?.companyName || '',
      department: user?.department || '',
      position: user?.position || '',
      companyPhone: user?.companyPhone || '',
      companyAddress: user?.companyAddress || { street: '', city: '', state: '', zipCode: '', country: '' }
    })
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', formData);
      updateUser(res.data.data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Error updating profile' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your account information</p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Account Information</h2>
              <p className="text-sm text-gray-500">Role: <span className="capitalize">{user.role}</span></p>
            </div>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              {editing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded">{user.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              {editing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded">{user.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              {editing ? (
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber || ''}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded">{user.phoneNumber || 'Not set'}</p>
              )}
            </div>
          </div>

          {/* Role-specific fields */}
          {user.role === 'patient' && (
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-lg">Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  {editing ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth || ''}
                      onChange={handleChange}
                      className="w-full border rounded p-2"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded">{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Patient ID</label>
                  <p className="p-2 bg-gray-50 rounded">{user.patientId || 'Not assigned'}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                {editing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      name="address.street"
                      placeholder="Street"
                      value={formData.address?.street || ''}
                      onChange={handleChange}
                      className="w-full border rounded p-2"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        name="address.city"
                        placeholder="City"
                        value={formData.address?.city || ''}
                        onChange={handleChange}
                        className="w-full border rounded p-2"
                      />
                      <input
                        type="text"
                        name="address.state"
                        placeholder="State"
                        value={formData.address?.state || ''}
                        onChange={handleChange}
                        className="w-full border rounded p-2"
                      />
                      <input
                        type="text"
                        name="address.zipCode"
                        placeholder="ZIP Code"
                        value={formData.address?.zipCode || ''}
                        onChange={handleChange}
                        className="w-full border rounded p-2"
                      />
                      <input
                        type="text"
                        name="address.country"
                        placeholder="Country"
                        value={formData.address?.country || ''}
                        onChange={handleChange}
                        className="w-full border rounded p-2"
                      />
                    </div>
                  </div>
                ) : (
                  user.address ? (
                    <p className="p-2 bg-gray-50 rounded">
                      {user.address.street}, {user.address.city}, {user.address.state} {user.address.zipCode}, {user.address.country}
                    </p>
                  ) : (
                    <p className="p-2 bg-gray-50 rounded">Not set</p>
                  )
                )}
              </div>
            </div>
          )}

          {user.role === 'lab' && (
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-lg">Laboratory Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Hospital/Lab Name</label>
                  {editing ? (
                    <input
                      type="text"
                      name="hospitalName"
                      value={formData.hospitalName || ''}
                      onChange={handleChange}
                      className="w-full border rounded p-2"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded">{user.hospitalName || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lab ID</label>
                  <p className="p-2 bg-gray-50 rounded">{user.labId || 'Not assigned'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lab Phone</label>
                  {editing ? (
                    <input
                      type="tel"
                      name="labPhone"
                      value={formData.labPhone || ''}
                      onChange={handleChange}
                      className="w-full border rounded p-2"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded">{user.labPhone || 'Not set'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {user.role === 'employer' && (
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-lg">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company Name</label>
                  {editing ? (
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName || ''}
                      onChange={handleChange}
                      className="w-full border rounded p-2"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded">{user.companyName || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  {editing ? (
                    <input
                      type="text"
                      name="department"
                      value={formData.department || ''}
                      onChange={handleChange}
                      className="w-full border rounded p-2"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded">{user.department || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Position</label>
                  {editing ? (
                    <input
                      type="text"
                      name="position"
                      value={formData.position || ''}
                      onChange={handleChange}
                      className="w-full border rounded p-2"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded">{user.position || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Company Phone</label>
                  {editing ? (
                    <input
                      type="tel"
                      name="companyPhone"
                      value={formData.companyPhone || ''}
                      onChange={handleChange}
                      className="w-full border rounded p-2"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded">{user.companyPhone || 'Not set'}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Wallet Info */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Blockchain Wallet</h3>
            <div className="bg-gray-50 rounded p-3">
              <p className="text-sm font-mono break-all">{user.walletAddress || 'No wallet connected'}</p>
            </div>
          </div>

          {/* Action Buttons */}
          {editing && (
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    name: user.name,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                  });
                }}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;