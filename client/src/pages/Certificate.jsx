import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { Loader, ErrorBox } from '../components/Common';

export default function Certificate() {
  const { courseId } = useParams();
  const [c, setC] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    api.get(`/learn/${courseId}/certificate`).then(({ data }) => setC(data.data.certificate)).catch((e) => setErr(errMsg(e)));
  }, [courseId]);

  if (err) return <div className="space-y-3"><ErrorBox>{err}</ErrorBox><Link to={`/learn/${courseId}`} className="btn btn-outline">Back to course</Link></div>;
  if (!c) return <Loader />;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print mb-4 flex gap-2">
        <button className="btn btn-primary" onClick={() => window.print()}>⬇ Download / Print (Save as PDF)</button>
        <Link to="/my-learning" className="btn btn-outline">Back</Link>
      </div>
      <div className="border-[10px] border-double border-indigo-600 bg-white p-12 text-center shadow-lg">
        <div className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">LearnHub</div>
        <h1 className="mt-4 font-serif text-5xl font-bold">Certificate of Completion</h1>
        <p className="mt-8 text-slate-500">This is to certify that</p>
        <p className="mt-3 border-b-2 border-slate-300 pb-2 font-serif text-4xl italic">{c.studentName}</p>
        <p className="mt-6 text-slate-500">has successfully completed the course</p>
        <p className="mt-2 text-2xl font-bold">{c.courseTitle}</p>
        <div className="mt-10 flex justify-between text-sm text-slate-600">
          <div><div className="font-semibold">{new Date(c.completedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</div><div className="text-xs">Date</div></div>
          <div><div className="font-semibold">{c.instructorName}</div><div className="text-xs">Instructor</div></div>
          <div><div className="font-mono font-semibold">{c.certificateId}</div><div className="text-xs">Certificate ID</div></div>
        </div>
      </div>
    </div>
  );
}
