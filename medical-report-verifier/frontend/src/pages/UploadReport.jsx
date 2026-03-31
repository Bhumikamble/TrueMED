import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { uploadReportApi, uploadReportWithQRApi } from "../services/reportService";

const UploadReport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [reportFile, setReportFile] = useState(null);
  const [reportType, setReportType] = useState("general");
  const [reportTitle, setReportTitle] = useState("");
  const [findings, setFindings] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [result, setResult] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generateQR, setGenerateQR] = useState(true);

  const validateAndSetFile = (selectedFile) => {
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return false;
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error("File type not supported. Please upload PDF, JPG, PNG, TXT, or DOC files.");
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
    setQrCode(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const downloadQR = () => {
    if (qrCode) {
      const link = document.createElement('a');
      link.download = `qr-report-${result?.reportHash?.substring(0, 10) || 'report'}.png`;
      link.href = qrCode;
      link.click();
      toast.success("QR code downloaded!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reportFile) {
      toast.error("Please select a file to upload");
      return;
    }
    
    if (!patientId && !patientEmail) {
      toast.error("Please provide either Patient ID or Patient Email");
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setQrCode(null);
    
    const formData = new FormData();
    formData.append("reportFile", reportFile);
    formData.append("patientId", patientId);
    if (patientName) formData.append("patientName", patientName);
    if (patientEmail) formData.append("patientEmail", patientEmail);
    formData.append("reportType", reportType);
    formData.append("reportTitle", reportTitle || `Medical Report - ${new Date().toLocaleDateString()}`);
    if (findings) formData.append("findings", findings);
    if (diagnosis) formData.append("diagnosis", diagnosis);
    if (doctorName) formData.append("doctorName", doctorName);
    if (reportDate) formData.append("reportDate", reportDate);
    formData.append("generateQR", generateQR);

    try {
      let response;
      if (generateQR) {
        // Use the QR-enabled upload endpoint
        response = await uploadReportWithQRApi(formData, (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        });
        
        if (response.data.success) {
          setQrCode(response.data.qrCode);
          toast.success("Report uploaded with QR code!");
        }
      } else {
        // Use traditional upload
        response = await uploadReportApi(formData, (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        });
        toast.success("Report uploaded and anchored on blockchain successfully!");
      }
      
      setResult(response.data);
      
      // Reset form after successful upload
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const reportTypes = [
    { value: "general", label: "General Report" },
    { value: "blood_test", label: "Blood Test" },
    { value: "urine_test", label: "Urine Test" },
    { value: "xray", label: "X-Ray" },
    { value: "mri", label: "MRI" },
    { value: "ct_scan", label: "CT Scan" },
    { value: "ultrasound", label: "Ultrasound" },
    { value: "ecg", label: "ECG" },
    { value: "prescription", label: "Prescription" },
    { value: "vaccination", label: "Vaccination Record" },
    { value: "covid_test", label: "COVID-19 Test" },
    { value: "physical_exam", label: "Physical Examination" },
    { value: "pathology", label: "Pathology Report" },
    { value: "radiology", label: "Radiology Report" },
  ];

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Medical Report</h1>
        <p className="text-gray-600">
          Upload a medical report. It will be hashed using SHA-256 and anchored on the blockchain for tamper-proof verification.
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
          <span>Lab: {user?.hospitalName || user?.name}</span>
          <span className="mx-1">•</span>
          <span>Blockchain: Sepolia Testnet</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* QR Code Toggle */}
        <div className="bg-white rounded-lg shadow p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={generateQR}
              onChange={(e) => setGenerateQR(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium">Generate QR Code for this report</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            When enabled, a QR code will be generated that can be scanned to instantly verify the report's authenticity.
          </p>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Report File *</h2>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
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

        {/* Patient Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Patient ID *</label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., PAT001"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Patient Name</label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Full name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Patient Email</label>
              <input
                type="email"
                className="w-full border rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="patient@email.com"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Report Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Report Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Report Type *</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full border rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {reportTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Report Title</label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Annual Physical Examination"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Doctor Name</label>
              <input
                type="text"
                className="w-full border rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Attending Physician"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Report Date</label>
              <input
                type="date"
                className="w-full border rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            {showAdvanced ? "▼" : "▶"} Advanced Medical Details
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Findings</label>
                <textarea
                  rows="3"
                  className="w-full border rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Clinical findings and observations"
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Diagnosis</label>
                <textarea
                  rows="2"
                  className="w-full border rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Diagnosis and conclusions"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {loading && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Uploading to Blockchain...</span>
              <span className="text-sm text-gray-500">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading... {uploadProgress}%
            </>
          ) : (
            generateQR ? "Upload & Generate QR Code" : "Upload & Anchor on Blockchain"
          )}
        </button>
      </form>

      {/* QR Code Result Display */}
      {qrCode && (
        <div className="mt-8 bg-white rounded-lg shadow p-6 border-2 border-green-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🎨</span>
            <h2 className="text-xl font-semibold text-green-800">QR Code Generated!</h2>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="bg-white p-4 rounded-lg shadow">
              <img src={qrCode} alt="QR Code" className="w-48 h-48" />
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-sm text-gray-600">
                Scan this QR code with any mobile device to instantly verify the report's authenticity.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={downloadQR}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm"
                >
                  📥 Download QR Code
                </button>
                <button
                  onClick={() => window.open(`/verify-qr?hash=${result?.reportHash || result?.data?.report?.reportHash}`, '_blank')}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
                >
                  🔍 Test Verification
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-500 font-mono break-all">
              <strong>Report Hash:</strong> {result?.reportHash || result?.data?.report?.reportHash}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <strong>Verification URL:</strong> {`${window.location.origin}/verify-qr?hash=${result?.reportHash || result?.data?.report?.reportHash}`}
            </p>
          </div>
        </div>
      )}

      {/* Traditional Result Display */}
      {result && !qrCode && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">Upload Result ✓</h2>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-600">Report Hash</p>
              <p className="text-sm font-mono break-all bg-white p-2 rounded">{result?.data?.report?.reportHash || result?.report?.reportHash}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Transaction Hash</p>
              <p className="text-sm font-mono break-all bg-white p-2 rounded">{result?.data?.chainResult?.txHash || result?.chainResult?.txHash}</p>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
              <p className="text-sm text-green-700 font-medium">Stored in Database: Yes</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
              <p className="text-sm text-blue-700 font-medium">Anchored on Blockchain: Yes</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadReport;