import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Loader } from '../components/Common';
import { money, statusColor } from '../utils';

const Stat = ({ label, value }) => (
  <div className="card p-5"><div className="text-sm text-slate-500">{label}</div><div className="mt-1 text-3xl font-extrabold">{value}</div></div>
);

export default function InstructorDashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/instructor/dashboard').then(({ data }) => setD(data.data)); }, []);
  if (!d) return <Loader />;
  const { stats, courses, recentSales } = d;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Instructor dashboard</h1>
        <Link to="/instructor/courses/new" className="btn btn-primary">+ New course</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total earnings" value={money(stats.earnings.total) === 'Free' ? '$0.00' : money(stats.earnings.total)} />
        <Stat label="Total students" value={stats.students} />
        <Stat label="Courses" value={stats.courses} />
        <Stat label="Avg. rating" value={stats.avgRating || '–'} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">My courses</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="p-3">Course</th><th className="p-3">Status</th><th className="p-3">Students</th><th className="p-3">Rating</th><th className="p-3">Price</th><th className="p-3" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((c) => (
                <tr key={c._id}>
                  <td className="p-3 font-medium">{c.title}</td>
                  <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[c.status]}`}>{c.status}</span></td>
                  <td className="p-3">{c.enrollmentCount}</td>
                  <td className="p-3">{c.ratingCount ? `${c.ratingAverage} (${c.ratingCount})` : '–'}</td>
                  <td className="p-3">{money(c.discountPrice ?? c.price)}</td>
                  <td className="p-3 text-right"><Link to={`/instructor/courses/${c._id}`} className="btn btn-outline btn-sm">Edit</Link></td>
                </tr>
              ))}
              {courses.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">No courses yet. Create your first one!</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Recent sales</h2>
        <div className="card divide-y divide-slate-100 text-sm">
          {recentSales.map((s, i) => (
            <div key={i} className="flex justify-between p-3"><span>{s.title}</span><span className="text-slate-500">{new Date(s.paidAt).toLocaleDateString()}</span><span className="font-semibold text-green-600">+{money(s.earning) === 'Free' ? '$0.00' : money(s.earning)}</span></div>
          ))}
          {recentSales.length === 0 && <div className="p-6 text-center text-slate-500">No sales yet.</div>}
        </div>
        <p className="mt-2 text-xs text-slate-500">Earnings shown after the platform fee ({'20%'} by default).</p>
      </section>
    </div>
  );
}
