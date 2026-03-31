import React, { useState, useRef } from 'react';
import QrScanner from 'qr-scanner';

const QRScanner = ({ onScanSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Extract hash from QR text
  const extractHashFromText = (text) => {
    console.log("📱 QR raw text:", text);
    
    try {
      // Try to parse as JSON
      const data = JSON.parse(text);
      let hash = data.reportHash || data.hash || data.documentHash;
      if (hash && !hash.startsWith('0x') && /^[0-9a-fA-F]{64}$/.test(hash)) {
        hash = '0x' + hash;
      }
      return hash;
    } catch (e) {
      // Not JSON, treat as plain text
      if (text.startsWith('0x')) return text;
      if (/^[0-9a-fA-F]{64}$/.test(text)) return '0x' + text;
      // Try to find hex pattern in text
      const hexMatch = text.match(/[0-9a-fA-F]{64}/);
      if (hexMatch) return '0x' + hexMatch[0];
      return null;
    }
  };

  // Handle file upload with qr-scanner
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    setScanning(true);
    setError(null);
    
    try {
      // qr-scanner is more reliable than html5-qrcode
      const decodedText = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true
      });
      
      console.log("✅ QR detected successfully:", decodedText);
      
      let qrText = decodedText;
      if (typeof decodedText === 'object' && decodedText.data) {
        qrText = decodedText.data;
      }
      
      const reportHash = extractHashFromText(qrText);
      
      if (reportHash) {
        console.log("✅ Extracted report hash:", reportHash);
        onScanSuccess({ 
          reportHash: reportHash,
          rawData: qrText
        });
        setSelectedFile(null);
      } else {
        setError('QR code does not contain a valid report hash');
      }
      
    } catch (err) {
      console.error("QR scan error:", err);
      setError('Failed to read QR code. Make sure the image is clear and try again.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* File Upload Option */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current.click()}
          disabled={scanning}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition transform hover:scale-105 disabled:opacity-50"
        >
          {scanning ? '🔍 Scanning...' : '📁 Upload QR Code Image'}
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Upload a clear QR code image (PNG, JPG) to verify
        </p>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">OR</span>
        </div>
      </div>
      
      {/* Manual Entry Hint */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <p className="text-sm text-yellow-800">
          💡 <strong>QR Scanner Not Working?</strong><br />
          Switch to <strong>Manual Entry</strong> tab and paste your report hash directly.
        </p>
      </div>
      
      {/* Display selected file info */}
      {selectedFile && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-blue-800 font-medium">Selected: {selectedFile.name}</p>
          </div>
          {scanning && (
            <p className="text-blue-600 text-xs mt-1 ml-7">🔍 Scanning QR code...</p>
          )}
        </div>
      )}
    </div>
  );
};

export default QRScanner;