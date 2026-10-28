import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Loader = () => (
  <div className="flex justify-center py-20">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
  </div>
);

export const ErrorBox = ({ children }) =>
  children ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</div> : null;

export function Stars({ value = 0, count, size = 'text-base' }) {
  const full = Math.round(value);
  return (
    <span className={`inline-flex items-center gap-1 ${size}`}>
      <span className="font-semibold text-amber-600">{value ? value.toFixed(1) : 'New'}</span>
      <span className="text-amber-500">{'★'.repeat(full)}<span className="text-slate-300">{'★'.repeat(5 - full)}</span></span>
      {count !== undefined && <span className="text-xs text-slate-500">({count})</span>}
    </span>
  );
}

export function StarInput({ value, onChange }) {
  return (
    <div className="flex gap-1 text-3xl">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className={n <= value ? 'text-amber-500' : 'text-slate-300'}>★</button>
      ))}
    </div>
  );
}

export function Protected({ roles, children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
