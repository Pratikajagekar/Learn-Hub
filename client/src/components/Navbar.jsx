import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, cart, logout } = useAuth();
  const [q, setQ] = useState('');
  const nav = useNavigate();

  const search = (e) => {
    e.preventDefault();
    nav(`/courses?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Link to="/" className="text-xl font-extrabold text-indigo-600">🎓 LearnHub</Link>
        <Link to="/courses" className="hidden text-sm font-medium hover:text-indigo-600 sm:block">Courses</Link>
        <form onSubmit={search} className="flex-1">
          <input className="input !rounded-full" placeholder="Search for anything…" value={q} onChange={(e) => setQ(e.target.value)} />
        </form>
        {user?.role === 'instructor' && <Link to="/instructor" className="hidden text-sm font-medium hover:text-indigo-600 md:block">Instructor</Link>}
        {user?.role === 'admin' && <Link to="/admin" className="hidden text-sm font-medium hover:text-indigo-600 md:block">Admin</Link>}
        {user && <Link to="/my-learning" className="hidden text-sm font-medium hover:text-indigo-600 md:block">My learning</Link>}
        <Link to="/cart" className="relative text-xl" title="Cart">
          🛒
          {cart.length > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">{cart.length}</span>}
        </Link>
        {user ? (
          <details className="relative">
            <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
              {user.name[0].toUpperCase()}
            </summary>
            <div className="card absolute right-0 mt-2 w-52 p-2 text-sm">
              <div className="border-b border-slate-100 px-3 py-2">
                <div className="font-semibold">{user.name}</div>
                <div className="text-xs capitalize text-slate-500">{user.role}</div>
              </div>
              <Link to="/my-learning" className="block rounded px-3 py-2 hover:bg-slate-50">My learning</Link>
              {user.role === 'instructor' && <Link to="/instructor" className="block rounded px-3 py-2 hover:bg-slate-50">Instructor dashboard</Link>}
              {user.role === 'admin' && <Link to="/admin" className="block rounded px-3 py-2 hover:bg-slate-50">Admin dashboard</Link>}
              <button onClick={async () => { await logout(); nav('/'); }} className="block w-full rounded px-3 py-2 text-left text-red-600 hover:bg-slate-50">Log out</button>
            </div>
          </details>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline btn-sm">Log in</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
          </>
        )}
      </div>
    </header>
  );
}
