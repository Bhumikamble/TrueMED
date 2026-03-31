import React from 'react';

const VerificationResult = ({ result, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Verifying on blockchain...</p>
      </div>
    );
  }

  if (!result) return null;

  const { isValid, report, error } = result;

  // Handle error case
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-red-800 ml-3">Verification Error</h3>
        </div>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  // Handle valid report
  if (isValid && report) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-green-800 ml-3">✓ Report is AUTHENTIC!</h3>
        </div>
        
        <div className="space-y-3 mt-4">
          <div className="grid grid-cols-2 gap-2">
            <span className="font-semibold text-gray-600">Report Hash:</span>
            <span className="text-gray-800 font-mono text-sm break-all">
              {report.reportHash ? `${report.reportHash.substring(0, 20)}...` : 'N/A'}
            </span>
            
            <span className="font-semibold text-gray-600">Patient ID:</span>
            <span className="text-gray-800">{report.patientId || 'N/A'}</span>
            
            <span className="font-semibold text-gray-600">Lab/Hospital ID:</span>
            <span className="text-gray-800 font-mono text-sm">
              {report.labId ? `${report.labId.substring(0, 15)}...` : 'N/A'}
            </span>
            
            <span className="font-semibold text-gray-600">Issued At:</span>
            <span className="text-gray-800">
              {report.timestamp ? new Date(report.timestamp).toLocaleString() : 'N/A'}
            </span>
            
            <span className="font-semibold text-gray-600">Blockchain Status:</span>
            <span className="text-green-600 font-semibold">
              {report.exists ? 'Verified ✓' : 'Not Found'}
            </span>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-green-100 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>✓ Blockchain Verified</strong> - This report has been verified on the Ethereum blockchain. 
            The report hash matches the immutable record stored by the issuing lab on {report.timestamp ? new Date(report.timestamp).toLocaleDateString() : 'the blockchain'}.
          </p>
        </div>
      </div>
    );
  }

  // Handle invalid report
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-red-800 ml-3">✗ Report is INVALID!</h3>
      </div>
      
      <div className="mt-4 space-y-2">
        <p className="text-red-700">
          {report?.exists === false 
            ? "This report does not exist on the blockchain." 
            : "This report could not be found on the blockchain. The report hash may be incorrect or the report has not been issued."}
        </p>
        
        {report?.reportHash && (
          <div className="mt-3 p-3 bg-red-100 rounded">
            <p className="text-sm font-mono break-all">
              <strong>Report Hash:</strong> {report.reportHash.substring(0, 30)}...
            </p>
            {report.patientId && (
              <p className="text-sm mt-1">
                <strong>Patient ID:</strong> {report.patientId}
              </p>
            )}
            <p className="text-sm text-red-600 font-semibold mt-2">
              ⚠️ Report not found on blockchain
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationResult;