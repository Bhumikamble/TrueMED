import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SharedReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState(user?.role === 'employer' ? 'employer' : 'patient');

  useEffect(() => {
    fetchSharedReports();
  }, [type]);

  const fetchSharedReports = async () => {
    try {
      let endpoint;
      if (type === 'employer') {
        endpoint = '/employer/shared-reports';
      } else {
        endpoint = '/patient/shared-with-me';
      }
      const res = await api.get(endpoint);
      setReports(res.data.data);
    } catch (error) {
      console.error('Error fetching shared reports:', error);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Shared Reports</h1>
        <p className="text-gray-600">
          {type === 'employer' 
            ? 'Reports that patients have shared with your organization'
            : 'Reports that labs have shared with you'}
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No shared reports found.</p>
          {type === 'employer' && (
            <button
              onClick={() => {/* Handle request access */}}
              className="mt-4 text-blue-500 hover:underline"
            >
              Request access to a report →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report) => (
            <div key={report._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-semibold text-gray-600">
                    {type === 'employer' ? `Patient: ${report.patient?.name || report.patientId}` : `Lab: ${report.lab?.hospitalName || report.labId}`}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(report.reportDate).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold mb-2">{report.reportTitle || 'Medical Report'}</h3>
                <p className="text-sm text-gray-600 mb-2">Type: {report.reportType}</p>
                
                <div className="bg-gray-50 rounded p-2 mb-4">
                  <p className="text-xs font-mono text-gray-600 truncate">
                    Hash: {report.reportHash}
                  </p>
                </div>
                
                <div className="flex justify-between items-center">
                  <Link
                    to={`/report/${report._id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                  {type === 'employer' && (
                    <button
                      onClick={() => {/* Handle verify */}}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                    >
                      Verify
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SharedReports;