import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { Loader, ErrorBox } from '../components/Common';
import { fmtDuration, statusColor } from '../utils';

const empty = { title: '', subtitle: '', description: '', category: '', level: 'beginner', price: 0, discountPrice: '', thumbnail: '', tags: '', outcomes: '', requirements: '' };
const emptyLesson = { title: '', type: 'video', videoUrl: '', minutes: 5, isPreview: false, content: '' };
const sampleQuiz = JSON.stringify({ title: 'Course Completion Quiz', passMark: 70, questions: [{ question: 'Example question: what does HTML stand for?', options: ['Hyper Text Markup Language', 'High Transfer Machine Language', 'Home Tool Markup Language', 'Hyperlink Text Management Language'], correctAnswer: 0, explanation: 'HTML means Hyper Text Markup Language.' }] }, null, 2);

export default function CourseEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState(empty);
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(!!id);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [newSection, setNewSection] = useState('');
  const [lf, setLf] = useState(null); // lesson form {sectionId, lessonId?, ...}
  const [uploading, setUploading] = useState(false);
  const [quizJson, setQuizJson] = useState(sampleQuiz);
  const [quizSaving, setQuizSaving] = useState(false);

  const flash = (type, text) => setMsg({ type, text });

  const load = async () => {
    const { data } = await api.get(`/courses/${id}/edit`);
    const c = data.data.course;
    setCourse(c);
    setSections(data.data.sections);
    try { const q = await api.get(`/courses/${id}/quiz/manage`); if (q.data.data.quiz) setQuizJson(JSON.stringify({ title: q.data.data.quiz.title, passMark: q.data.data.quiz.passMark, questions: q.data.data.quiz.questions.map(({ question, options, correctAnswer, explanation }) => ({ question, options, correctAnswer, explanation })) }, null, 2)); } catch { /* quiz may not exist yet */ }
    setForm({
      title: c.title, subtitle: c.subtitle || '', description: c.description, category: c.category, level: c.level,
      price: c.price, discountPrice: c.discountPrice ?? '', thumbnail: c.thumbnail?.url || '',
      tags: (c.tags || []).join(', '), outcomes: (c.outcomes || []).join('\n'), requirements: (c.requirements || []).join('\n'),
    });
  };

  useEffect(() => {
    api.get('/categories').then(({ data }) => {
      setCats(data.data.categories);
      if (!id) setForm((f) => ({ ...f, category: data.data.categories[0]?._id || '' }));
    });
    if (id) load().catch((e) => flash('error', errMsg(e))).finally(() => setLoading(false));
  }, [id]); // eslint-disable-line

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'number' ? e.target.value : e.target.value });
  const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);

  const saveCourse = async (e) => {
    e.preventDefault(); flash('', '');
    const body = { ...form, price: Number(form.price) || 0, discountPrice: form.discountPrice === '' ? null : Number(form.discountPrice), outcomes: lines(form.outcomes), requirements: lines(form.requirements) };
    try {
      if (id) { await api.patch(`/courses/${id}`, body); await load(); flash('ok', 'Course saved'); }
      else { const { data } = await api.post('/courses', body); nav(`/instructor/courses/${data.data.course._id}`, { replace: true }); }
    } catch (e2) { flash('error', errMsg(e2)); }
  };

  const wrap = async (fn, okText) => {
    try { await fn(); await load(); if (okText) flash('ok', okText); } catch (e) { flash('error', errMsg(e)); }
  };

  const addSection = () => newSection.trim() && wrap(async () => { await api.post(`/courses/${id}/sections`, { title: newSection }); setNewSection(''); });
  const renameSection = (s) => { const t = window.prompt('Section title', s.title); if (t) wrap(() => api.patch(`/sections/${s._id}`, { title: t })); };
  const delSection = (s) => window.confirm('Delete this section and all its lessons?') && wrap(() => api.delete(`/sections/${s._id}`));
  const delLesson = (l) => window.confirm('Delete this lesson?') && wrap(() => api.delete(`/lessons/${l._id}`));

  const editLesson = (sectionId, l) => setLf({ sectionId, lessonId: l._id, title: l.title, type: l.type, videoUrl: l.video?.url || '', minutes: Math.round((l.video?.duration || 0) / 60), isPreview: l.isPreview, content: l.content || '' });
  const saveLesson = (e) => {
    e.preventDefault();
    const body = { title: lf.title, type: lf.type, videoUrl: lf.videoUrl, duration: Number(lf.minutes) * 60, isPreview: lf.isPreview, content: lf.content };
    wrap(async () => {
      if (lf.lessonId) await api.patch(`/lessons/${lf.lessonId}`, body);
      else await api.post(`/sections/${lf.sectionId}/lessons`, body);
      setLf(null);
    }, 'Lesson saved');
  };

  const upload = async (file, onDone) => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append('file', file);
    try { const { data } = await api.post('/uploads', fd); onDone(data.data); }
    catch (e) { flash('error', errMsg(e)); }
    setUploading(false);
  };

  const submit = () => wrap(() => api.post(`/courses/${id}/submit`), 'Submitted for admin review');
  const saveQuiz = async () => { setQuizSaving(true); try { const payload = JSON.parse(quizJson); await api.put(`/courses/${id}/quiz`, payload); flash('ok', 'Final quiz saved'); } catch (e) { flash('error', e.response ? errMsg(e) : 'Quiz JSON is invalid. Check commas, quotes, and the correctAnswer option index.'); } finally { setQuizSaving(false); } };

  if (loading) return <Loader />;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/instructor" className="text-sm text-indigo-600">← Dashboard</Link>
          <h1 className="text-2xl font-bold">{id ? 'Edit course' : 'Create a new course'}</h1>
        </div>
        {course && (
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[course.status]}`}>{course.status}</span>
            {(course.status === 'draft' || course.status === 'rejected') && <button className="btn btn-primary btn-sm" onClick={submit}>Submit for review</button>}
          </div>
        )}
      </div>

      {course?.status === 'rejected' && <ErrorBox>Rejected: {course.rejectionReason}</ErrorBox>}
      {msg.text && (msg.type === 'error' ? <ErrorBox>{msg.text}</ErrorBox> : <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{msg.text}</div>)}

      <form onSubmit={saveCourse} className="card grid gap-4 p-6 md:grid-cols-2">
        <h2 className="text-lg font-bold md:col-span-2">Course details</h2>
        <div className="md:col-span-2"><label className="label">Title</label><input className="input" required value={form.title} onChange={set('title')} /></div>
        <div className="md:col-span-2"><label className="label">Subtitle</label><input className="input" value={form.subtitle} onChange={set('subtitle')} /></div>
        <div><label className="label">Category</label>
          <select className="input" required value={form.category} onChange={set('category')}>{cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
        <div><label className="label">Level</label>
          <select className="input" value={form.level} onChange={set('level')}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="all">All levels</option></select></div>
        <div><label className="label">Price (USD, 0 = free)</label><input className="input" type="number" min="0" step="0.01" value={form.price} onChange={set('price')} /></div>
        <div><label className="label">Discount price (optional)</label><input className="input" type="number" min="0" step="0.01" value={form.discountPrice} onChange={set('discountPrice')} /></div>
        <div className="md:col-span-2">
          <label className="label">Thumbnail URL (or upload an image)</label>
          <div className="flex gap-2">
            <input className="input" placeholder="https://…" value={form.thumbnail} onChange={set('thumbnail')} />
            <label className="btn btn-outline cursor-pointer whitespace-nowrap">Upload<input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files[0], (r) => setForm({ ...form, thumbnail: r.url }))} /></label>
          </div>
        </div>
        <div className="md:col-span-2"><label className="label">Description</label><textarea className="input" rows={5} required value={form.description} onChange={set('description')} /></div>
        <div><label className="label">What students will learn (one per line)</label><textarea className="input" rows={4} value={form.outcomes} onChange={set('outcomes')} /></div>
        <div><label className="label">Requirements (one per line)</label><textarea className="input" rows={4} value={form.requirements} onChange={set('requirements')} /></div>
        <div className="md:col-span-2"><label className="label">Tags (comma separated)</label><input className="input" value={form.tags} onChange={set('tags')} /></div>
        <div className="md:col-span-2"><button className="btn btn-primary">{id ? 'Save changes' : 'Create course & add curriculum →'}</button></div>
      </form>

      {id && (
        <section className="card space-y-4 p-6">
          <h2 className="text-lg font-bold">Curriculum</h2>
          {sections.map((s) => (
            <div key={s._id} className="rounded-lg border border-slate-200">
              <div className="flex items-center justify-between bg-slate-50 px-4 py-2">
                <span className="font-semibold">{s.title}</span>
                <span className="flex gap-2">
                  <button className="btn btn-outline btn-sm" onClick={() => renameSection(s)}>Rename</button>
                  <button className="btn btn-outline btn-sm !text-red-600" onClick={() => delSection(s)}>Delete</button>
                </span>
              </div>
              <ul className="divide-y divide-slate-100">
                {s.lessons.map((l) => (
                  <li key={l._id} className="flex items-center justify-between px-4 py-2 text-sm">
                    <span>{l.type === 'video' ? '🎬' : '📄'} {l.title} {l.isPreview && <span className="ml-1 rounded bg-indigo-50 px-1.5 text-[10px] font-bold text-indigo-600">PREVIEW</span>} <span className="text-xs text-slate-500">{fmtDuration(l.video?.duration)}</span></span>
                    <span className="flex gap-2">
                      <button className="text-xs font-semibold text-indigo-600" onClick={() => editLesson(s._id, l)}>Edit</button>
                      <button className="text-xs font-semibold text-red-600" onClick={() => delLesson(l)}>Delete</button>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="p-3"><button className="btn btn-outline btn-sm" onClick={() => setLf({ sectionId: s._id, ...emptyLesson })}>+ Add lesson</button></div>
            </div>
          ))}
          <div className="flex gap-2">
            <input className="input" placeholder="New section title (e.g. Introduction)" value={newSection} onChange={(e) => setNewSection(e.target.value)} />
            <button className="btn btn-primary whitespace-nowrap" onClick={addSection}>+ Add section</button>
          </div>
        </section>
      )}

      {id && (
        <section className="card space-y-3 p-6">
          <div><h2 className="text-lg font-bold">Final quiz & certificate</h2><p className="mt-1 text-sm text-slate-500">Students must complete every lesson and pass this quiz before receiving a certificate. Configure questions as JSON; correctAnswer is a zero-based option index (first option = 0).</p></div>
          <textarea className="input min-h-72 font-mono text-xs" spellCheck="false" value={quizJson} onChange={e => setQuizJson(e.target.value)} />
          <button type="button" className="btn btn-primary" disabled={quizSaving} onClick={saveQuiz}>{quizSaving ? 'Saving…' : 'Save final quiz'}</button>
        </section>
      )}

      {lf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={saveLesson} className="card max-h-[90vh] w-full max-w-lg space-y-3 overflow-y-auto p-6">
            <h3 className="text-lg font-bold">{lf.lessonId ? 'Edit lesson' : 'New lesson'}</h3>
            <div><label className="label">Title</label><input className="input" required value={lf.title} onChange={(e) => setLf({ ...lf, title: e.target.value })} /></div>
            <div><label className="label">Type</label>
              <select className="input" value={lf.type} onChange={(e) => setLf({ ...lf, type: e.target.value })}><option value="video">Video</option><option value="article">Article</option></select></div>
            {lf.type === 'video' ? (
              <>
                <div>
                  <label className="label">Video URL (MP4 upload or YouTube link)</label><p className="text-xs text-slate-500">Paste a YouTube watch, youtu.be, or Shorts URL to embed the lesson.</p>
                  <input className="input" placeholder="MP4 URL or YouTube URL (youtube.com/watch?v=...)" value={lf.videoUrl} onChange={(e) => setLf({ ...lf, videoUrl: e.target.value })} />
                  <label className="btn btn-outline btn-sm mt-2 cursor-pointer">{uploading ? 'Uploading…' : '⬆ Upload video'}
                    <input type="file" accept="video/*" hidden disabled={uploading} onChange={(e) => upload(e.target.files[0], (r) => setLf((x) => ({ ...x, videoUrl: r.url, minutes: r.duration ? Math.max(1, Math.round(r.duration / 60)) : x.minutes })))} /></label>
                </div>
                <div><label className="label">Duration (minutes)</label><input className="input" type="number" min="0" value={lf.minutes} onChange={(e) => setLf({ ...lf, minutes: e.target.value })} /></div>
              </>
            ) : (
              <div><label className="label">Content</label><textarea className="input" rows={6} value={lf.content} onChange={(e) => setLf({ ...lf, content: e.target.value })} /></div>
            )}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={lf.isPreview} onChange={(e) => setLf({ ...lf, isPreview: e.target.checked })} /> Free preview (visible to non-enrolled users)</label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn btn-outline" onClick={() => setLf(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={uploading}>Save lesson</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
