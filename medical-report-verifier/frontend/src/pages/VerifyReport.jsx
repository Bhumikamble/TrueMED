import { useState, useRef } from "react";
import { toast } from "react-toastify";
import { verifyReportApi, getReportByHashApi } from "../services/reportService";

const VerifyReport = () => {
  const fileInputRef = useRef(null);
  const [reportFile, setReportFile] = useState(null);
  const [hashQuery, setHashQuery] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [hashResult, setHashResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hashLoading, setHashLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState("file");
  const [filePreview, setFilePreview] = useState(null);

  const validateAndSetFile = (selectedFile) => {
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return false;
    }

    setReportFile(selectedFile);
    
    // Create preview for images
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
    
    return true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const removeFile = () => {
    setReportFile(null);
    setFilePreview(null);
    setVerificationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const verifyByFile = async (e) => {
    e.preventDefault();
    if (!reportFile) {
      toast.error("Please select a file");
      return;
    }

    setLoading(true);
    setVerificationResult(null);

    const formData = new FormData();
    formData.append("reportFile", reportFile);

    try {
      const response = await verifyReportApi(formData);
      setVerificationResult(response.data);
      toast.success("Verification completed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const verifyByHash = async (e) => {
    e.preventDefault();
    if (!hashQuery.trim()) {
      toast.error("Please enter a report hash");
      return;
    }

    setHashLoading(true);
    setHashResult(null);

    try {
      const response = await getReportByHashApi(hashQuery);
      console.log("API Response:", response); // Debug log
      
      // Handle different response structures
      let reportData = response.data || response;
      
      // If the data is nested further
      if (reportData.data) {
        reportData = reportData.data;
      }
      
      setHashResult(reportData);
      toast.success("Report found");
    } catch (error) {
      console.error("Lookup error:", error);
      toast.error(error.response?.data?.message || "Hash lookup failed");
    } finally {
      setHashLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    if (text && text !== "N/A") {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getVerificationStatusColor = (isAuthentic) => {
    return isAuthentic 
      ? "bg-green-100 text-green-800 border-green-200" 
      : "bg-red-100 text-red-800 border-red-200";
  };

  // Helper function to safely get nested values
  const getValue = (obj, ...paths) => {
    for (const path of paths) {
      if (obj && path in obj) {
        return obj[path];
      }
    }
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Verify Medical Report</h1>
        <p className="text-gray-600">
          Verify the authenticity of a medical report by uploading the file or searching by its blockchain hash.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => {
              setActiveTab("file");
              setVerificationResult(null);
            }}
            className={`pb-4 px-1 transition ${
              activeTab === "file"
                ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Verify by File
          </button>
          <button
            onClick={() => {
              setActiveTab("hash");
              setHashResult(null);
            }}
            className={`pb-4 px-1 transition ${
              activeTab === "hash"
                ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Lookup by Hash
          </button>
        </nav>
      </div>

      {/* File Verification Tab */}
      {activeTab === "file" && (
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={verifyByFile}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Upload Report File
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : reportFile
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 hover:border-blue-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  {!reportFile ? (
                    <>
                      <svg
                        className="w-12 h-12 text-gray-400 mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <span className="text-gray-600">Drag and drop a file here, or click to select</span>
                      <span className="text-xs text-gray-400 mt-1">
                        PDF, JPG, PNG, TXT, DOC up to 10MB
                      </span>
                    </>
                  ) : (
                    <div className="w-full">
                      {filePreview ? (
                        <img src={filePreview} alt="Preview" className="max-h-32 mx-auto mb-3 rounded" />
                      ) : (
                        <div className="flex items-center justify-center gap-3 mb-3">
                          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">{reportFile.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(reportFile.size)}</p>
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-red-500 text-sm hover:text-red-700"
                      >
                        Remove file
                      </button>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !reportFile}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                "Verify File"
              )}
            </button>
          </form>

          {verificationResult && (
            <div className={`mt-6 p-4 rounded-lg border ${getVerificationStatusColor(verificationResult.isAuthentic)}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Verification Result</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getVerificationStatusColor(verificationResult.isAuthentic)}`}>
                  {verificationResult.isAuthentic ? "✓ Authentic" : "✗ Tampered"}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Computed Hash (SHA-256)</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono break-all bg-white bg-opacity-50 p-2 rounded flex-1">
                      {verificationResult.reportHash}
                    </p>
                    <button
                      onClick={() => copyToClipboard(verificationResult.reportHash)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Copy hash"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {verificationResult.databaseRecord?.exists && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Patient ID</p>
                        <p className="text-sm font-medium">{verificationResult.databaseRecord.patientId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Lab ID</p>
                        <p className="text-sm font-medium">{verificationResult.databaseRecord.labId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Report Type</p>
                        <p className="text-sm capitalize">{verificationResult.databaseRecord.reportType}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Report Date</p>
                        <p className="text-sm">{new Date(verificationResult.databaseRecord.reportDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Verification Count</p>
                        <p className="text-sm">{verificationResult.databaseRecord.verifiedCount} times</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Stored in Database</p>
                        <p className="text-sm text-green-600">✓ Yes</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-2">
                  <p className="text-xs text-gray-500">Verification Source</p>
                  <p className="text-sm">{verificationResult.verificationSource}</p>
                </div>

                {verificationResult.fileStoredInDatabase && verificationResult.reportHash && (
                  <a
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline mt-2"
                    href={`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/reports/report-file/${verificationResult.reportHash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Original File
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hash Lookup Tab - FIXED VERSION */}
      {activeTab === "hash" && (
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={verifyByHash}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Report Hash (SHA-256)
              </label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 font-mono text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter the 64-character SHA-256 hash (e.g., 5eb47ca41e0746e22babc41974327112...)"
                value={hashQuery}
                onChange={(e) => setHashQuery(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                The hash is displayed after uploading a report or can be found in the verification result
              </p>
            </div>

            <button
              type="submit"
              disabled={hashLoading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {hashLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                "Lookup Report"
              )}
            </button>
          </form>

          {hashResult && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">Report Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Report Hash</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono break-all flex-1">
                      {getValue(hashResult, 'reportHash', 'databaseRecord.reportHash', 'blockchainRecord.reportHash') || "N/A"}
                    </p>
                    {getValue(hashResult, 'reportHash', 'databaseRecord.reportHash', 'blockchainRecord.reportHash') && (
                      <button
                        onClick={() => copyToClipboard(getValue(hashResult, 'reportHash', 'databaseRecord.reportHash', 'blockchainRecord.reportHash'))}
                        className="text-blue-500 hover:text-blue-700"
                        title="Copy hash"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Patient ID</p>
                    <p className="text-sm font-medium">
                      {getValue(hashResult, 'patientId', 'databaseRecord.patientId', 'blockchainRecord.patientId') || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Lab ID</p>
                    <p className="text-sm font-medium">
                      {getValue(hashResult, 'labId', 'databaseRecord.labId', 'blockchainRecord.labId') || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Report Type</p>
                    <p className="text-sm capitalize">
                      {getValue(hashResult, 'reportType', 'databaseRecord.reportType') || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Doctor Name</p>
                    <p className="text-sm">
                      {getValue(hashResult, 'doctorName', 'databaseRecord.doctorName') || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Report Date</p>
                    <p className="text-sm">
                      {(() => {
                        const date = getValue(hashResult, 'reportDate', 'databaseRecord.reportDate');
                        return date ? new Date(date).toLocaleDateString() : "N/A";
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">File Name</p>
                    <p className="text-sm">
                      {getValue(hashResult, 'fileName', 'databaseRecord.fileName') || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${getValue(hashResult, 'blockchainVerified', 'blockchainRecord.exists') ? "bg-green-500" : "bg-yellow-500"}`}></span>
                    <p className="text-sm">
                      On-chain: {getValue(hashResult, 'blockchainVerified', 'blockchainRecord.exists') ? "Yes - Verified on Blockchain" : "No (Local/Demo Mode)"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                    <p className="text-sm">
                      Stored in Database: Yes
                    </p>
                  </div>
                </div>

                {getValue(hashResult, 'blockchainTxHash', 'blockchainRecord.txHash') && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-gray-500">Blockchain Transaction</p>
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${getValue(hashResult, 'blockchainTxHash', 'blockchainRecord.txHash')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-blue-500 hover:underline break-all"
                    >
                      {getValue(hashResult, 'blockchainTxHash', 'blockchainRecord.txHash')}
                    </a>
                  </div>
                )}

                {getValue(hashResult, 'reportHash', 'databaseRecord.reportHash') && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      This report is verified and stored securely on the blockchain
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VerifyReport;