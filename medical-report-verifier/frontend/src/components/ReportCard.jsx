import { Link } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-toastify";

const ReportCard = ({ report, onShare, onVerify, showActions = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sharing, setSharing] = useState(false);

  const formatHash = (hash) => {
    if (!hash) return "N/A";
    if (hash.length <= 20) return hash;
    return `${hash.substring(0, 12)}...${hash.substring(hash.length - 8)}`;
  };

  const copyToClipboard = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  const getReportTypeIcon = (type) => {
    const icons = {
      blood_test: "🩸",
      urine_test: "💧",
      xray: "🦴",
      mri: "🧠",
      ct_scan: "📊",
      ultrasound: "👶",
      ecg: "❤️",
      prescription: "📋",
      vaccination: "💉",
      covid_test: "🦠",
      physical_exam: "🏃",
      general: "📄",
    };
    return icons[type] || "📄";
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", label: "Active" },
      expired: { color: "bg-red-100 text-red-800", label: "Expired" },
      archived: { color: "bg-gray-100 text-gray-800", label: "Archived" },
      disputed: { color: "bg-yellow-100 text-yellow-800", label: "Disputed" },
    };
    const config = statusConfig[status] || statusConfig.active;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getBlockchainStatusBadge = () => {
    if (report.blockchainTxHash) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          ✓ Blockchain Verified
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Local Mode
      </span>
    );
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      if (onShare) {
        await onShare(report._id);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <article className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getReportTypeIcon(report.reportType)}</span>
            <h3 className="font-semibold text-gray-900">
              {report.reportTitle || "Medical Report"}
            </h3>
          </div>
          {getStatusBadge(report.status)}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Patient ID: {report.patientId || "N/A"}
        </p>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Report Info */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-gray-500">Report Type</p>
            <p className="font-medium capitalize">{report.reportType || "General"}</p>
          </div>
          <div>
            <p className="text-gray-500">Report Date</p>
            <p className="font-medium">
              {report.reportDate ? new Date(report.reportDate).toLocaleDateString() : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Lab ID</p>
            <p className="font-medium">{report.labId || "N/A"}</p>
          </div>
          <div>
            <p className="text-gray-500">Verifications</p>
            <p className="font-medium">{report.verifiedCount || 0} times</p>
          </div>
        </div>

        {/* Hash Section */}
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-gray-500 mb-1">Report Hash (SHA-256)</p>
          <div className="flex items-center gap-2">
            <p className="text-xs font-mono text-gray-700 break-all flex-1">
              {isExpanded ? report.reportHash : formatHash(report.reportHash)}
            </p>
            {report.reportHash && report.reportHash.length > 20 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            )}
            <button
              onClick={() => copyToClipboard(report.reportHash)}
              className="text-blue-500 hover:text-blue-700"
              title="Copy hash"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Blockchain Status */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          {getBlockchainStatusBadge()}
          <p className="text-xs text-gray-400">
            {report.createdAt ? new Date(report.createdAt).toLocaleString() : "Date unknown"}
          </p>
        </div>

        {/* Shared With Info */}
        {report.sharedWith && report.sharedWith.length > 0 && (
          <div className="border-t pt-2 mt-2">
            <p className="text-xs text-gray-500 mb-1">Shared with:</p>
            <div className="flex flex-wrap gap-1">
              {report.sharedWith.map((share, idx) => (
                <span key={idx} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                  {share.employerName || "Employer"}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="p-4 border-t bg-gray-50 flex flex-wrap gap-2">
          <Link
            to={`/report/${report._id}`}
            className="flex-1 text-center px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
          >
            View Details
          </Link>
          
          {report.fileHash && (
            <button
              onClick={() => window.open(`/verify?hash=${report.reportHash}`, "_blank")}
              className="px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm font-medium"
            >
              Verify
            </button>
          )}
          
          {onVerify && (
            <button
              onClick={() => onVerify(report._id)}
              className="px-3 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm font-medium"
            >
              Quick Verify
            </button>
          )}
          
          {onShare && (
            <button
              onClick={handleShare}
              disabled={sharing}
              className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm font-medium disabled:bg-gray-300"
            >
              {sharing ? "Sharing..." : "Share"}
            </button>
          )}
        </div>
      )}
    </article>
  );
};

export default ReportCard;