const ApiError = require('../utils/ApiError');

function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function normalizeError(err) {
  if (err.isApiError) return err;

  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.fromEntries(
      Object.entries(err.errors).map(([field, e]) => [field, e.message])
    );
    return new ApiError(422, 'Validation failed', details);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return new ApiError(409, `A record with this ${field} already exists`);
  }

  if (err.name === 'CastError') {
    return new ApiError(400, `Invalid value for ${err.path}`);
  }

  return err;
}

function errorHandler(err, req, res, next) {
  const normalized = normalizeError(err);
  const statusCode = normalized.isApiError ? normalized.statusCode : normalized.statusCode || 500;
  const message = normalized.message || 'Something went wrong';

  if (!normalized.isApiError) {
    console.error('[error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    error:
      process.env.NODE_ENV === 'development'
        ? { details: normalized.details || null, stack: err.stack }
        : normalized.details || null,
  });
}

module.exports = { notFoundHandler, errorHandler };
