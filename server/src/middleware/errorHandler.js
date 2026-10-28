import AppError from '../utils/AppError.js';

export default function errorHandler(err, req, res, next) {
  let error = err;

  if (err.name === 'CastError') error = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    error = new AppError(`Duplicate value for "${field}"`, 409);
  }
  if (err.name === 'ValidationError')
    error = new AppError(Object.values(err.errors).map((e) => e.message).join('. '), 400);
  if (err.name === 'JsonWebTokenError') error = new AppError('Invalid token', 401);
  if (err.name === 'TokenExpiredError') error = new AppError('Token expired, please log in again', 401);

  const status = error.statusCode || 500;
  res.status(status).json({
    status: status >= 500 ? 'error' : 'fail',
    message: error.isOperational ? error.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
