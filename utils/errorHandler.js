// Enhanced Error Handling Utility
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'project-kali-itvms' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400);
    this.name = 'ValidationError';
    this.details = details;
  }
}

class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

// Database error handler
const handleDatabaseError = (error) => {
  logger.error('Database error:', error);

  // MySQL specific errors
  switch (error.code) {
    case 'ER_DUP_ENTRY':
      return new ConflictError('A record with this value already exists');
    case 'ER_NO_REFERENCED_ROW_2':
      return new ValidationError('Referenced record does not exist');
    case 'ER_ROW_IS_REFERENCED_2':
      return new ValidationError('Cannot delete record that is referenced by other records');
    case 'ER_DATA_TOO_LONG':
      return new ValidationError('Data too long for column');
    case 'ER_BAD_NULL_ERROR':
      return new ValidationError('Required field cannot be null');
    case 'ER_NO_SUCH_TABLE':
      return new DatabaseError('Database table does not exist');
    case 'ECONNREFUSED':
      return new DatabaseError('Database connection refused');
    case 'ETIMEDOUT':
      return new DatabaseError('Database connection timeout');
    case 'ENOTFOUND':
      return new DatabaseError('Database host not found');
    default:
      return new DatabaseError('Database operation failed', error);
  }
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error response formatter
const formatErrorResponse = (error, req) => {
  const response = {
    error: error.name || 'Error',
    message: error.message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  // Add details if available
  if (error.details) {
    response.details = error.details;
  }

  // Add request ID if available
  if (req.requestId) {
    response.requestId = req.requestId;
  }

  return response;
};

// Global error handler middleware
const globalErrorHandler = (error, req, res, next) => {
  let err = { ...error };
  err.message = error.message;

  // Log error
  logger.error('Global error handler:', {
    error: err.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user ? req.user.id : 'anonymous'
  });

  // Handle specific error types
  if (err.name === 'ValidationError' || err instanceof ValidationError) {
    return res.status(400).json(formatErrorResponse(err, req));
  }

  if (err.name === 'DatabaseError' || err.code) {
    const dbError = handleDatabaseError(err);
    return res.status(dbError.statusCode).json(formatErrorResponse(dbError, req));
  }

  if (err.name === 'JsonWebTokenError') {
    const authError = new AuthenticationError('Invalid token');
    return res.status(401).json(formatErrorResponse(authError, req));
  }

  if (err.name === 'TokenExpiredError') {
    const authError = new AuthenticationError('Token expired');
    return res.status(401).json(formatErrorResponse(authError, req));
  }

  if (err.name === 'CastError') {
    const validationError = new ValidationError('Invalid data format');
    return res.status(400).json(formatErrorResponse(validationError, req));
  }

  // Default error
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500 
    ? 'Something went wrong' 
    : err.message || 'Internal Server Error';

  const defaultError = new AppError(message, statusCode);
  res.status(statusCode).json(formatErrorResponse(defaultError, req));
};

// Request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      user: req.user ? req.user.id : 'anonymous'
    });
  });

  next();
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  next(error);
};

module.exports = {
  AppError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  asyncHandler,
  globalErrorHandler,
  requestLogger,
  notFoundHandler,
  formatErrorResponse,
  handleDatabaseError,
  logger
};
