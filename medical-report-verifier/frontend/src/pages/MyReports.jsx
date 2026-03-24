import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const MyReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.get('/patient/my-reports');
      setReports(res.data.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    if (filter !== 'all' && report.status !== filter) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return report.reportHash?.toLowerCase().includes(searchLower) ||
             report.patientId?.toLowerCase().includes(searchLower) ||
             report.reportType?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const getStatusBadge = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      archived: 'bg-gray-100 text-gray-800',
      disputed: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
        <h1 className="text-3xl font-bold mb-4">My Medical Reports</h1>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded ${filter === 'active' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2 rounded ${filter === 'expired' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Expired
            </button>
          </div>
          
          <input
            type="text"
            placeholder="Search by hash, patient ID, or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border rounded px-4 py-2"
          />
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No reports found.</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div key={report._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(report.status)}`}>
                        {report.status || 'active'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(report.reportDate).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold">{report.reportTitle || 'Medical Report'}</h3>
                    <p className="text-sm text-gray-600">Type: {report.reportType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Lab: {report.labName || report.labId}</p>
                    <p className="text-xs text-green-600 mt-1">✓ Blockchain Verified</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded p-3 mb-4">
                  <p className="text-xs font-mono text-gray-600 break-all">
                    Hash: {report.reportHash}
                  </p>
                  {report.blockchainTxHash && (
                    <p className="text-xs font-mono text-gray-500 mt-1 break-all">
                      Tx: {report.blockchainTxHash}
                    </p>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex space-x-3">
                    <Link
                      to={`/report/${report._id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Full Report →
                    </Link>
                    <button
                      onClick={() => {/* Handle share */}}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      Share with Employer
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Uploaded: {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyReports;