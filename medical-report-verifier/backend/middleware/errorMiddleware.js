const { errorResponse } = require("../utils/apiResponse");

const notFoundHandler = (req, res) => {
  return errorResponse(res, 404, `Route not found: ${req.originalUrl}`);
};

const errorHandler = (err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  return errorResponse(res, statusCode, message);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
