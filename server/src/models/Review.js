import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 2000 },
    instructorReply: { text: String, repliedAt: Date },
  },
  { timestamps: true }
);

reviewSchema.index({ course: 1, student: 1 }, { unique: true }); // one review per student per course

// Recalculate denormalized rating on the Course
reviewSchema.statics.recalcRatings = async function (courseId) {
  const [stats] = await this.aggregate([
    { $match: { course: courseId } },
    { $group: { _id: '$course', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await mongoose.model('Course').findByIdAndUpdate(courseId, {
    ratingAverage: stats?.avg || 0,
    ratingCount: stats?.count || 0,
  });
};

reviewSchema.post('save', function () { return this.constructor.recalcRatings(this.course); });
reviewSchema.post('findOneAndDelete', function (doc) {
  return doc && doc.constructor.recalcRatings(doc.course);
});

export default mongoose.model('Review', reviewSchema);
