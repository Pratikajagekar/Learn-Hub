import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: String,
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

sectionSchema.index({ course: 1, order: 1 });

sectionSchema.virtual('lessons', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'section',
  options: { sort: { order: 1 } },
});

export default mongoose.model('Section', sectionSchema);
