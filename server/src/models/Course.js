import mongoose from 'mongoose';
import slugify from 'slugify';

const courseSchema = new mongoose.Schema(
  {
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
    slug: { type: String, unique: true, index: true },
    subtitle: { type: String, trim: true, maxlength: 200 },
    description: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    tags: [{ type: String, lowercase: true, trim: true }],
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'all'], default: 'all', index: true },
    language: { type: String, default: 'English' },

    price: { type: Number, required: true, min: 0, default: 0 }, // in major currency units
    discountPrice: {
      type: Number,
      min: 0,
      validate: {
        validator(v) { return v == null || v < this.price; },
        message: 'Discount price must be lower than price',
      },
    },
    currency: { type: String, default: 'USD' },

    thumbnail: { url: String, publicId: String },
    previewVideo: { url: String, publicId: String },
    requirements: [String],
    outcomes: [String], // "What you'll learn"

    // Ordered list of sections (each Section owns its Lessons)
    sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],

    // Moderation workflow: draft -> pending -> published | rejected
    status: {
      type: String,
      enum: ['draft', 'pending', 'published', 'rejected', 'archived'],
      default: 'draft',
      index: true,
    },
    rejectionReason: String,
    publishedAt: Date,

    // Denormalized stats (updated by hooks/services for fast listing & filtering)
    ratingAverage: { type: Number, default: 0, min: 0, max: 5, set: (v) => Math.round(v * 10) / 10 },
    ratingCount: { type: Number, default: 0 },
    enrollmentCount: { type: Number, default: 0 },
    totalLessons: { type: Number, default: 0 },
    totalDuration: { type: Number, default: 0 }, // seconds
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Full-text search across title/subtitle/tags
courseSchema.index({ title: 'text', subtitle: 'text', tags: 'text' }, { weights: { title: 5, tags: 3, subtitle: 1 } });
// Common filter/sort combo for the catalog page
courseSchema.index({ status: 1, category: 1, level: 1, price: 1, ratingAverage: -1 });

courseSchema.virtual('effectivePrice').get(function () {
  return this.discountPrice ?? this.price;
});

courseSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'course',
});

courseSchema.pre('validate', function (next) {
  if (this.isNew || !this.slug) {
    this.slug = `${slugify(this.title, { lower: true, strict: true })}-${Math.random().toString(36).slice(2, 7)}`;
  }
  next();
});

export default mongoose.model('Course', courseSchema);
