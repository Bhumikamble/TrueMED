import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const LabDashboard = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      const [reportsRes, statsRes] = await Promise.all([
        api.get(`/lab/reports?range=${timeRange}`),
        api.get('/lab/stats')
      ]);
      setReports(reportsRes.data.data);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lab Dashboard</h1>
        <p className="text-gray-600">{user?.hospitalName || user?.name}</p>
        <p className="text-sm text-gray-500">Lab ID: {user?.labId}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">Total Reports</p>
          <p className="text-3xl font-bold">{stats.totalReports || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">This Month</p>
          <p className="text-3xl font-bold">{stats.monthlyReports || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">Verifications</p>
          <p className="text-3xl font-bold">{stats.totalVerifications || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-sm">Patients Served</p>
          <p className="text-3xl font-bold">{stats.uniquePatients || 0}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          to="/upload"
          className="bg-blue-500 text-white rounded-lg p-6 text-center hover:bg-blue-600 transition"
        >
          <h3 className="text-xl font-bold mb-2">Upload New Report</h3>
          <p className="text-blue-100">Add a new medical report to the system</p>
        </Link>
        <Link
          to="/lab-reports"
          className="bg-green-500 text-white rounded-lg p-6 text-center hover:bg-green-600 transition"
        >
          <h3 className="text-xl font-bold mb-2">View All Reports</h3>
          <p className="text-green-100">Manage and track uploaded reports</p>
        </Link>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Recent Reports</h2>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border rounded px-3 py-1"
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
        <div className="divide-y">
          {reports.length === 0 ? (
            <p className="p-6 text-gray-500 text-center">No reports found.</p>
          ) : (
            reports.map((report) => (
              <div key={report._id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{report.reportTitle || 'Medical Report'}</p>
                    <p className="text-sm text-gray-600">Patient: {report.patientId}</p>
                    <p className="text-sm text-gray-500">Type: {report.reportType}</p>
                    <p className="text-xs text-gray-400 font-mono mt-1">
                      Hash: {report.reportHash?.substring(0, 20)}...
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                    <span className="inline-block mt-2 text-xs text-green-600">
                      ✓ Blockchain
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LabDashboard;