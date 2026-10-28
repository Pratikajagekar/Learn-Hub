import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { Loader, ErrorBox, StarInput } from '../components/Common';
import { fmtDuration, fmtTime } from '../utils';

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
function youtubeEmbed(url = '') {
  try { const u = new URL(url); let id = ''; if (u.hostname.endsWith('youtu.be')) id = u.pathname.slice(1); else if (u.hostname.includes('youtube.com')) id = u.searchParams.get('v') || u.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1] || ''; return /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null; } catch { return null; }
}

export default function Learn() {
  const { courseId } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [current, setCurrent] = useState(null);
  const [rate, setRate] = useState(1);
  const [autoplay, setAutoplay] = useState(false);
  const [rv, setRv] = useState({ rating: 0, comment: '' });
  const [rvMsg, setRvMsg] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);
  const [quizMsg, setQuizMsg] = useState('');
  const [quizLoading, setQuizLoading] = useState(false);
  const videoRef = useRef(null);
  const pendingSeek = useRef(null);
  const lastSave = useRef(0);

  const lessons = useMemo(() => (data ? data.sections.flatMap((s) => s.lessons) : []), [data]);
  const enrollment = data?.enrollment;
  const done = useMemo(() => new Set((enrollment?.completedLessons || []).map(String)), [enrollment]);

  useEffect(() => {
    api.get(`/learn/${courseId}`).then(({ data: res }) => {
      const d = res.data;
      setData(d);
      if (d.myReview) setRv({ rating: d.myReview.rating, comment: d.myReview.comment || '' });
      const all = d.sections.flatMap((s) => s.lessons);
      const doneSet = new Set((d.enrollment?.completedLessons || []).map(String));
      const lw = d.enrollment?.lastWatched;
      const start = all.find((l) => l._id === lw?.lesson) || all.find((l) => !doneSet.has(l._id)) || all[0];
      if (lw?.lesson === start?._id) pendingSeek.current = lw.position;
      setCurrent(start || null);
    }).catch((e) => setErr(errMsg(e)));
  }, [courseId]);

  if (err) return <ErrorBox>{err}</ErrorBox>;
  if (!data) return <Loader />;
  const { course, sections } = data;

  const save = async (body) => {
    if (!enrollment) return; // instructors/admins previewing
    try {
      const { data: res } = await api.patch(`/learn/${courseId}/progress`, body);
      setData((d) => ({ ...d, enrollment: res.data.enrollment }));
    } catch { /* ignore */ }
  };

  const select = (lesson, seek = null) => {
    pendingSeek.current = seek;
    setCurrent(lesson);
  };
  const idx = lessons.findIndex((l) => l._id === current?._id);
  const next = lessons[idx + 1];

  const embedUrl = current?.type === 'video' ? youtubeEmbed(current.video?.url) : null;
  const openQuiz = async () => { setQuizLoading(true); setQuizMsg(''); setQuizResult(null); try { const { data: r } = await api.get(`/learn/${courseId}/quiz`); setQuiz(r.data.quiz); setAnswers(Array(r.data.quiz.questions.length).fill(-1)); } catch (e) { setQuizMsg(errMsg(e)); } finally { setQuizLoading(false); } };
  const submitQuiz = async (e) => { e.preventDefault(); if (answers.some(a => a < 0)) { setQuizMsg('Please answer every question.'); return; } try { const { data: r } = await api.post(`/learn/${courseId}/quiz/submit`, { answers }); setQuizResult(r.data); setData(d => ({ ...d, enrollment: r.data.enrollment })); setQuizMsg(''); } catch (e2) { setQuizMsg(errMsg(e2)); } };

  const onMeta = () => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = rate;
    if (pendingSeek.current) { v.currentTime = pendingSeek.current; pendingSeek.current = null; }
  };
  const onTime = () => {
    const v = videoRef.current;
    if (v && Date.now() - lastSave.current > 10000) {
      lastSave.current = Date.now();
      save({ lessonId: current._id, position: v.currentTime });
    }
  };
  const onEnded = async () => {
    await save({ lessonId: current._id, completed: true, position: 0 });
    if (next) { setAutoplay(true); select(next); }
  };
  const changeRate = (r) => { setRate(r); if (videoRef.current) videoRef.current.playbackRate = r; };
  const toggleDone = () => save({ lessonId: current._id, completed: !done.has(current._id), position: videoRef.current?.currentTime || 0 });

  const addBookmark = async () => {
    const note = window.prompt('Bookmark note (optional):') ?? null;
    if (note === null) return;
    const { data: res } = await api.post(`/learn/${courseId}/bookmarks`, { lessonId: current._id, time: videoRef.current?.currentTime || 0, note });
    setData((d) => ({ ...d, enrollment: res.data.enrollment }));
  };
  const delBookmark = async (id) => {
    const { data: res } = await api.delete(`/learn/${courseId}/bookmarks/${id}`);
    setData((d) => ({ ...d, enrollment: res.data.enrollment }));
  };
  const jump = (b) => {
    if (b.lesson === current._id) { if (videoRef.current) videoRef.current.currentTime = b.time; }
    else select(lessons.find((l) => l._id === b.lesson), b.time);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!rv.rating) return setRvMsg('Please choose a star rating');
    try { await api.post(`/courses/${courseId}/reviews`, rv); setRvMsg('Thanks! Your review has been saved.'); }
    catch (e2) { setRvMsg(errMsg(e2)); }
  };

  const bookmarks = (enrollment?.bookmarks || []).filter((b) => b.lesson === current?._id);
  const pct = enrollment?.percentComplete || 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link to="/my-learning" className="text-sm text-indigo-600">← My learning</Link>
          <h1 className="text-lg font-bold">{course.title}</h1>
        </div>

        {current ? (
          <>
            {current.type === 'video' && current.video?.url ? (
              embedUrl ? <div className="aspect-video w-full overflow-hidden rounded-xl bg-black"><iframe key={current._id} src={embedUrl} title={current.title} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div> : <video key={current._id} ref={videoRef} src={current.video.url} controls autoPlay={autoplay} onLoadedMetadata={onMeta} onTimeUpdate={onTime} onEnded={onEnded} className="aspect-video w-full rounded-xl bg-black" />
            ) : (
              <div className="card whitespace-pre-wrap p-6 text-sm">{current.content || 'No content for this lesson yet.'}</div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <h2 className="mr-auto text-xl font-bold">{current.title}</h2>
              {current.type === 'video' && (
                <>
                  <label className="flex items-center gap-2 text-sm">
                    Speed
                    <select className="input !w-auto !py-1" value={rate} onChange={(e) => changeRate(Number(e.target.value))}>
                      {RATES.map((r) => <option key={r} value={r}>{r}x</option>)}
                    </select>
                  </label>
                  {enrollment && <button className="btn btn-outline btn-sm" onClick={addBookmark}>🔖 Bookmark</button>}
                </>
              )}
              {enrollment && (
                <button className={`btn btn-sm ${done.has(current._id) ? 'btn-outline' : 'btn-primary'}`} onClick={toggleDone}>
                  {done.has(current._id) ? '✓ Completed' : 'Mark complete'}
                </button>
              )}
              {next && <button className="btn btn-outline btn-sm" onClick={() => { setAutoplay(true); select(next); }}>Next →</button>}
            </div>
            {current.description && <p className="text-sm text-slate-600">{current.description}</p>}

            {bookmarks.length > 0 && (
              <div className="card p-4">
                <h3 className="mb-2 text-sm font-bold">Your bookmarks</h3>
                <ul className="space-y-1 text-sm">
                  {bookmarks.map((b) => (
                    <li key={b._id} className="flex items-center justify-between">
                      <button className="text-indigo-600 hover:underline" onClick={() => jump(b)}>{fmtTime(b.time)} {b.note && `– ${b.note}`}</button>
                      <button className="text-xs text-red-600" onClick={() => delBookmark(b._id)}>delete</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : <p>This course has no lessons yet.</p>}

        {enrollment && pct >= 100 && (
          <section className="card space-y-3 p-5">
            <div><h3 className="font-bold">Final course quiz</h3><p className="text-sm text-slate-500">Pass the quiz to unlock your certificate. Required pass mark is shown when you open the quiz.</p></div>
            <button className="btn btn-primary btn-sm" onClick={openQuiz} disabled={quizLoading}>{quizLoading ? 'Loading quiz…' : enrollment.quizPassed ? 'Retake final quiz' : 'Start final quiz'}</button>
            {quizMsg && <p className="text-sm text-red-600">{quizMsg}</p>}
            {quiz && !quizResult && <form onSubmit={submitQuiz} className="space-y-5"><h4 className="font-semibold">{quiz.title} · Pass mark {quiz.passMark}%</h4>{quiz.questions.map((q, i) => <fieldset key={q._id} className="space-y-2"><legend className="font-medium">{i + 1}. {q.question}</legend>{q.options.map((opt, j) => <label key={j} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"><input type="radio" name={`q-${i}`} checked={answers[i] === j} onChange={() => setAnswers(a => a.map((v, k) => k === i ? j : v))} />{opt}</label>)}</fieldset>)}<button className="btn btn-primary">Submit answers</button></form>}
            {quizResult && <div className="space-y-3"><div className={`rounded-lg p-4 ${quizResult.passed ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}><p className="font-bold">{quizResult.passed ? 'Quiz passed!' : 'Not passed yet'}</p><p>Your score: {quizResult.score}% · Required: {quizResult.passMark}%</p></div>{quizResult.results.map((r, i) => <div key={i} className="border-b border-slate-100 pb-2 text-sm"><p className="font-medium">{i + 1}. {r.question}</p><p className="text-slate-600">Correct answer: {quiz.questions[i].options[r.correctAnswer]}</p>{r.explanation && <p className="text-slate-500">{r.explanation}</p>}</div>)}{quizResult.passed && <Link to={`/certificate/${courseId}`} className="btn btn-primary">Get your certificate →</Link>}<button className="btn btn-outline ml-2" onClick={() => { setQuizResult(null); setAnswers(Array(quiz.questions.length).fill(-1)); }}>Try again</button></div>}
          </section>
        )}

        {enrollment && (
          <form onSubmit={submitReview} className="card space-y-3 p-5">
            <h3 className="font-bold">Rate this course</h3>
            <StarInput value={rv.rating} onChange={(n) => setRv({ ...rv, rating: n })} />
            <textarea className="input" rows={3} placeholder="Share your experience (optional)" value={rv.comment} onChange={(e) => setRv({ ...rv, comment: e.target.value })} />
            <div className="flex items-center gap-3">
              <button className="btn btn-primary btn-sm">Save review</button>
              {rvMsg && <span className="text-sm text-slate-600">{rvMsg}</span>}
            </div>
          </form>
        )}
      </div>

      <aside className="card h-fit overflow-hidden lg:sticky lg:top-20">
        <div className="space-y-2 border-b border-slate-200 p-4">
          <div className="text-sm font-bold">Course progress</div>
          {enrollment ? (
            <>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} /></div>
              <div className="text-xs text-slate-500">{pct}% complete</div>
              {enrollment.completedAt && enrollment.quizPassed && <Link to={`/certificate/${courseId}`} className="btn btn-primary btn-sm w-full">🏆 Get certificate</Link>}
              {pct >= 100 && !enrollment.quizPassed && <button onClick={openQuiz} className="btn btn-outline btn-sm w-full">📝 Take final quiz</button>}
              <Link to="/coding-practice" className="btn btn-outline btn-sm w-full">⌨ Coding Practice</Link>
            </>
          ) : <div className="text-xs text-slate-500">Preview mode (progress not tracked)</div>}
        </div>
        <div className="max-h-[65vh] overflow-y-auto">
          {sections.map((s) => (
            <div key={s._id}>
              <div className="bg-slate-50 px-4 py-2 text-sm font-semibold">{s.title}</div>
              {s.lessons.map((l) => (
                <button key={l._id} onClick={() => select(l)} className={`flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm hover:bg-slate-50 ${current?._id === l._id ? 'bg-indigo-50 font-semibold' : ''}`}>
                  <span className={done.has(l._id) ? 'text-green-600' : 'text-slate-400'}>{done.has(l._id) ? '✓' : '○'}</span>
                  <span className="flex-1">{l.title}<span className="block text-xs font-normal text-slate-500">{l.type === 'video' ? fmtDuration(l.video?.duration) : l.type}</span></span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
