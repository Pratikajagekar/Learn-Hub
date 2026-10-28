import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { sendToken } from '../middleware/auth.js';

export const register = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) throw new AppError('Name, email and password are required', 400);
  if (password.length < 8) throw new AppError('Password must be at least 8 characters', 400);
  const safeRole = role === 'instructor' ? 'instructor' : 'student'; // never allow self-registering as admin
  const user = await User.create({ name, email, password, role: safeRole });
  sendToken(user, 201, res);
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw new AppError('Incorrect email or password', 401);
  if (!user.isActive) throw new AppError('This account has been deactivated', 403);
  sendToken(user, 200, res);
});

export const logout = (req, res) => {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ status: 'success' });
};

export const me = (req, res) => res.json({ status: 'success', data: { user: req.user } });

export const updateMe = catchAsync(async (req, res) => {
  const { name, headline, bio, avatar } = req.body;
  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  if (headline !== undefined) user.headline = headline;
  if (bio !== undefined) user.bio = bio;
  if (avatar) user.avatar = { url: avatar };
  await user.save();
  res.json({ status: 'success', data: { user } });
});
