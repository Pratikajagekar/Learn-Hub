import mongoose from 'mongoose';
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  options: { type: [String], validate: v => v.length >= 2 },
  correctAnswer: { type: Number, required: true, min: 0 },
  explanation: { type: String, default: '' },
});
const quizSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, unique: true, index: true },
  title: { type: String, default: 'Course Completion Quiz' },
  passMark: { type: Number, default: 70, min: 1, max: 100 },
  questions: { type: [questionSchema], default: [] },
}, { timestamps: true });
export default mongoose.model('Quiz', quizSchema);
