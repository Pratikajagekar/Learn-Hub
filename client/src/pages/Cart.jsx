import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { ErrorBox } from '../components/Common';
import { Thumb } from '../components/CourseCard';
import { money } from '../utils';

export default function Cart() {
  const { cart, setCart } = useAuth();
  const nav = useNavigate();
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const total = cart.reduce((s, c) => s + (c.discountPrice ?? c.price), 0);
  const original = cart.reduce((s, c) => s + c.price, 0);

  const remove = async (id) => {
    const { data } = await api.delete(`/cart/${id}`);
    setCart(data.data.cart);
  };
  const checkout = async () => {
    setBusy(true); setErr('');
    try {
      const { data } = await api.post('/payments/checkout', {});
      if (data.data.url) window.location.href = data.data.url;
      else nav(`/payment/success?order=${data.data.orderId}`);
    } catch (e) { setErr(errMsg(e)); setBusy(false); }
  };

  if (cart.length === 0)
    return (
      <div className="py-20 text-center">
        <div className="text-5xl">🛒</div>
        <p className="mt-3 text-slate-500">Your cart is empty.</p>
        <Link to="/courses" className="btn btn-primary mt-4">Browse courses</Link>
      </div>
    );

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Shopping cart ({cart.length})</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card divide-y divide-slate-200">
          {cart.map((c) => (
            <div key={c._id} className="flex gap-4 p-4">
              <Thumb course={c} className="h-20 w-36 shrink-0 rounded-lg text-xs" />
              <div className="flex-1">
                <Link to={`/courses/${c.slug}`} className="font-semibold hover:text-indigo-600">{c.title}</Link>
                <p className="text-xs text-slate-500">By {c.instructor?.name}</p>
                <button onClick={() => remove(c._id)} className="mt-2 text-xs font-semibold text-red-600">Remove</button>
              </div>
              <div className="text-right font-bold">{money(c.discountPrice ?? c.price)}</div>
            </div>
          ))}
        </div>
        <aside className="card h-fit space-y-3 p-5">
          <div className="text-sm text-slate-500">Total</div>
          <div className="text-3xl font-extrabold">{money(total)}</div>
          {original > total && <div className="text-sm text-slate-400 line-through">{money(original)}</div>}
          <ErrorBox>{err}</ErrorBox>
          <button className="btn btn-primary w-full" disabled={busy} onClick={checkout}>{busy ? 'Processing…' : 'Checkout'}</button>
          <p className="text-xs text-slate-500">Without Stripe keys configured, checkout runs in demo mode: enrollment is instant and no money is charged.</p>
        </aside>
      </div>
    </div>
  );
}
