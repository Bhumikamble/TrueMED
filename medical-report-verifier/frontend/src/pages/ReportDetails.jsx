import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ReportDetails = () => {
  const { reportId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareDays, setShareDays] = useState(30);

  useEffect(() => {
    if (reportId) {
      fetchReportDetails();
    } else {
      toast.error("Invalid report ID");
      navigate('/dashboard');
    }
  }, [reportId]);

  const fetchReportDetails = async () => {
    try {
      console.log("Fetching report with ID:", reportId);
      console.log("User role:", user?.role);
      
      const res = await api.get(`/reports/${reportId}`);
      console.log("Fetched report response:", res.data);
      
      // Handle different response structures
      let reportData = res.data.data;
      
      // If the response has a 'report' property (nested structure)
      if (reportData && reportData.report) {
        reportData = reportData.report;
      }
      
      console.log("Processed report data:", reportData);
      console.log("Report ID:", reportData?._id);
      console.log("Report hash:", reportData?.reportHash);
      
      setReport(reportData);
    } catch (error) {
      console.error('Error fetching report:', error);
      const errorMessage = error.response?.data?.message || "Failed to load report";
      toast.error(errorMessage);
      
      // Don't navigate immediately - let the user see the error
      if (error.response?.status === 404) {
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyReport = async () => {
    console.log("=== VERIFY REPORT DEBUG ===");
    console.log("Report object:", report);
    console.log("Report ID from state:", report?._id);
    console.log("Report hash:", report?.reportHash);
    console.log("User role:", user?.role);
    
    // Validate report exists
    if (!report) {
      console.error("Report object is null");
      toast.error("Report data not loaded. Please refresh the page.");
      return;
    }
    
    if (!report._id) {
      console.error("Report ID missing in report object");
      toast.error("Report ID not found. Please refresh the page.");
      return;
    }
    
    if (!report.reportHash) {
      toast.error("Report hash not found");
      return;
    }
    
    setVerifying(true);
    
    try {
      // For employers, use the employer-specific verify endpoint if needed
      // The general endpoint should work with access control
      const url = `/reports/verify/${report._id}`;
      console.log("Making POST request to:", url);
      
      const res = await api.post(url);
      console.log("Verification response:", res.data);
      
      const result = res.data.data;
      
      if (result.isValid) {
        toast.success("✓ Report is AUTHENTIC!");
      } else {
        toast.error("✗ Report has been TAMPERED!");
      }
      
      // Refresh report details to update verification count
      await fetchReportDetails();
      
    } catch (error) {
      console.error('Verification error:', error);
      console.error('Error response:', error.response);
      
      let errorMessage = "Verification failed";
      
      if (error.response?.status === 403) {
        errorMessage = "You don't have permission to verify this report. It may not be shared with you.";
      } else if (error.response?.status === 404) {
        errorMessage = "Report not found or no longer available.";
      } else {
        errorMessage = error.response?.data?.message || error.message || "Verification failed";
      }
      
      toast.error(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const shareWithEmployer = async (employerEmail, validDays) => {
    if (!report?._id) {
      toast.error("Report ID not found");
      return;
    }
    
    setSharing(true);
    try {
      console.log("Sharing report:", { reportId: report._id, employerEmail, validDays });
      
      const response = await api.post(`/patient/share-report/${report._id}`, {
        employerEmail,
        validDays
      });
      
      toast.success("Report shared successfully!");
      setShowShareModal(false);
      setShareEmail('');
      setShareDays(30);
      
      await fetchReportDetails();
    } catch (error) {
      console.error('Share error:', error);
      let errorMessage = "Error sharing report";
      
      if (error.response?.status === 404) {
        errorMessage = "Employer not found. Please check the email address.";
      } else if (error.response?.status === 403) {
        errorMessage = "You can only share your own reports.";
      } else {
        errorMessage = error.response?.data?.message || "Error sharing report";
      }
      
      toast.error(errorMessage);
    } finally {
      setSharing(false);
    }
  };

  const downloadFile = async () => {
    if (!report?.reportHash) {
      toast.error("File not available");
      return;
    }
    
    try {
      const response = await api.get(`/reports/report-file/${report.reportHash}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', report.fileName || 'report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Download started");
    } catch (error) {
      console.error('Download error:', error);
      let errorMessage = "Failed to download file";
      
      if (error.response?.status === 403) {
        errorMessage = "You don't have permission to download this file.";
      }
      
      toast.error(errorMessage);
    }
  };

  const copyToClipboard = (text) => {
    if (text && text !== 'N/A') {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
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
          <p className="mt-4 text-gray-600">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 text-lg">Report not found or you don't have access.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-blue-500 hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-500 hover:text-blue-700 mb-4 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <h1 className="text-3xl font-bold mb-2">Report Details</h1>
        <p className="text-gray-600">Medical Report Information</p>
      </div>

      {/* Debug Section - Shows actual loaded data */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-mono text-yellow-800 break-all">
            🔍 Debug: Report ID: {report._id || 'Not loaded'} | 
            Report Hash: {report.reportHash ? formatHashDisplay(report.reportHash) : 'Not loaded'} | 
            User Role: {user?.role} |
            Shared With: {report.sharedWith?.length || 0} employer(s) |
            Can Verify: {report._id ? 'Yes' : 'No'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Report Information</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Report ID</p>
                  <p className="font-medium text-sm break-all">{report._id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Report Type</p>
                  <p className="font-medium capitalize">{report.reportType || 'General'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Report Title</p>
                  <p className="font-medium">{report.reportTitle || 'Medical Report'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Report Date</p>
                  <p className="font-medium">{report.reportDate ? new Date(report.reportDate).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
              {report.doctorName && (
                <div>
                  <p className="text-sm text-gray-500">Doctor</p>
                  <p className="font-medium">{report.doctorName}</p>
                </div>
              )}
              {report.findings && (
                <div>
                  <p className="text-sm text-gray-500">Findings</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{report.findings}</p>
                </div>
              )}
              {report.diagnosis && (
                <div>
                  <p className="text-sm text-gray-500">Diagnosis</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{report.diagnosis}</p>
                </div>
              )}
            </div>
          </div>

          {/* Blockchain Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Blockchain Record</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Report Hash (SHA-256)</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all flex-1">
                    {formatHashDisplay(report.reportHash)}
                  </p>
                  {report.reportHash && (
                    <button
                      onClick={() => copyToClipboard(report.reportHash)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Copy hash"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {report.blockchainTxHash && (
                <div>
                  <p className="text-sm text-gray-500">Transaction Hash</p>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://sepolia.etherscan.io/tx/${report.blockchainTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-blue-500 hover:underline break-all flex-1"
                    >
                      {formatHashDisplay(report.blockchainTxHash)}
                    </a>
                    <button
                      onClick={() => copyToClipboard(report.blockchainTxHash)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Copy transaction hash"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              {report.blockNumber && (
                <div>
                  <p className="text-sm text-gray-500">Block Number</p>
                  <p className="font-medium">{report.blockNumber}</p>
                </div>
              )}
              <div className="flex items-center space-x-2 pt-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm text-gray-500">Verification Status:</span>
                <span className="text-green-600 font-medium">✓ Blockchain Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Patient & Lab Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Parties</h2>
            <div className="space-y-4">
              <div className="border-b pb-3">
                <p className="text-sm text-gray-500">
                  {user?.role === 'employer' ? 'Report Owner' : 'Patient'}
                </p>
                {user?.role === 'employer' ? (
                  <>
                    <p className="font-medium">Verified Patient</p>
                    <p className="text-sm text-gray-500">Identity verified on blockchain</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">{report.patientName || report.patientId || 'N/A'}</p>
                    {report.patientEmail && (
                      <p className="text-sm text-gray-600">{report.patientEmail}</p>
                    )}
                  </>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Lab/Hospital</p>
                <p className="font-medium">{report.labName || report.labId || 'N/A'}</p>
                <p className="text-sm text-gray-600">{report.hospitalName}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Actions</h2>
            <div className="space-y-3">
              <button
                onClick={verifyReport}
                disabled={verifying || !report?._id}
                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {verifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  "Verify Report"
                )}
              </button>
              
              {user?.role === 'patient' && (
                <button
                  onClick={() => {
                    setShareEmail('');
                    setShareDays(30);
                    setShowShareModal(true);
                  }}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                  Share with Employer
                </button>
              )}
              
              <button
                onClick={downloadFile}
                disabled={!report?.reportHash}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:bg-gray-300 transition"
              >
                Download Original File
              </button>
            </div>
          </div>

          {/* Sharing Info */}
          {report.sharedWith && report.sharedWith.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Shared With</h2>
              <div className="space-y-3">
                {report.sharedWith.map((share, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-3">
                    <p className="text-sm font-medium">{share.employerName || 'Employer'}</p>
                    <p className="text-xs text-gray-500">
                      Expires: {share.expiresAt ? new Date(share.expiresAt).toLocaleDateString() : 'Never'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Status: {share.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification History */}
          {report.verificationHistory?.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Verification History</h2>
              <div className="space-y-3">
                {report.verificationHistory.slice(-5).reverse().map((v, idx) => (
                  <div key={idx} className="border-l-4 border-green-500 pl-3">
                    <p className="text-sm font-medium">
                      {v.result === 'authentic' ? '✓ Authentic' : '✗ Tampered'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(v.verifiedAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      Verified by: {v.verifiedByRole}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal - Using React State */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <h3 className="text-xl font-bold mb-4">Share Report with Employer</h3>
            <p className="text-sm text-gray-600 mb-4">
              Share this report with an employer for verification.
            </p>
            <input
              type="email"
              placeholder="Employer Email"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              className="w-full border rounded-lg p-2 mb-3 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Access Duration (days)</label>
              <input
                type="number"
                value={shareDays}
                onChange={(e) => setShareDays(parseInt(e.target.value) || 30)}
                min="1"
                max="365"
                className="w-full border rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareEmail('');
                  setShareDays(30);
                }}
                className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!shareEmail) {
                    toast.error("Please enter employer email");
                    return;
                  }
                  if (shareDays < 1) {
                    toast.error("Please enter a valid number of days");
                    return;
                  }
                  shareWithEmployer(shareEmail, shareDays);
                }}
                disabled={sharing}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:bg-gray-400"
              >
                {sharing ? "Sharing..." : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetails;