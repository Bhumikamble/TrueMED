const crypto = require("crypto");

const generateSHA256Hash = (buffer) => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

module.exports = {
  generateSHA256Hash,
};
