import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student', index: true },
    avatar: { url: String, publicId: String },
    headline: { type: String, maxlength: 120 }, // instructor tagline
    bio: { type: String, maxlength: 2000 },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    cart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    isActive: { type: Boolean, default: true },
    passwordChangedAt: Date,
    // Instructor payouts
    stripeAccountId: String,
    earnings: {
      total: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      withdrawn: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.changedPasswordAfter = function (jwtIat) {
  return this.passwordChangedAt && parseInt(this.passwordChangedAt.getTime() / 1000, 10) > jwtIat;
};

export default mongoose.model('User', userSchema);
