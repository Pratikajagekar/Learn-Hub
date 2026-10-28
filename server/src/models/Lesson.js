import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: String,
    order: { type: Number, required: true, default: 0 },
    type: { type: String, enum: ['video', 'article', 'quiz'], default: 'video' },

    video: {
      url: String, // MP4/HLS URL or YouTube watch/share URL
      publicId: String, // needed to delete/replace
      duration: { type: Number, default: 0 }, // seconds
    },
    content: String, // markdown/HTML for article lessons
    resources: [{ name: String, url: String, publicId: String }], // downloadable files

    isPreview: { type: Boolean, default: false }, // free preview for non-enrolled users
  },
  { timestamps: true }
);

lessonSchema.index({ section: 1, order: 1 });

// Keep Course.totalLessons / totalDuration in sync
async function syncCourseStats(courseId) {
  const [stats] = await mongoose.model('Lesson').aggregate([
    { $match: { course: courseId } },
    { $group: { _id: '$course', totalLessons: { $sum: 1 }, totalDuration: { $sum: '$video.duration' } } },
  ]);
  await mongoose.model('Course').findByIdAndUpdate(courseId, {
    totalLessons: stats?.totalLessons || 0,
    totalDuration: stats?.totalDuration || 0,
  });
}

lessonSchema.post('save', (doc) => syncCourseStats(doc.course));
lessonSchema.post('findOneAndDelete', (doc) => doc && syncCourseStats(doc.course));

export default mongoose.model('Lesson', lessonSchema);
