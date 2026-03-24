import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [sharedWithMe, setSharedWithMe] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-reports');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [myReportsRes, sharedRes, statsRes] = await Promise.all([
        api.get('/patient/my-reports'),
        api.get('/patient/shared-with-me'),
        api.get('/patient/stats')
      ]);
      setReports(myReportsRes.data.data);
      setSharedWithMe(sharedRes.data.data);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'expired': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
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
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}!</h1>
        <p className="text-blue-100">Patient ID: {user?.patientId}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <p className="text-sm">Total Reports</p>
            <p className="text-2xl font-bold">{stats.totalReports || 0}</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <p className="text-sm">Shared Reports</p>
            <p className="text-2xl font-bold">{stats.sharedReports || 0}</p>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <p className="text-sm">Verifications</p>
            <p className="text-2xl font-bold">{stats.totalVerifications || 0}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('my-reports')}
            className={`pb-4 px-1 ${
              activeTab === 'my-reports'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Reports
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`pb-4 px-1 ${
              activeTab === 'shared'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Shared With Me
          </button>
          <button
            onClick={() => setActiveTab('consent')}
            className={`pb-4 px-1 ${
              activeTab === 'consent'
                ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Consent Management
          </button>
        </nav>
      </div>

      {/* My Reports Tab */}
      {activeTab === 'my-reports' && (
        <div>
          {reports.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No reports found.</p>
              <p className="text-sm text-gray-400 mt-2">
                Reports from labs will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <div key={report._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {report.status || 'active'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(report.reportDate).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-1">{report.reportTitle || 'Medical Report'}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Report Type: <span className="capitalize">{report.reportType}</span>
                      </p>
                      <p className="text-xs text-gray-500 font-mono mb-3">
                        Hash: {report.reportHash?.substring(0, 20)}...
                      </p>
                      <div className="flex space-x-3">
                        <Link
                          to={`/report/${report._id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Details →
                        </Link>
                        <button
                          onClick={() => {/* Handle share */}}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Share with Employer
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Lab: {report.labName || report.labId}</p>
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Blockchain Verified
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shared With Me Tab */}
      {activeTab === 'shared' && (
        <div>
          {sharedWithMe.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No reports shared with you yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Labs will share reports with you here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {sharedWithMe.map((report) => (
                <div key={report._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{report.reportTitle || 'Medical Report'}</h3>
                      <p className="text-sm text-gray-600">From Lab: {report.lab?.hospitalName || report.labId}</p>
                      <p className="text-sm text-gray-600">Type: {report.reportType}</p>
                      <p className="text-sm text-gray-600">Date: {new Date(report.reportDate).toLocaleDateString()}</p>
                    </div>
                    <Link
                      to={`/report/${report._id}`}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      View Report
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Consent Management Tab */}
      {activeTab === 'consent' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Who Can Access Your Reports</h2>
          <p className="text-gray-600 mb-6">
            Manage which employers can verify your medical reports.
          </p>
          
          {user?.consentGivenTo?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No active consents. Share reports to grant access.
            </p>
          ) : (
            <div className="space-y-4">
              {user?.consentGivenTo?.map((consent, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{consent.employerName || 'Employer'}</p>
                      <p className="text-sm text-gray-600">
                        Valid until: {new Date(consent.validUntil).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        Reports: {consent.reportIds?.length || 0} shared
                      </p>
                    </div>
                    <button
                      onClick={() => {/* Handle revoke */}}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Revoke Access
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;