import crypto from 'crypto';
import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Review from '../models/Review.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { getCurriculum } from '../services/courseService.js';

async function getEnrollment(req) {
  const e = await Enrollment.findOne({ student: req.user._id, course: req.params.courseId });
  if (!e) throw new AppError('You are not enrolled in this course', 403);
  return e;
}

export const myEnrollments = catchAsync(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id }).sort('-updatedAt').populate({
    path: 'course', select: 'title slug thumbnail instructor totalLessons status',
    populate: { path: 'instructor', select: 'name' },
  });
  res.json({ status: 'success', data: { enrollments: enrollments.filter((e) => e.course) } });
});

export const getLearn = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.courseId).populate('instructor', 'name');
  if (!course) throw new AppError('Course not found', 404);
  const enrollment = await Enrollment.findOne({ student: req.user._id, course: course._id });
  const privileged = req.user.role === 'admin' || String(course.instructor._id) === String(req.user._id);
  if (!enrollment && !privileged) throw new AppError('You are not enrolled in this course', 403);
  const [sections, myReview] = await Promise.all([
    getCurriculum(course._id, true),
    Review.findOne({ course: course._id, student: req.user._id }),
  ]);
  res.json({ status: 'success', data: { course, sections, enrollment, myReview } });
});

export const updateProgress = catchAsync(async (req, res) => {
  const e = await getEnrollment(req);
  const { lessonId, completed, position } = req.body;
  if (!lessonId) throw new AppError('lessonId is required', 400);
  e.lastWatched = { lesson: lessonId, position: Number(position) || 0, at: new Date() };
  if (completed === true && !e.completedLessons.some((l) => String(l) === String(lessonId))) e.completedLessons.push(lessonId);
  if (completed === false) e.completedLessons = e.completedLessons.filter((l) => String(l) !== String(lessonId));

  const [total, done] = await Promise.all([
    Lesson.countDocuments({ course: e.course }),
    Lesson.countDocuments({ course: e.course, _id: { $in: e.completedLessons } }),
  ]);
  e.percentComplete = total ? Math.round((done / total) * 100) : 0;
  // Course progress alone never issues a certificate; the final quiz must be passed.
  if (e.percentComplete < 100) {
    e.quizPassed = false; e.quizScore = null; e.completedAt = undefined; e.certificateId = undefined;
  }
  await e.save();
  res.json({ status: 'success', data: { enrollment: e } });
});

export const addBookmark = catchAsync(async (req, res) => {
  const e = await getEnrollment(req);
  const { lessonId, time, note } = req.body;
  e.bookmarks.push({ lesson: lessonId, time: Math.floor(Number(time) || 0), note });
  await e.save();
  res.status(201).json({ status: 'success', data: { enrollment: e } });
});

export const deleteBookmark = catchAsync(async (req, res) => {
  const e = await getEnrollment(req);
  e.bookmarks = e.bookmarks.filter((b) => String(b._id) !== req.params.bookmarkId);
  await e.save();
  res.json({ status: 'success', data: { enrollment: e } });
});

export const getCertificate = catchAsync(async (req, res) => {
  const e = await getEnrollment(req);
  if (!e.completedAt || !e.quizPassed || e.percentComplete < 100) throw new AppError('Complete every lesson and pass the final quiz to get your certificate', 400);
  const course = await Course.findById(e.course).populate('instructor', 'name');
  res.json({
    status: 'success',
    data: { certificate: { studentName: req.user.name, courseTitle: course.title, instructorName: course.instructor.name, completedAt: e.completedAt, certificateId: e.certificateId } },
  });
});

export const upsertReview = catchAsync(async (req, res) => {
  const e = await Enrollment.findOne({ student: req.user._id, course: req.params.courseId });
  if (!e) throw new AppError('Only enrolled students can review this course', 403);
  const rating = Number(req.body.rating);
  if (!(rating >= 1 && rating <= 5)) throw new AppError('Rating must be between 1 and 5', 400);
  let review = await Review.findOne({ course: req.params.courseId, student: req.user._id });
  if (review) { review.rating = rating; review.comment = req.body.comment; await review.save(); }
  else review = await Review.create({ course: req.params.courseId, student: req.user._id, rating, comment: req.body.comment });
  res.json({ status: 'success', data: { review } });
});

export const deleteReview = catchAsync(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new AppError('Review not found', 404);
  if (req.user.role !== 'admin' && String(review.student) !== String(req.user._id)) throw new AppError('Not allowed', 403);
  await Review.findByIdAndDelete(review._id);
  res.json({ status: 'success' });
});
