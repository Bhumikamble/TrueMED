const crypto = require("crypto");

/**
 * Generate SHA-256 hash from a buffer
 * @param {Buffer} buffer - The file buffer to hash
 * @returns {string} - Hexadecimal SHA-256 hash (64 characters)
 */
const generateSHA256Hash = (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("Invalid input: buffer is required");
  }
  
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

/**
 * Generate SHA-256 hash from a string
 * @param {string} text - The text to hash
 * @returns {string} - Hexadecimal SHA-256 hash
 */
const generateSHA256HashFromString = (text) => {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid input: string is required");
  }
  
  return crypto.createHash("sha256").update(text).digest("hex");
};

/**
 * Verify if a buffer matches a given hash
 * @param {Buffer} buffer - The file buffer to verify
 * @param {string} expectedHash - The expected hash to compare against
 * @returns {boolean} - True if hash matches
 */
const verifyHash = (buffer, expectedHash) => {
  if (!buffer || !expectedHash) {
    return false;
  }
  
  const computedHash = generateSHA256Hash(buffer);
  return computedHash === expectedHash;
};

/**
 * Verify if a string matches a given hash
 * @param {string} text - The text to verify
 * @param {string} expectedHash - The expected hash to compare against
 * @returns {boolean} - True if hash matches
 */
const verifyHashFromString = (text, expectedHash) => {
  if (!text || !expectedHash) {
    return false;
  }
  
  const computedHash = generateSHA256HashFromString(text);
  return computedHash === expectedHash;
};

/**
 * Generate a short hash (first n characters)
 * @param {string} hash - Full SHA-256 hash
 * @param {number} length - Number of characters to return (default: 8)
 * @returns {string} - Shortened hash
 */
const getShortHash = (hash, length = 8) => {
  if (!hash) return null;
  return hash.substring(0, length);
};

/**
 * Format hash for display (with ellipsis)
 * @param {string} hash - Full SHA-256 hash
 * @param {number} prefixLength - Characters to show at start (default: 10)
 * @param {number} suffixLength - Characters to show at end (default: 10)
 * @returns {string} - Formatted hash (e.g., "5eb47ca41e...dcc697")
 */
const formatHashDisplay = (hash, prefixLength = 10, suffixLength = 10) => {
  if (!hash) return "N/A";
  if (hash.length <= prefixLength + suffixLength) return hash;
  
  const prefix = hash.substring(0, prefixLength);
  const suffix = hash.substring(hash.length - suffixLength);
  return `${prefix}...${suffix}`;
};

module.exports = {
  generateSHA256Hash,
  generateSHA256HashFromString,
  verifyHash,
  verifyHashFromString,
  getShortHash,
  formatHashDisplay,
};