import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { getOwnedCourse } from '../services/courseService.js';

async function ownedSection(id, user) {
  const section = await Section.findById(id);
  if (!section) throw new AppError('Section not found', 404);
  await getOwnedCourse(section.course, user);
  return section;
}
async function ownedLesson(id, user) {
  const lesson = await Lesson.findById(id);
  if (!lesson) throw new AppError('Lesson not found', 404);
  await getOwnedCourse(lesson.course, user);
  return lesson;
}

export const createSection = catchAsync(async (req, res) => {
  const course = await getOwnedCourse(req.params.courseId, req.user);
  if (!req.body.title) throw new AppError('Section title is required', 400);
  const order = await Section.countDocuments({ course: course._id });
  const section = await Section.create({ course: course._id, title: req.body.title, order });
  res.status(201).json({ status: 'success', data: { section } });
});

export const updateSection = catchAsync(async (req, res) => {
  const section = await ownedSection(req.params.id, req.user);
  if (req.body.title) section.title = req.body.title;
  await section.save();
  res.json({ status: 'success', data: { section } });
});

export const deleteSection = catchAsync(async (req, res) => {
  const section = await ownedSection(req.params.id, req.user);
  const lessons = await Lesson.find({ section: section._id });
  for (const l of lessons) await Lesson.findByIdAndDelete(l._id); // triggers stats sync
  await section.deleteOne();
  res.json({ status: 'success' });
});

function lessonData(b) {
  const d = {};
  ['title', 'description', 'type', 'content', 'isPreview'].forEach((k) => { if (b[k] !== undefined) d[k] = b[k]; });
  if (b.videoUrl !== undefined || b.duration !== undefined) {
    d.video = { url: b.videoUrl, publicId: b.publicId, duration: Number(b.duration) || 0 };
  }
  return d;
}

export const createLesson = catchAsync(async (req, res) => {
  const section = await ownedSection(req.params.sectionId, req.user);
  if (!req.body.title) throw new AppError('Lesson title is required', 400);
  const order = await Lesson.countDocuments({ section: section._id });
  const lesson = await Lesson.create({ ...lessonData(req.body), course: section.course, section: section._id, order });
  res.status(201).json({ status: 'success', data: { lesson } });
});

export const updateLesson = catchAsync(async (req, res) => {
  const lesson = await ownedLesson(req.params.id, req.user);
  lesson.set(lessonData(req.body));
  await lesson.save();
  res.json({ status: 'success', data: { lesson } });
});

export const deleteLesson = catchAsync(async (req, res) => {
  const lesson = await ownedLesson(req.params.id, req.user);
  await Lesson.findByIdAndDelete(lesson._id);
  res.json({ status: 'success' });
});
