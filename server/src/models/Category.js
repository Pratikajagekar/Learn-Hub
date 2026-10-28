import mongoose from 'mongoose';
import slugify from 'slugify';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: String,
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }, // sub-categories
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.pre('validate', function (next) {
  if (this.isModified('name')) this.slug = slugify(this.name, { lower: true, strict: true });
  next();
});

export default mongoose.model('Category', categorySchema);
