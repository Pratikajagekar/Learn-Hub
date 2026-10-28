import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

// Verifies the JWT from the HTTP-only cookie (Bearer header as fallback for tools like Postman)
export const protect = catchAsync(async (req, res, next) => {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ') && req.headers.authorization.split(' ')[1]);
  if (!token) throw new AppError('You are not logged in', 401);

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw new AppError('User no longer exists or is deactivated', 401);
  if (user.changedPasswordAfter(decoded.iat))
    throw new AppError('Password recently changed, please log in again', 401);

  req.user = user;
  next();
});

// Role-based access control: restrictTo('instructor', 'admin')
export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(new AppError('You do not have permission to perform this action', 403));
    next();
  };

// Helper to set the JWT cookie
export const sendToken = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: (Number(process.env.COOKIE_EXPIRES_DAYS) || 7) * 24 * 60 * 60 * 1000,
  });
  user.password = undefined;
  res.status(statusCode).json({ status: 'success', data: { user } });
};

// Attaches req.user if a valid cookie exists, but never blocks the request
export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) req.user = user;
    }
  } catch (e) { /* ignore invalid token */ }
  next();
};
