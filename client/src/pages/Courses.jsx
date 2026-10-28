import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import CourseCard from '../components/CourseCard';
import { Loader } from '../components/Common';

const PRICES = {
  '': {},
  free: { maxPrice: 0 },
  under50: { maxPrice: 50 },
  over50: { minPrice: 50 },
};

export default function Courses() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [cats, setCats] = useState([]);
  const query = Object.fromEntries(params);
  const priceKey = Object.keys(PRICES).find((k) => k && Object.entries(PRICES[k]).every(([a, b]) => String(query[a]) === String(b))) || '';

  useEffect(() => { api.get('/categories').then(({ data }) => setCats(data.data.categories)); }, []);
  useEffect(() => {
    setData(null);
    api.get('/courses', { params: query }).then(({ data }) => setData(data.data));
  }, [params]); // eslint-disable-line

  const set = (patch) => {
    const next = { ...query, ...patch, page: 1 };
    Object.keys(next).forEach((k) => (next[k] === '' || next[k] === undefined) && delete next[k]);
    setParams(next);
  };
  const setPrice = (k) => set({ minPrice: undefined, maxPrice: undefined, ...PRICES[k] });

  return (
    <div className="grid gap-6 md:grid-cols-[240px_1fr]">
      <aside className="card h-fit space-y-4 p-4">
        <div>
          <label className="label">Category</label>
          <select className="input" value={query.category || ''} onChange={(e) => set({ category: e.target.value })}>
            <option value="">All</option>
            {cats.map((c) => <option key={c._id} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Level</label>
          <select className="input" value={query.level || ''} onChange={(e) => set({ level: e.target.value })}>
            <option value="">All levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label className="label">Price</label>
          <select className="input" value={priceKey} onChange={(e) => setPrice(e.target.value)}>
            <option value="">Any</option>
            <option value="free">Free</option>
            <option value="under50">Under $50</option>
            <option value="over50">$50 and above</option>
          </select>
        </div>
        <div>
          <label className="label">Minimum rating</label>
          <select className="input" value={query.rating || ''} onChange={(e) => set({ rating: e.target.value })}>
            <option value="">Any</option>
            <option value="4.5">4.5 & up</option>
            <option value="4">4.0 & up</option>
            <option value="3">3.0 & up</option>
          </select>
        </div>
        <button className="btn btn-outline w-full" onClick={() => setParams({})}>Clear filters</button>
      </aside>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">
            {query.q ? `Results for “${query.q}”` : 'All courses'}
            {data && <span className="ml-2 text-base font-normal text-slate-500">({data.total})</span>}
          </h1>
          <select className="input !w-auto" value={query.sort || 'popular'} onChange={(e) => set({ sort: e.target.value })}>
            <option value="popular">Most popular</option>
            <option value="rating">Highest rated</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>
        {!data ? <Loader /> : data.courses.length === 0 ? (
          <p className="py-16 text-center text-slate-500">No courses found. Try different filters.</p>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{data.courses.map((c) => <CourseCard key={c._id} course={c} />)}</div>
            {data.pages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setParams({ ...query, page: p })} className={`btn btn-sm ${p === data.page ? 'btn-primary' : 'btn-outline'}`}>{p}</button>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
