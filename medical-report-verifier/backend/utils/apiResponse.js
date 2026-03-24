/**
 * Success response formatter
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Object} data - Response data
 * @param {Object} meta - Additional metadata (pagination, etc.)
 * @returns {Object} JSON response
 */
const successResponse = (res, statusCode = 200, message = "Success", data = null, meta = null) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString(),
  };
  
  if (data !== null && data !== undefined) {
    response.data = data;
  }
  
  if (meta !== null && meta !== undefined) {
    response.meta = meta;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Error response formatter
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {string|Object} errors - Detailed error information
 * @param {string} stack - Error stack trace (development only)
 * @returns {Object} JSON response
 */
const errorResponse = (res, statusCode = 500, message = "Error", errors = null, stack = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  // Include stack trace only in development
  if (process.env.NODE_ENV === "development" && stack) {
    response.stack = stack;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Paginated response formatter
 * @param {Object} res - Express response object
 * @param {Array} data - Response data array
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {string} message - Success message
 * @returns {Object} JSON response with pagination
 */
const paginatedResponse = (res, data = [], page = 1, limit = 20, total = 0, message = "Success") => {
  const totalPages = Math.ceil(total / limit);
  
  return successResponse(res, 200, message, data, {
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

/**
 * Created response (201)
 * @param {Object} res - Express response object
 * @param {string} message - Success message
 * @param {Object} data - Created resource data
 * @returns {Object} JSON response
 */
const createdResponse = (res, message = "Resource created successfully", data = null) => {
  return successResponse(res, 201, message, data);
};

/**
 * No content response (204)
 * @param {Object} res - Express response object
 * @returns {Object} JSON response
 */
const noContentResponse = (res) => {
  return res.status(204).send();
};

/**
 * Validation error response (422)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Object} errors - Validation errors
 * @returns {Object} JSON response
 */
const validationErrorResponse = (res, message = "Validation error", errors = null) => {
  return errorResponse(res, 422, message, errors);
};

/**
 * Unauthorized response (401)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} JSON response
 */
const unauthorizedResponse = (res, message = "Unauthorized access") => {
  return errorResponse(res, 401, message);
};

/**
 * Forbidden response (403)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} JSON response
 */
const forbiddenResponse = (res, message = "Access denied") => {
  return errorResponse(res, 403, message);
};

/**
 * Not found response (404)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} JSON response
 */
const notFoundResponse = (res, message = "Resource not found") => {
  return errorResponse(res, 404, message);
};

/**
 * Conflict response (409)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} JSON response
 */
const conflictResponse = (res, message = "Resource already exists") => {
  return errorResponse(res, 409, message);
};

/**
 * Rate limit response (429)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @returns {Object} JSON response
 */
const rateLimitResponse = (res, message = "Too many requests, please try again later") => {
  return errorResponse(res, 429, message);
};

/**
 * Server error response (500)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Error} error - Error object
 * @returns {Object} JSON response
 */
const serverErrorResponse = (res, message = "Internal server error", error = null) => {
  const errorMessage = error?.message || message;
  const errorStack = process.env.NODE_ENV === "development" ? error?.stack : null;
  return errorResponse(res, 500, errorMessage, error?.name || "ServerError", errorStack);
};

/**
 * Format validation errors from mongoose/express-validator
 * @param {Array} errors - Validation errors array
 * @returns {Object} Formatted errors object
 */
const formatValidationErrors = (errors) => {
  const formattedErrors = {};
  
  if (Array.isArray(errors)) {
    errors.forEach((error) => {
      const field = error.path || error.param || error.field;
      if (field) {
        formattedErrors[field] = error.msg || error.message;
      }
    });
  } else if (typeof errors === "object") {
    Object.keys(errors).forEach((key) => {
      formattedErrors[key] = errors[key];
    });
  }
  
  return formattedErrors;
};

/**
 * Create API response wrapper
 * @returns {Object} Response helper object
 */
const apiResponse = (res) => {
  return {
    success: (statusCode = 200, message = "Success", data = null, meta = null) => 
      successResponse(res, statusCode, message, data, meta),
    error: (statusCode = 500, message = "Error", errors = null) => 
      errorResponse(res, statusCode, message, errors),
    created: (message = "Resource created", data = null) => 
      createdResponse(res, message, data),
    noContent: () => noContentResponse(res),
    validation: (message = "Validation error", errors = null) => 
      validationErrorResponse(res, message, errors),
    unauthorized: (message = "Unauthorized") => 
      unauthorizedResponse(res, message),
    forbidden: (message = "Forbidden") => 
      forbiddenResponse(res, message),
    notFound: (message = "Not found") => 
      notFoundResponse(res, message),
    conflict: (message = "Conflict") => 
      conflictResponse(res, message),
    rateLimit: (message = "Too many requests") => 
      rateLimitResponse(res, message),
    serverError: (message = "Server error", error = null) => 
      serverErrorResponse(res, message, error),
    paginated: (data, page, limit, total, message = "Success") => 
      paginatedResponse(res, data, page, limit, total, message),
  };
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  rateLimitResponse,
  serverErrorResponse,
  formatValidationErrors,
  apiResponse,
};