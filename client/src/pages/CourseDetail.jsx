import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { Loader, Stars, ErrorBox } from '../components/Common';
import { Thumb } from '../components/CourseCard';
import { money, fmtDuration } from '../utils';

export default function CourseDetail() {
  const { slug } = useParams();
  const { user, cart, refreshCart } = useAuth();
  const nav = useNavigate();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    setD(null);
    api.get(`/courses/slug/${slug}`).then(({ data }) => setD(data.data)).catch((e) => setErr(errMsg(e)));
  }, [slug, user?._id]);

  if (err) return <ErrorBox>{err}</ErrorBox>;
  if (!d) return <Loader />;
  const { course, sections, reviews, isEnrolled, isOwner } = d;
  const price = course.discountPrice ?? course.price;
  const inCart = cart.some((c) => c._id === course._id);
  const totalLessons = sections.reduce((s, x) => s + x.lessons.length, 0);

  const needLogin = () => { nav('/login', { state: { from: `/courses/${slug}` } }); };
  const addToCart = async () => {
    if (!user) return needLogin();
    setBusy(true);
    try { await api.post(`/cart/${course._id}`); await refreshCart(); } catch (e) { setErr(errMsg(e)); }
    setBusy(false);
  };
  const buyNow = async () => {
    if (!user) return needLogin();
    setBusy(true);
    try {
      const { data } = await api.post('/payments/checkout', { courseIds: [course._id] });
      if (data.data.url) window.location.href = data.data.url;
      else nav(`/payment/success?order=${data.data.orderId}`);
    } catch (e) { setErr(errMsg(e)); setBusy(false); }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-slate-900 p-6 text-white md:p-10">
        <div className="grid gap-6 md:grid-cols-[1fr_340px]">
          <div className="space-y-3">
            {course.status !== 'published' && <span className="rounded bg-amber-400 px-2 py-1 text-xs font-bold uppercase text-slate-900">{course.status}</span>}
            <h1 className="text-3xl font-extrabold">{course.title}</h1>
            <p className="text-slate-300">{course.subtitle}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
              <span className="text-amber-400"><Stars value={course.ratingAverage} count={course.ratingCount} /></span>
              <span>{course.enrollmentCount} students</span>
              <span className="capitalize">{course.level} level</span>
            </div>
            <p className="text-sm text-slate-300">Created by <span className="font-semibold text-indigo-300">{course.instructor?.name}</span> · {course.category?.name}</p>
          </div>

          <aside className="card overflow-hidden text-slate-800 md:-mb-20">
            <Thumb course={course} className="aspect-video w-full" />
            <div className="space-y-3 p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold">{money(price)}</span>
                {course.discountPrice != null && course.discountPrice < course.price && <span className="text-slate-400 line-through">{money(course.price)}</span>}
              </div>
              <ErrorBox>{err}</ErrorBox>
              {isEnrolled ? (
                <Link to={`/learn/${course._id}`} className="btn btn-primary w-full">Go to course</Link>
              ) : isOwner ? (
                <>
                  <Link to={`/instructor/courses/${course._id}`} className="btn btn-primary w-full">Edit course</Link>
                  <Link to={`/learn/${course._id}`} className="btn btn-outline w-full">Preview as student</Link>
                </>
              ) : (
                <>
                  <button className="btn btn-primary w-full" disabled={busy} onClick={buyNow}>{price === 0 ? 'Enroll for free' : 'Buy now'}</button>
                  {price > 0 && (inCart
                    ? <Link to="/cart" className="btn btn-outline w-full">Go to cart</Link>
                    : <button className="btn btn-outline w-full" disabled={busy} onClick={addToCart}>Add to cart</button>)}
                </>
              )}
              <ul className="space-y-1 pt-2 text-sm text-slate-600">
                <li>🎬 {totalLessons} lessons · {fmtDuration(course.totalDuration)}</li>
                <li>♾️ Full lifetime access</li>
                <li>🏆 Certificate of completion</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <div className="max-w-3xl space-y-8">
        {course.outcomes?.length > 0 && (
          <section className="card p-6">
            <h2 className="mb-3 text-xl font-bold">What you'll learn</h2>
            <ul className="grid gap-2 sm:grid-cols-2">{course.outcomes.map((o, i) => <li key={i} className="flex gap-2 text-sm"><span className="text-green-600">✓</span>{o}</li>)}</ul>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-xl font-bold">Course content</h2>
          <p className="mb-2 text-sm text-slate-500">{sections.length} sections · {totalLessons} lessons · {fmtDuration(course.totalDuration)}</p>
          <div className="card divide-y divide-slate-200">
            {sections.map((s) => (
              <details key={s._id} open className="group">
                <summary className="cursor-pointer bg-slate-50 px-4 py-3 font-semibold">{s.title} <span className="text-xs font-normal text-slate-500">· {s.lessons.length} lessons</span></summary>
                <ul className="divide-y divide-slate-100">
                  {s.lessons.map((l) => (
                    <li key={l._id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="flex items-center gap-2">
                        {l.isPreview || isEnrolled || isOwner ? '▶️' : '🔒'}
                        {l.isPreview && !isEnrolled && !isOwner
                          ? <button className="text-indigo-600 underline" onClick={() => setPreview(l)}>{l.title}</button>
                          : l.title}
                        {l.isPreview && !isEnrolled && <span className="rounded bg-indigo-50 px-1.5 text-[10px] font-bold text-indigo-600">PREVIEW</span>}
                      </span>
                      <span className="text-slate-500">{fmtDuration(l.video?.duration)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </section>

        {course.requirements?.length > 0 && (
          <section>
            <h2 className="mb-2 text-xl font-bold">Requirements</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm">{course.requirements.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-xl font-bold">Description</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{course.description}</p>
        </section>

        <section className="card flex gap-4 p-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white">{course.instructor?.name?.[0]}</div>
          <div>
            <h3 className="font-bold">{course.instructor?.name}</h3>
            <p className="text-sm text-indigo-600">{course.instructor?.headline}</p>
            <p className="mt-1 text-sm text-slate-600">{course.instructor?.bio}</p>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">Student reviews</h2>
          {reviews.length === 0 ? <p className="text-sm text-slate-500">No reviews yet.</p> : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r._id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{r.student?.name}</span>
                    <Stars value={r.rating} size="text-sm" />
                  </div>
                  <p className="mt-1 text-sm text-slate-700">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreview(null)}>
          <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-black" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between bg-slate-900 px-4 py-2 text-sm text-white">
              <span>Preview: {preview.title}</span>
              <button onClick={() => setPreview(null)}>✕</button>
            </div>
            <video src={preview.video?.url} controls autoPlay className="aspect-video w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
