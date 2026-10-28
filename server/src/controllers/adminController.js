import User from '../models/User.js';
import Course from '../models/Course.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import Enrollment from '../models/Enrollment.js';
import Lesson from '../models/Lesson.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

export const stats = catchAsync(async (req, res) => {
  const [users, courses, enrollments, revenueAgg, byRole, byStatus] = await Promise.all([
    User.countDocuments(), Course.countDocuments(), Enrollment.countDocuments(),
    Order.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Course.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  res.json({ status: 'success', data: { stats: { users, courses, enrollments, revenue: revenueAgg[0]?.revenue || 0, orders: revenueAgg[0]?.orders || 0, byRole, byStatus } } });
});

export const listCourses = catchAsync(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const courses = await Course.find(filter).sort('-updatedAt').populate('instructor', 'name email').populate('category', 'name');
  res.json({ status: 'success', data: { courses } });
});

export const approveCourse = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError('Course not found', 404);
  course.status = 'published';
  course.publishedAt = course.publishedAt || new Date();
  course.rejectionReason = undefined;
  await course.save();
  res.json({ status: 'success', data: { course } });
});

export const rejectCourse = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new AppError('Course not found', 404);
  course.status = 'rejected';
  course.rejectionReason = req.body.reason || 'Does not meet quality guidelines';
  await course.save();
  res.json({ status: 'success', data: { course } });
});

export const listUsers = catchAsync(async (req, res) => {
  const users = await User.find().sort('-createdAt');
  res.json({ status: 'success', data: { users } });
});

export const updateUser = catchAsync(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw new AppError('You cannot modify your own account here', 400);
  const patch = {};
  if (['student', 'instructor', 'admin'].includes(req.body.role)) patch.role = req.body.role;
  if (typeof req.body.isActive === 'boolean') patch.isActive = req.body.isActive;
  const user = await User.findByIdAndUpdate(req.params.id, patch, { new: true });
  if (!user) throw new AppError('User not found', 404);
  res.json({ status: 'success', data: { user } });
});

// ---- Categories (public read, admin write) ----
export const listCategories = catchAsync(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort('name');
  res.json({ status: 'success', data: { categories } });
});
export const createCategory = catchAsync(async (req, res) => {
  const category = await Category.create({ name: req.body.name, description: req.body.description });
  res.status(201).json({ status: 'success', data: { category } });
});
export const updateCategory = catchAsync(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  if (req.body.name) category.name = req.body.name;
  if (req.body.description !== undefined) category.description = req.body.description;
  await category.save();
  res.json({ status: 'success', data: { category } });
});
export const deleteCategory = catchAsync(async (req, res) => {
  if (await Course.exists({ category: req.params.id })) throw new AppError('Category is used by courses and cannot be deleted', 400);
  await Category.findByIdAndDelete(req.params.id);
  res.json({ status: 'success' });
});

// ---- Instructor dashboard ----
export const instructorDashboard = catchAsync(async (req, res) => {
  const courses = await Course.find({ instructor: req.user._id }).sort('-updatedAt').populate('category', 'name');
  const sales = await Order.aggregate([
    { $match: { status: 'paid', 'items.instructor': req.user._id } },
    { $unwind: '$items' },
    { $match: { 'items.instructor': req.user._id } },
    { $sort: { paidAt: -1 } },
    { $limit: 10 },
    { $project: { _id: 0, title: '$items.title', earning: '$items.instructorEarning', price: '$items.price', paidAt: 1 } },
  ]);
  const me = await User.findById(req.user._id);
  res.json({
    status: 'success',
    data: {
      stats: {
        courses: courses.length,
        students: courses.reduce((s, c) => s + c.enrollmentCount, 0),
        earnings: me.earnings,
        avgRating: courses.filter((c) => c.ratingCount).length
          ? +(courses.filter((c) => c.ratingCount).reduce((s, c) => s + c.ratingAverage, 0) / courses.filter((c) => c.ratingCount).length).toFixed(1) : 0,
      },
      courses, recentSales: sales,
    },
  });
});
