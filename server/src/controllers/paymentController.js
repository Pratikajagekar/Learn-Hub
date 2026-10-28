import Stripe from 'stripe';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Order from '../models/Order.js';
import Enrollment from '../models/Enrollment.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { fulfillOrder } from '../services/orderService.js';

const stripe = () => (process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null);

// POST /payments/checkout  body: { courseIds?: [] }  (defaults to the whole cart)
export const checkout = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  const ids = Array.isArray(req.body.courseIds) && req.body.courseIds.length ? req.body.courseIds : user.cart;
  const courses = await Course.find({ _id: { $in: ids }, status: 'published' });
  const owned = new Set((await Enrollment.find({ student: user._id, course: { $in: courses.map((c) => c._id) } })).map((e) => String(e.course)));
  const buyable = courses.filter((c) => !owned.has(String(c._id)) && String(c.instructor) !== String(user._id));
  if (!buyable.length) throw new AppError('Nothing to purchase', 400);

  const feePct = Number(process.env.PLATFORM_FEE_PERCENT || 20) / 100;
  const items = buyable.map((c) => {
    const price = c.discountPrice ?? c.price;
    const platformFee = +(price * feePct).toFixed(2);
    return { course: c._id, instructor: c.instructor, title: c.title, price, platformFee, instructorEarning: +(price - platformFee).toFixed(2) };
  });
  const subtotal = buyable.reduce((s, c) => s + c.price, 0);
  const total = items.reduce((s, i) => s + i.price, 0);
  const currency = (process.env.CURRENCY || 'usd').toLowerCase();
  const s = stripe();
  const provider = total === 0 ? 'free' : s ? 'stripe' : 'demo';

  const order = await Order.create({ user: user._id, items, subtotal, discount: subtotal - total, total, currency, payment: { provider } });

  if (provider !== 'stripe') {
    await fulfillOrder(order);
    return res.json({ status: 'success', data: { orderId: order._id, demo: true } });
  }

  const session = await s.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: items.filter((i) => i.price > 0).map((i) => ({
      quantity: 1,
      price_data: { currency, product_data: { name: i.title }, unit_amount: Math.round(i.price * 100) },
    })),
    metadata: { orderId: String(order._id) },
    success_url: `${process.env.CLIENT_URL}/payment/success?order=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/cart`,
  });
  order.set('payment.sessionId', session.id);
  await order.save();
  res.json({ status: 'success', data: { orderId: order._id, url: session.url } });
});

// GET /payments/verify?order=ID&session_id=...  (called by the success page)
export const verify = catchAsync(async (req, res) => {
  const order = await Order.findOne({ _id: req.query.order, user: req.user._id });
  if (!order) throw new AppError('Order not found', 404);
  const s = stripe();
  if (order.status !== 'paid' && s && order.payment.sessionId) {
    const session = await s.checkout.sessions.retrieve(order.payment.sessionId);
    if (session.payment_status === 'paid') {
      await fulfillOrder(order, { paymentIntentId: session.payment_intent });
    }
  }
  res.json({ status: 'success', data: { order } });
});

export const myOrders = catchAsync(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
  res.json({ status: 'success', data: { orders } });
});
