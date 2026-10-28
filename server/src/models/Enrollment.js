import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // null for free courses

    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    percentComplete: { type: Number, default: 0, min: 0, max: 100 },

    // Resume playback
    lastWatched: {
      lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
      position: { type: Number, default: 0 }, // seconds
      at: Date,
    },

    bookmarks: [
      {
        lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
        time: { type: Number, required: true }, // seconds
        note: { type: String, maxlength: 300 },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    quizPassed: { type: Boolean, default: false },
    quizScore: { type: Number, default: null, min: 0, max: 100 },
    quizAttemptedAt: Date,
    completedAt: Date,
    certificateId: { type: String, unique: true, sparse: true }, // issued at 100%
  },
  { timestamps: true }
);

// A student can only enroll once per course
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model('Enrollment', enrollmentSchema);
