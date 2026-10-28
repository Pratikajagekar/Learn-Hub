export const money = (n) => (!n ? 'Free' : `$${Number(n).toFixed(2)}`);

export const fmtDuration = (s = 0) => {
  if (s < 60) return `${Math.round(s)}s`;
  const m = Math.round(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};

export const fmtTime = (s = 0) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};

export const statusColor = {
  published: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  draft: 'bg-slate-100 text-slate-600',
  rejected: 'bg-red-100 text-red-700',
  archived: 'bg-slate-200 text-slate-600',
};
