import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { Loader, ErrorBox } from '../components/Common';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const { refreshCart } = useAuth();
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/payments/verify', { params: { order: params.get('order') } })
      .then(({ data }) => { setOrder(data.data.order); refreshCart(); })
      .catch((e) => setErr(errMsg(e)));
  }, []); // eslint-disable-line

  if (err) return <ErrorBox>{err}</ErrorBox>;
  if (!order) return <Loader />;
  const paid = order.status === 'paid';
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="text-6xl">{paid ? '🎉' : '⏳'}</div>
      <h1 className="mt-4 text-2xl font-bold">{paid ? 'Enrollment successful!' : 'Payment not confirmed yet'}</h1>
      <p className="mt-2 text-slate-500">{paid ? `You now have access to ${order.items.length} course(s).` : 'If you were charged, refresh in a moment.'}</p>
      <Link to="/my-learning" className="btn btn-primary mt-6">Start learning</Link>
    </div>
  );
}
