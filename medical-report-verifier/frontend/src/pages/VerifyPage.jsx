import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import QRScanner from '../components/QRScanner';
import VerificationResult from '../components/VerificationResult';
import axios from 'axios';

const VerifyPage = () => {
  const [searchParams] = useSearchParams();
  const { hash } = useParams();
  const [reportHash, setReportHash] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualHash, setManualHash] = useState('');
  const [scanMode, setScanMode] = useState('manual');

  useEffect(() => {
    const urlHash = searchParams.get('hash') || hash;
    if (urlHash && urlHash.startsWith('0x')) {
      setReportHash(urlHash);
      verifyReport(urlHash);
    }
  }, [searchParams, hash]);

  const verifyReport = async (hashToVerify) => {
    if (!hashToVerify || !hashToVerify.startsWith('0x')) {
      alert('Please enter a valid report hash (starts with 0x)');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/qr/verify/${hashToVerify}`);
      setResult(response.data);
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        success: false,
        isValid: false,
        error: error.response?.data?.error || 'Failed to verify on blockchain'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    verifyReport(manualHash);
  };

  const handleQRScan = (qrData) => {
    console.log('QR Scanned:', qrData);
    if (qrData.reportHash) {
      setReportHash(qrData.reportHash);
      verifyReport(qrData.reportHash);
    } else {
      alert('Invalid QR code - missing report hash');
    }
    setScanMode('manual');
  };

  // Helper to validate hash length
  const isValidHashLength = (hash) => {
    if (!hash) return false;
    const hashWithoutPrefix = hash.startsWith('0x') ? hash.slice(2) : hash;
    return hashWithoutPrefix.length === 64;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 MediVerify - Report Verification
          </h1>
          <p className="text-gray-600">
            Scan QR code or enter report hash to verify medical report authenticity
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-2 px-4 font-medium ${
              scanMode === 'manual'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setScanMode('manual')}
          >
            Manual Entry
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              scanMode === 'qr'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setScanMode('qr')}
          >
            Scan QR Code
          </button>
        </div>

        {/* Manual Entry Form */}
        {scanMode === 'manual' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <form onSubmit={handleManualSubmit}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Hash
              </label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualHash}
                    onChange={(e) => setManualHash(e.target.value)}
                    placeholder="0x..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    // No maxLength - allows full 66-character hash
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Verify
                  </button>
                </div>
                {manualHash && !isValidHashLength(manualHash) && (
                  <p className="text-xs text-red-500 mt-1">
                    ⚠️ Hash should be 66 characters total (0x + 64 hex characters). Current length: {manualHash.length}
                  </p>
                )}
                {manualHash && isValidHashLength(manualHash) && (
                  <p className="text-xs text-green-500 mt-1">
                    ✓ Valid hash format ({manualHash.length} characters)
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter the 64-character report hash (starts with 0x) that was generated when the report was issued
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Example: 0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
              </p>
            </form>
          </div>
        )}

        {/* QR Scanner */}
        {scanMode === 'qr' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <QRScanner onScanSuccess={handleQRScan} />
          </div>
        )}

        {/* Verification Result */}
        {(result || loading) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <VerificationResult result={result} loading={loading} />
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">How It Works</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>✓ Reports are stored on blockchain with unique report hash</li>
            <li>✓ Each report contains patient ID and lab/hospital ID</li>
            <li>✓ QR codes contain the report hash for instant verification</li>
            <li>✓ Labs cannot alter or delete records once issued</li>
            <li>✓ Anyone can verify authenticity by scanning QR code or entering the hash</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;