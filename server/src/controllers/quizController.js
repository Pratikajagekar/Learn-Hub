import Quiz from '../models/Quiz.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import Lesson from '../models/Lesson.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { getOwnedCourse } from '../services/courseService.js';

export const getQuizForInstructor = catchAsync(async (req, res) => {
  const course = await getOwnedCourse(req.params.courseId, req.user);
  const quiz = await Quiz.findOne({ course: course._id });
  res.json({ status: 'success', data: { quiz } });
});

export const saveQuiz = catchAsync(async (req, res) => {
  const course = await getOwnedCourse(req.params.courseId, req.user);
  const { title = 'Course Completion Quiz', passMark = 70, questions = [] } = req.body;
  if (!Array.isArray(questions) || questions.length < 1) throw new AppError('Add at least one quiz question', 400);
  if (!Number.isFinite(Number(passMark)) || Number(passMark) < 1 || Number(passMark) > 100) throw new AppError('Pass mark must be from 1 to 100', 400);
  for (const [i, q] of questions.entries()) {
    if (!q.question?.trim() || !Array.isArray(q.options) || q.options.length < 2 || q.options.some(o => !String(o).trim())) throw new AppError(`Question ${i + 1} needs text and at least two options`, 400);
    if (!Number.isInteger(Number(q.correctAnswer)) || Number(q.correctAnswer) < 0 || Number(q.correctAnswer) >= q.options.length) throw new AppError(`Question ${i + 1} has an invalid correctAnswer index`, 400);
  }
  const quiz = await Quiz.findOneAndUpdate({ course: course._id }, { course: course._id, title, passMark: Number(passMark), questions }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
  res.json({ status: 'success', data: { quiz } });
});

export const getStudentQuiz = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.courseId).select('_id title');
  if (!course) throw new AppError('Course not found', 404);
  const enrollment = await Enrollment.findOne({ student: req.user._id, course: course._id });
  if (!enrollment && req.user.role !== 'admin') throw new AppError('You are not enrolled in this course', 403);
  const [totalLessons, completedLessons, quiz] = await Promise.all([
    Lesson.countDocuments({ course: course._id }),
    Lesson.countDocuments({ course: course._id, _id: { $in: enrollment?.completedLessons || [] } }),
    Quiz.findOne({ course: course._id }),
  ]);
  if (totalLessons === 0 || completedLessons < totalLessons) throw new AppError('Complete every course lesson before taking the quiz', 403);
  if (!quiz || !quiz.questions.length) throw new AppError('The instructor has not configured the final quiz yet', 404);
  res.json({ status: 'success', data: { quiz: { _id: quiz._id, title: quiz.title, passMark: quiz.passMark, questions: quiz.questions.map(q => ({ _id: q._id, question: q.question, options: q.options })) }, enrollment: { quizPassed: enrollment?.quizPassed || false, quizScore: enrollment?.quizScore ?? null } } });
});

export const submitQuiz = catchAsync(async (req, res) => {
  const course = await Course.findById(req.params.courseId).select('_id');
  if (!course) throw new AppError('Course not found', 404);
  const enrollment = await Enrollment.findOne({ student: req.user._id, course: course._id });
  if (!enrollment) throw new AppError('You are not enrolled in this course', 403);
  const [totalLessons, completedLessons, quiz] = await Promise.all([
    Lesson.countDocuments({ course: course._id }),
    Lesson.countDocuments({ course: course._id, _id: { $in: enrollment.completedLessons } }),
    Quiz.findOne({ course: course._id }),
  ]);
  if (!totalLessons || completedLessons < totalLessons) throw new AppError('Complete every course lesson before taking the quiz', 403);
  if (!quiz || !quiz.questions.length) throw new AppError('The final quiz is not configured', 404);
  const answers = req.body.answers;
  if (!Array.isArray(answers) || answers.length !== quiz.questions.length) throw new AppError('Submit one answer for each question', 400);
  let correct = 0;
  quiz.questions.forEach((q, i) => { if (Number(answers[i]) === q.correctAnswer) correct++; });
  const score = Math.round(correct / quiz.questions.length * 100);
  enrollment.quizScore = score;
  enrollment.quizAttemptedAt = new Date();
  enrollment.quizPassed = score >= quiz.passMark;
  if (enrollment.quizPassed && completedLessons === totalLessons) {
    enrollment.completedAt = enrollment.completedAt || new Date();
    if (!enrollment.certificateId) enrollment.certificateId = `CERT-${Math.random().toString(16).slice(2, 12).toUpperCase()}`;
  } else {
    enrollment.completedAt = undefined;
    enrollment.certificateId = undefined;
  }
  await enrollment.save();
  res.json({ status: 'success', data: { score, passed: enrollment.quizPassed, passMark: quiz.passMark, correct, total: quiz.questions.length, results: quiz.questions.map((q, i) => ({ question: q.question, selected: Number(answers[i]), correctAnswer: q.correctAnswer, explanation: q.explanation || '' })), enrollment } });
});
