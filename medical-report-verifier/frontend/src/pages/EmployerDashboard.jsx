import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const EmployerDashboard = () => {
  const { user } = useAuth();
  const [sharedReports, setSharedReports] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestHash, setRequestHash] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sharedRes, requestsRes, statsRes] = await Promise.all([
        api.get('/employer/shared-reports').catch(err => ({ data: { data: [] } })),
        api.get('/employer/pending-requests').catch(err => ({ data: { data: [] } })),
        api.get('/employer/stats').catch(err => ({ data: { data: {} } }))
      ]);
      
      setSharedReports(sharedRes.data.data || []);
      setPendingRequests(requestsRes.data.data || []);
      setStats(statsRes.data.data || {});
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const verifyReport = async (reportId) => {
    setVerifying(reportId);
    try {
      const res = await api.post(`/employer/verify-report/${reportId}`);
      
      if (res.data.data.isValid) {
        toast.success("✓ Report is AUTHENTIC!");
      } else {
        toast.error("✗ Report has been TAMPERED!");
      }
      
      // Refresh data to update verification count
      fetchData();
    } catch (error) {
      console.error('Verification error:', error);
      const errorMessage = error.response?.data?.message || "Verification failed";
      toast.error(errorMessage);
    } finally {
      setVerifying(null);
    }
  };

  const requestAccess = async () => {
    if (!requestHash.trim()) {
      toast.error("Please enter a report hash");
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post('/employer/request-access', {
        reportHash: requestHash,
        message: requestMessage
      });
      
      toast.success("Access request sent to patient!");
      setShowRequestModal(false);
      setRequestHash('');
      setRequestMessage('');
      
      // Refresh pending requests
      fetchData();
    } catch (error) {
      console.error('Request error:', error);
      const errorMessage = error.response?.data?.message || "Error sending request";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const formatHashDisplay = (hash) => {
    if (!hash) return 'N/A';
    if (hash.length <= 20) return hash;
    return `${hash.substring(0, 12)}...${hash.substring(hash.length - 8)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Employer Dashboard</h1>
        <p className="text-gray-600">
          {user?.companyName || user?.name}
          {user?.department && ` - ${user.department}`}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Employer ID: {user?.employerId || 'N/A'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
          <p className="text-gray-500 text-sm">Active Reports</p>
          <p className="text-3xl font-bold text-blue-600">{stats.activeReports || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Reports shared with you</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
          <p className="text-gray-500 text-sm">Verifications</p>
          <p className="text-3xl font-bold text-green-600">{stats.verifications || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Total verifications performed</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
          <p className="text-gray-500 text-sm">Pending Requests</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingRequests || 0}</p>
          <p className="text-xs text-gray-400 mt-1">Awaiting patient approval</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Request Report Access
          </button>
          <Link
            to="/verify"
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Verify Report by File
          </Link>
        </div>
      </div>

      {/* Shared Reports */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Reports Shared With You</h2>
          <span className="text-sm text-gray-500">{sharedReports.length} reports</span>
        </div>
        <div className="divide-y">
          {sharedReports.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-lg mb-2">No reports shared with you yet</p>
              <p className="text-gray-400 text-sm mb-4">
                When patients share reports with you, they'll appear here
              </p>
              <button
                onClick={() => setShowRequestModal(true)}
                className="text-blue-500 hover:text-blue-700 font-medium"
              >
                Request access to a report →
              </button>
            </div>
          ) : (
            sharedReports.map((report) => (
              <div key={report._id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2 flex-wrap gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        Patient: {report.patient?.name || report.patientId}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {report.reportType}
                      </span>
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        ✓ Shared
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Lab: {report.labName || report.lab?.hospitalName || report.labId}
                    </p>
                    <p className="text-sm text-gray-500">
                      Date: {new Date(report.reportDate).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-gray-400 font-mono">
                        Hash: {formatHashDisplay(report.reportHash)}
                      </p>
                      <button
                        onClick={() => copyToClipboard(report.reportHash)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Copy full hash"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Access expires: {report.sharedWith[0]?.expiresAt 
                        ? new Date(report.sharedWith[0].expiresAt).toLocaleDateString() 
                        : 'Never'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Verified {report.verifiedCount || 0} times
                    </p>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => verifyReport(report._id)}
                      disabled={verifying === report._id}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 transition flex items-center gap-2"
                    >
                      {verifying === report._id ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Verifying...
                        </>
                      ) : (
                        "Verify Report"
                      )}
                    </button>
                    <Link
                      to={`/report/${report._id}`}
                      className="block mt-2 text-blue-500 hover:text-blue-700 text-sm"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Pending Access Requests</h2>
            <p className="text-sm text-gray-500 mt-1">Awaiting patient response</p>
          </div>
          <div className="divide-y">
            {pendingRequests.map((request) => (
              <div key={request._id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Report: {formatHashDisplay(request.reportHash)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Patient: {request.patientName || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Requested: {new Date(request.requestedAt).toLocaleString()}
                    </p>
                    {request.message && (
                      <p className="text-sm text-gray-500 mt-2 italic">
                        "{request.message}"
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                      Pending
                    </span>
                    <button
                      onClick={() => {
                        setRequestHash(request.reportHash);
                        setShowRequestModal(true);
                      }}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                    >
                      Resend Request
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Access Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Request Report Access</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the report hash to request access from the patient. The patient will be notified and can grant you access.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Hash <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={requestHash}
                onChange={(e) => setRequestHash(e.target.value)}
                placeholder="Enter the 64-character SHA-256 hash"
                className="w-full border rounded-lg p-2 font-mono text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                The hash is displayed on the report details page
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message (Optional)
              </label>
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Add a note to the patient explaining why you need access..."
                rows="3"
                className="w-full border rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setRequestHash('');
                  setRequestMessage('');
                }}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={requestAccess}
                disabled={submitting}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  "Send Request"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;