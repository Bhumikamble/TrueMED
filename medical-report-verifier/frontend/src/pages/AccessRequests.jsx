import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const AccessRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/employer/access-requests');
      setRequests(res.data.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async (reportHash, message) => {
    try {
      await api.post('/employer/request-access', { reportHash, message });
      alert('Access request submitted successfully!');
      setShowRequestModal(false);
      fetchRequests();
    } catch (error) {
      alert('Error: ' + error.response?.data?.message);
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
          <h1 className="text-3xl font-bold mb-2">Access Requests</h1>
          <p className="text-gray-600">
            Track and manage your requests to access patient reports
          </p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
        >
          New Request
        </button>
      </div>

      {/* Pending Requests */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Pending Requests</h2>
        </div>
        <div className="divide-y">
          {requests.filter(r => r.status === 'pending').length === 0 ? (
            <p className="p-6 text-gray-500 text-center">No pending requests.</p>
          ) : (
            requests.filter(r => r.status === 'pending').map((request) => (
              <div key={request._id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Report: {request.reportHash?.substring(0, 30)}...</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Requested: {new Date(request.requestedAt).toLocaleString()}
                    </p>
                    {request.message && (
                      <p className="text-sm text-gray-500 mt-1">Message: {request.message}</p>
                    )}
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                    Pending
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Approved Requests */}
      {requests.filter(r => r.status === 'approved').length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">Approved Access</h2>
          </div>
          <div className="divide-y">
            {requests.filter(r => r.status === 'approved').map((request) => (
              <div key={request._id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Report: {request.reportHash?.substring(0, 30)}...</p>
                    <p className="text-sm text-gray-600">
                      Approved: {new Date(request.approvedAt).toLocaleString()}
                    </p>
                    {request.expiresAt && (
                      <p className="text-sm text-gray-500">
                        Valid until: {new Date(request.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => window.location.href = `/verify?hash=${request.reportHash}`}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
                  >
                    Verify Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <h3 className="text-xl font-bold mb-4">Request Report Access</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter the report hash to request access from the patient.
            </p>
            <input
              type="text"
              id="reportHash"
              placeholder="Report Hash (0x...)"
              className="w-full border rounded p-2 mb-3 font-mono text-sm"
            />
            <textarea
              id="message"
              placeholder="Optional: Add a message for the patient (why you need access)"
              className="w-full border rounded p-2 mb-4 text-sm"
              rows="3"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const hash = document.getElementById('reportHash').value;
                  const message = document.getElementById('message').value;
                  if (hash) submitRequest(hash, message);
                  else alert('Please enter a report hash');
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessRequests;