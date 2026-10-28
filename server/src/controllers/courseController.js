import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import Enrollment from '../models/Enrollment.js';
import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { getOwnedCourse, getCurriculum } from '../services/courseService.js';

const SORTS = {
  popular: { enrollmentCount: -1 },
  newest: { publishedAt: -1 },
  rating: { ratingAverage: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
};
const FIELDS = ['title', 'subtitle', 'description', 'category', 'level', 'language', 'price', 'discountPrice', 'tags', 'requirements', 'outcomes'];

function pickCourseFields(body) {
  const data = {};
  FIELDS.forEach((f) => { if (body[f] !== undefined) data[f] = body[f]; });
  if (typeof data.tags === 'string') data.tags = data.tags.split(',').map((t) => t.trim()).filter(Boolean);
  if (data.discountPrice === '' || data.discountPrice === null) data.discountPrice = undefined;
  if (body.thumbnail) data.thumbnail = { url: body.thumbnail };
  return data;
}

export const listCourses = catchAsync(async (req, res) => {
  const { q, category, level, minPrice, maxPrice, rating, sort = 'popular', page = 1, limit = 12 } = req.query;
  const filter = { status: 'published' };
  if (q) {
    const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: rx }, { subtitle: rx }, { tags: rx }];
  }
  if (category) {
    const c = await Category.findOne(mongoose.isValidObjectId(category) ? { _id: category } : { slug: category });
    filter.category = c ? c._id : null;
  }
  if (level) filter.level = level;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (rating) filter.ratingAverage = { $gte: Number(rating) };

  const p = Math.max(1, Number(page));
  const l = Math.min(48, Math.max(1, Number(limit)));
  const [courses, total] = await Promise.all([
    Course.find(filter).sort(SORTS[sort] || SORTS.popular).skip((p - 1) * l).limit(l)
      .populate('instructor', 'name avatar headline').populate('category', 'name slug'),
    Course.countDocuments(filter),
  ]);
  res.json({ status: 'success', data: { courses, total, page: p, pages: Math.ceil(total / l) } });
});

export const getCourse = catchAsync(async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug })
    .populate('instructor', 'name avatar headline bio').populate('category', 'name slug');
  const user = req.user;
  const isOwner = user && String(course?.instructor?._id) === String(user._id);
  const isAdmin = user?.role === 'admin';
  if (!course || (course.status !== 'published' && !isOwner && !isAdmin)) throw new AppError('Course not found', 404);

  const isEnrolled = user ? !!(await Enrollment.exists({ student: user._id, course: course._id })) : false;
  const canViewAll = isEnrolled || isOwner || isAdmin;
  const [sections, reviews] = await Promise.all([
    getCurriculum(course._id, canViewAll),
    Review.find({ course: course._id }).populate('student', 'name avatar').sort('-createdAt').limit(50),
  ]);
  res.json({ status: 'success', data: { course, sections, reviews, isEnrolled, isOwner } });
});

export const createCourse = catchAsync(async (req, res) => {
  const course = await Course.create({ ...pickCourseFields(req.body), instructor: req.user._id });
  res.status(201).json({ status: 'success', data: { course } });
});

export const updateCourse = catchAsync(async (req, res) => {
  const course = await getOwnedCourse(req.params.id, req.user);
  course.set(pickCourseFields(req.body));
  if (course.status === 'rejected') course.status = 'draft';
  await course.save();
  res.json({ status: 'success', data: { course } });
});

export const deleteCourse = catchAsync(async (req, res) => {
  const course = await getOwnedCourse(req.params.id, req.user);
  if (course.enrollmentCount > 0) {
    course.status = 'archived'; // keep access for students who already paid
    await course.save();
    return res.json({ status: 'success', message: 'Course archived (it has enrolled students)' });
  }
  await Lesson.deleteMany({ course: course._id });
  await Section.deleteMany({ course: course._id });
  await course.deleteOne();
  res.json({ status: 'success', message: 'Course deleted' });
});

export const submitCourse = catchAsync(async (req, res) => {
  const course = await getOwnedCourse(req.params.id, req.user);
  if (!course.totalLessons) throw new AppError('Add at least one lesson before submitting', 400);
  course.status = 'pending';
  course.rejectionReason = undefined;
  await course.save();
  res.json({ status: 'success', data: { course } });
});

// Instructor: full course for the editor
export const getCourseForEdit = catchAsync(async (req, res) => {
  const course = await getOwnedCourse(req.params.id, req.user);
  const sections = await getCurriculum(course._id, true);
  res.json({ status: 'success', data: { course, sections } });
});
