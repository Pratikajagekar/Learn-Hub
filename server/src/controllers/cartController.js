import User from '../models/User.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

const loadCart = async (userId) => {
  const u = await User.findById(userId).populate({
    path: 'cart', select: 'title slug price discountPrice thumbnail instructor ratingAverage status',
    populate: { path: 'instructor', select: 'name' },
  });
  return u.cart.filter((c) => c.status === 'published');
};

export const getCart = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { cart: await loadCart(req.user._id) } });
});

export const addToCart = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course || course.status !== 'published') throw new AppError('Course not available', 404);
  if (String(course.instructor) === String(req.user._id)) throw new AppError('You cannot buy your own course', 400);
  if (await Enrollment.exists({ student: req.user._id, course: course._id })) throw new AppError('You already own this course', 400);
  await User.findByIdAndUpdate(req.user._id, { $addToSet: { cart: course._id } });
  res.json({ status: 'success', data: { cart: await loadCart(req.user._id) } });
});

export const removeFromCart = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $pull: { cart: req.params.courseId } });
  res.json({ status: 'success', data: { cart: await loadCart(req.user._id) } });
});
