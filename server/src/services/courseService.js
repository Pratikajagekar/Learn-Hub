import Course from '../models/Course.js';
import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';
import AppError from '../utils/AppError.js';

export async function getOwnedCourse(courseId, user) {
  const course = await Course.findById(courseId);
  if (!course) throw new AppError('Course not found', 404);
  if (user.role !== 'admin' && String(course.instructor) !== String(user._id))
    throw new AppError('You can only modify your own courses', 403);
  return course;
}

// full=false hides video URLs / content for non-preview lessons
export async function getCurriculum(courseId, full) {
  const [sections, lessons] = await Promise.all([
    Section.find({ course: courseId }).sort('order').lean(),
    Lesson.find({ course: courseId }).sort('order').lean(),
  ]);
  return sections.map((s) => ({
    ...s,
    lessons: lessons
      .filter((l) => String(l.section) === String(s._id))
      .map((l) =>
        full || l.isPreview
          ? l
          : { _id: l._id, section: l.section, title: l.title, type: l.type, order: l.order, isPreview: false, video: { duration: l.video?.duration || 0 } }
      ),
  }));
}
