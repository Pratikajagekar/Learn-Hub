import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [
      {
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
        instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        title: String, // snapshot, in case the course changes later
        price: { type: Number, required: true }, // price paid at purchase time
        platformFee: { type: Number, default: 0 },
        instructorEarning: { type: Number, default: 0 },
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'USD' },

    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    payment: {
      provider: { type: String, enum: ['stripe', 'razorpay', 'free', 'demo'], default: 'stripe' },
      sessionId: { type: String, index: true }, // Stripe Checkout session
      paymentIntentId: String,
      receiptUrl: String,
    },
    paidAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
