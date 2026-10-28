import { Router } from 'express';
import { protect, restrictTo, optionalAuth } from '../middleware/auth.js';
import * as auth from '../controllers/authController.js';
import * as course from '../controllers/courseController.js';
import * as cur from '../controllers/curriculumController.js';
import * as cart from '../controllers/cartController.js';
import * as pay from '../controllers/paymentController.js';
import * as learn from '../controllers/learnController.js';
import * as quiz from '../controllers/quizController.js';
import * as compiler from '../controllers/compilerController.js';
import * as admin from '../controllers/adminController.js';
import { uploadMiddleware, handleUpload } from '../controllers/uploadController.js';

const r = Router();
const instructor = [protect, restrictTo('instructor', 'admin')];
const adminOnly = [protect, restrictTo('admin')];

// Auth
r.post('/auth/register', auth.register);
r.post('/auth/login', auth.login);
r.post('/auth/logout', auth.logout);
r.get('/auth/me', protect, auth.me);
r.patch('/auth/me', protect, auth.updateMe);

// Categories
r.get('/categories', admin.listCategories);
r.post('/categories', ...adminOnly, admin.createCategory);
r.patch('/categories/:id', ...adminOnly, admin.updateCategory);
r.delete('/categories/:id', ...adminOnly, admin.deleteCategory);

// Courses (public)
r.get('/courses', course.listCourses);
r.get('/courses/slug/:slug', optionalAuth, course.getCourse);

// Courses (instructor)
r.post('/courses', ...instructor, course.createCourse);
r.get('/courses/:id/edit', ...instructor, course.getCourseForEdit);
r.patch('/courses/:id', ...instructor, course.updateCourse);
r.delete('/courses/:id', ...instructor, course.deleteCourse);
r.post('/courses/:id/submit', ...instructor, course.submitCourse);
r.post('/courses/:courseId/sections', ...instructor, cur.createSection);
r.patch('/sections/:id', ...instructor, cur.updateSection);
r.delete('/sections/:id', ...instructor, cur.deleteSection);
r.post('/sections/:sectionId/lessons', ...instructor, cur.createLesson);
r.patch('/lessons/:id', ...instructor, cur.updateLesson);
r.delete('/lessons/:id', ...instructor, cur.deleteLesson);
r.get('/instructor/dashboard', ...instructor, admin.instructorDashboard);
r.post('/uploads', ...instructor, uploadMiddleware, handleUpload);

// Cart & payments
r.get('/cart', protect, cart.getCart);
r.post('/cart/:courseId', protect, cart.addToCart);
r.delete('/cart/:courseId', protect, cart.removeFromCart);
r.post('/payments/checkout', protect, pay.checkout);
r.get('/payments/verify', protect, pay.verify);
r.get('/payments/orders', protect, pay.myOrders);

// Learning
r.get('/enrollments/my', protect, learn.myEnrollments);
r.get('/learn/:courseId', protect, learn.getLearn);
r.patch('/learn/:courseId/progress', protect, learn.updateProgress);
r.post('/learn/:courseId/bookmarks', protect, learn.addBookmark);
r.delete('/learn/:courseId/bookmarks/:bookmarkId', protect, learn.deleteBookmark);
r.get('/learn/:courseId/certificate', protect, learn.getCertificate);
r.get('/courses/:courseId/quiz/manage', ...instructor, quiz.getQuizForInstructor);
r.put('/courses/:courseId/quiz', ...instructor, quiz.saveQuiz);
r.get('/learn/:courseId/quiz', protect, quiz.getStudentQuiz);
r.post('/learn/:courseId/quiz/submit', protect, quiz.submitQuiz);
r.post('/compiler/run', protect, compiler.runCode);
r.post('/courses/:courseId/reviews', protect, learn.upsertReview);
r.delete('/reviews/:id', protect, learn.deleteReview);

// Admin
r.get('/admin/stats', ...adminOnly, admin.stats);
r.get('/admin/courses', ...adminOnly, admin.listCourses);
r.patch('/admin/courses/:id/approve', ...adminOnly, admin.approveCourse);
r.patch('/admin/courses/:id/reject', ...adminOnly, admin.rejectCourse);
r.get('/admin/users', ...adminOnly, admin.listUsers);
r.patch('/admin/users/:id', ...adminOnly, admin.updateUser);

export default r;
