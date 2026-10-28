import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';
import { ErrorBox } from '../components/Common';

function Shell({ title, children, footer }) {
  return (
    <div className="mx-auto max-w-md py-10">
      <div className="card p-8">
        <h1 className="mb-6 text-center text-2xl font-bold">{title}</h1>
        {children}
      </div>
      <p className="mt-4 text-center text-sm text-slate-600">{footer}</p>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const u = await login(f.email, f.password);
      nav(loc.state?.from || (u.role === 'admin' ? '/admin' : u.role === 'instructor' ? '/instructor' : '/my-learning'), { replace: true });
    } catch (e2) { setErr(errMsg(e2)); setBusy(false); }
  };
  const fill = (email, password) => setF({ email, password });

  return (
    <Shell title="Welcome back" footer={<>New here? <Link to="/register" className="font-semibold text-indigo-600">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox>{err}</ErrorBox>
        <div><label className="label">Email</label><input className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div><label className="label">Password</label><input className="input" type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
      <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
        <p className="mb-2 font-semibold">Demo accounts (click to fill):</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => fill('student@lms.com', 'student123')}>Student</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => fill('instructor@lms.com', 'instructor123')}>Instructor</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => fill('admin@lms.com', 'admin123')}>Admin</button>
        </div>
      </div>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'student' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const u = await register(f);
      nav(u.role === 'instructor' ? '/instructor' : '/courses', { replace: true });
    } catch (e2) { setErr(errMsg(e2)); setBusy(false); }
  };

  return (
    <Shell title="Create your account" footer={<>Already registered? <Link to="/login" className="font-semibold text-indigo-600">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBox>{err}</ErrorBox>
        <div><label className="label">Full name</label><input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="label">Email</label><input className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div><label className="label">Password (min 8 characters)</label><input className="input" type="password" minLength={8} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        <div>
          <label className="label">I want to</label>
          <select className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
            <option value="student">Learn (Student)</option>
            <option value="instructor">Teach (Instructor)</option>
          </select>
        </div>
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
      </form>
    </Shell>
  );
}
