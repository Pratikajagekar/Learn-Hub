import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { Loader, ErrorBox } from '../components/Common';
import { money, statusColor } from '../utils';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const tabs = ['overview', 'courses', 'users', 'categories'];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      <div className="flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-semibold capitalize ${tab === t ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>{t}</button>
        ))}
      </div>
      {tab === 'overview' && <Overview />}
      {tab === 'courses' && <CoursesTab />}
      {tab === 'users' && <UsersTab me={user} />}
      {tab === 'categories' && <CategoriesTab />}
    </div>
  );
}

function Overview() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/admin/stats').then(({ data }) => setS(data.data.stats)); }, []);
  if (!s) return <Loader />;
  const cards = [['Users', s.users], ['Courses', s.courses], ['Enrollments', s.enrollments], ['Orders', s.orders], ['Revenue', `$${s.revenue.toFixed(2)}`]];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([l, v]) => <div key={l} className="card p-5"><div className="text-sm text-slate-500">{l}</div><div className="mt-1 text-3xl font-extrabold">{v}</div></div>)}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5"><h3 className="mb-2 font-bold">Users by role</h3>{s.byRole.map((r) => <div key={r._id} className="flex justify-between text-sm capitalize"><span>{r._id}</span><b>{r.count}</b></div>)}</div>
        <div className="card p-5"><h3 className="mb-2 font-bold">Courses by status</h3>{s.byStatus.map((r) => <div key={r._id} className="flex justify-between text-sm capitalize"><span>{r._id}</span><b>{r.count}</b></div>)}</div>
      </div>
    </div>
  );
}

function CoursesTab() {
  const [status, setStatus] = useState('pending');
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  const load = () => { setList(null); api.get('/admin/courses', { params: { status } }).then(({ data }) => setList(data.data.courses)); };
  useEffect(load, [status]); // eslint-disable-line

  const act = async (fn) => { try { await fn(); load(); } catch (e) { setErr(errMsg(e)); } };
  const approve = (c) => act(() => api.patch(`/admin/courses/${c._id}/approve`));
  const reject = (c) => { const reason = window.prompt('Reason for rejection:'); if (reason !== null) act(() => api.patch(`/admin/courses/${c._id}/reject`, { reason })); };

  return (
    <div className="space-y-4">
      <ErrorBox>{err}</ErrorBox>
      <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
        {['pending', 'published', 'rejected', 'draft', 'archived'].map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      {!list ? <Loader /> : (
        <div className="card divide-y divide-slate-100">
          {list.map((c) => (
            <div key={c._id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <Link to={`/courses/${c.slug}`} className="font-semibold hover:text-indigo-600">{c.title}</Link>
                <div className="text-xs text-slate-500">{c.instructor?.name} · {c.category?.name} · {c.totalLessons} lessons · {money(c.price)}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor[c.status]}`}>{c.status}</span>
              {c.status !== 'published' && <button className="btn btn-primary btn-sm" onClick={() => approve(c)}>Approve</button>}
              {c.status !== 'rejected' && <button className="btn btn-outline btn-sm !text-red-600" onClick={() => reject(c)}>Reject</button>}
            </div>
          ))}
          {list.length === 0 && <div className="p-8 text-center text-slate-500">No {status} courses.</div>}
        </div>
      )}
    </div>
  );
}

function UsersTab({ me }) {
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  const load = () => api.get('/admin/users').then(({ data }) => setList(data.data.users));
  useEffect(() => { load(); }, []);
  const patch = async (u, body) => { try { await api.patch(`/admin/users/${u._id}`, body); load(); } catch (e) { setErr(errMsg(e)); } };
  if (!list) return <Loader />;
  return (
    <div className="space-y-3">
      <ErrorBox>{err}</ErrorBox>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((u) => (
              <tr key={u._id}>
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <select className="input !w-auto !py-1" value={u.role} disabled={u._id === me._id} onChange={(e) => patch(u, { role: e.target.value })}>
                    <option value="student">student</option><option value="instructor">instructor</option><option value="admin">admin</option>
                  </select>
                </td>
                <td className="p-3">{u.isActive ? <span className="text-green-600">Active</span> : <span className="text-red-600">Deactivated</span>}</td>
                <td className="p-3 text-right">{u._id !== me._id && <button className="btn btn-outline btn-sm" onClick={() => patch(u, { isActive: !u.isActive })}>{u.isActive ? 'Deactivate' : 'Activate'}</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoriesTab() {
  const [list, setList] = useState(null);
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const load = () => api.get('/categories').then(({ data }) => setList(data.data.categories));
  useEffect(() => { load(); }, []);
  const add = async (e) => { e.preventDefault(); try { await api.post('/categories', { name }); setName(''); setErr(''); load(); } catch (e2) { setErr(errMsg(e2)); } };
  const del = async (c) => { try { await api.delete(`/categories/${c._id}`); load(); } catch (e) { setErr(errMsg(e)); } };
  if (!list) return <Loader />;
  return (
    <div className="max-w-lg space-y-4">
      <ErrorBox>{err}</ErrorBox>
      <form onSubmit={add} className="flex gap-2"><input className="input" placeholder="New category name" required value={name} onChange={(e) => setName(e.target.value)} /><button className="btn btn-primary">Add</button></form>
      <div className="card divide-y divide-slate-100">
        {list.map((c) => <div key={c._id} className="flex items-center justify-between p-3 text-sm"><span>{c.name} <span className="text-xs text-slate-400">/{c.slug}</span></span><button className="text-xs font-semibold text-red-600" onClick={() => del(c)}>Delete</button></div>)}
      </div>
    </div>
  );
}
