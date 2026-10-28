import Enrollment from '../models/Enrollment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

// Idempotent: safe to call twice for the same order
export async function fulfillOrder(order, paymentPatch = {}) {
  if (order.status === 'paid') return order;
  order.status = 'paid';
  order.paidAt = new Date();
  for (const [k, v] of Object.entries(paymentPatch)) order.set(`payment.${k}`, v);
  await order.save();

  for (const item of order.items) {
    try {
      await Enrollment.create({ student: order.user, course: item.course, order: order._id });
      await Course.findByIdAndUpdate(item.course, { $inc: { enrollmentCount: 1 } });
    } catch (e) {
      if (e.code !== 11000) throw e; // already enrolled
    }
    await User.findByIdAndUpdate(item.instructor, {
      $inc: { 'earnings.total': item.instructorEarning, 'earnings.pending': item.instructorEarning },
    });
  }
  await User.findByIdAndUpdate(order.user, { $pull: { cart: { $in: order.items.map((i) => i.course) } } });
  return order;
}
