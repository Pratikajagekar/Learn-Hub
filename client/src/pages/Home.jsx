import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import CourseCard from '../components/CourseCard';
import { Loader } from '../components/Common';

export default function Home() {
  const [popular, setPopular] = useState(null);
  const [top, setTop] = useState([]);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    api.get('/courses', { params: { sort: 'popular', limit: 8 } }).then(({ data }) => setPopular(data.data.courses));
    api.get('/courses', { params: { sort: 'rating', limit: 4 } }).then(({ data }) => setTop(data.data.courses));
    api.get('/categories').then(({ data }) => setCats(data.data.categories));
  }, []);

  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-14 text-white md:px-12">
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight md:text-5xl">Learn new skills. Build your future.</h1>
        <p className="mt-3 max-w-xl text-indigo-100">Thousands of video lessons taught by expert instructors. Learn at your own pace, track progress and earn certificates.</p>
        <form onSubmit={(e) => { e.preventDefault(); nav(`/courses?q=${encodeURIComponent(q)}`); }} className="mt-6 flex max-w-xl gap-2">
          <input className="input !border-0 text-slate-800" placeholder="What do you want to learn?" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn bg-slate-900 text-white hover:bg-slate-800">Search</button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">Browse categories</h2>
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <Link key={c._id} to={`/courses?category=${c.slug}`} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:border-indigo-500 hover:text-indigo-600">{c.name}</Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Most popular</h2>
          <Link to="/courses" className="text-sm font-semibold text-indigo-600">View all →</Link>
        </div>
        {!popular ? <Loader /> : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{popular.map((c) => <CourseCard key={c._id} course={c} />)}</div>
        )}
      </section>

      {top.length > 0 && (
        <section>
          <h2 className="mb-4 text-2xl font-bold">Top rated</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{top.map((c) => <CourseCard key={c._id} course={c} />)}</div>
        </section>
      )}
    </div>
  );
}
