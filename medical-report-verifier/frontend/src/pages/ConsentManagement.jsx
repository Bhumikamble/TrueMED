import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ConsentManagement = () => {
  const { user, updateUser } = useAuth();
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedReports, setSelectedReports] = useState([]);
  const [availableReports, setAvailableReports] = useState([]);

  useEffect(() => {
    fetchConsents();
    fetchAvailableReports();
  }, []);

  const fetchConsents = async () => {
    try {
      const res = await api.get('/patient/consents');
      setConsents(res.data.data);
    } catch (error) {
      console.error('Error fetching consents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableReports = async () => {
    try {
      const res = await api.get('/patient/my-reports');
      setAvailableReports(res.data.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const revokeConsent = async (consentId) => {
    if (confirm('Are you sure you want to revoke this consent?')) {
      try {
        await api.delete(`/patient/consent/${consentId}`);
        fetchConsents();
      } catch (error) {
        alert('Error revoking consent: ' + error.response?.data?.message);
      }
    }
  };

  const grantConsent = async (employerEmail, reportIds, validDays) => {
    try {
      await api.post('/patient/grant-consent', {
        employerEmail,
        reportIds,
        validDays
      });
      setShowGrantModal(false);
      fetchConsents();
    } catch (error) {
      alert('Error granting consent: ' + error.response?.data?.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Consent Management</h1>
          <p className="text-gray-600">
            Control which employers can access your medical reports
          </p>
        </div>
        <button
          onClick={() => setShowGrantModal(true)}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          Grant New Consent
        </button>
      </div>

      {/* Active Consents */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Active Consents</h2>
        </div>
        <div className="divide-y">
          {consents.filter(c => c.status === 'active').length === 0 ? (
            <p className="p-6 text-gray-500 text-center">
              No active consents. Grant access to employers to share your reports.
            </p>
          ) : (
            consents.filter(c => c.status === 'active').map((consent, idx) => (
              <div key={idx} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold">{consent.employerName || 'Employer'}</h3>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Valid until: {new Date(consent.validUntil).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      Reports accessible: {consent.reportIds?.length || 0}
                    </p>
                    {consent.reportIds?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Reports:</p>
                        <ul className="list-disc list-inside text-xs text-gray-500">
                          {consent.reportIds.slice(0, 3).map((report, i) => (
                            <li key={i}>{report.reportTitle || report.reportHash?.substring(0, 20)}...</li>
                          ))}
                          {consent.reportIds.length > 3 && (
                            <li>and {consent.reportIds.length - 3} more...</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => revokeConsent(consent._id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Revoke Access
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Expired Consents */}
      {consents.filter(c => c.status === 'expired').length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Expired Consents</h2>
          </div>
          <div className="divide-y">
            {consents.filter(c => c.status === 'expired').map((consent, idx) => (
              <div key={idx} className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{consent.employerName || 'Employer'}</h3>
                    <p className="text-sm text-gray-500">
                      Expired on: {new Date(consent.validUntil).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedReports(consent.reportIds || []);
                      setShowGrantModal(true);
                    }}
                    className="text-blue-500 hover:text-blue-700 text-sm"
                  >
                    Renew Access
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grant Consent Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Grant Report Access</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Employer Email</label>
              <input
                type="email"
                id="employerEmail"
                placeholder="employer@company.com"
                className="w-full border rounded p-2"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Access Duration (days)</label>
              <input
                type="number"
                id="validDays"
                defaultValue="30"
                className="w-full border rounded p-2"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Reports to Share</label>
              <div className="border rounded max-h-48 overflow-y-auto">
                {availableReports.map((report) => (
                  <label key={report._id} className="flex items-center p-2 hover:bg-gray-50">
                    <input
                      type="checkbox"
                      value={report._id}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedReports([...selectedReports, report._id]);
                        } else {
                          setSelectedReports(selectedReports.filter(id => id !== report._id));
                        }
                      }}
                      className="mr-3"
                    />
                    <div>
                      <p className="text-sm font-medium">{report.reportTitle || 'Medical Report'}</p>
                      <p className="text-xs text-gray-500">{report.reportType} - {new Date(report.reportDate).toLocaleDateString()}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowGrantModal(false);
                  setSelectedReports([]);
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const email = document.getElementById('employerEmail').value;
                  const days = parseInt(document.getElementById('validDays').value);
                  if (email && selectedReports.length > 0) {
                    grantConsent(email, selectedReports, days);
                  } else {
                    alert('Please fill all fields and select at least one report');
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Grant Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsentManagement;