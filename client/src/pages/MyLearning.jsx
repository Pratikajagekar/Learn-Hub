import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Loader } from '../components/Common';
import { Thumb } from '../components/CourseCard';

export default function MyLearning() {
  const [list, setList] = useState(null);
  useEffect(() => { api.get('/enrollments/my').then(({ data }) => setList(data.data.enrollments)); }, []);
  if (!list) return <Loader />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">My learning</h1>
      {list.length === 0 ? (
        <div className="py-16 text-center text-slate-500">
          You haven't enrolled in any course yet.<br />
          <Link to="/courses" className="btn btn-primary mt-4">Browse courses</Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((e) => (
            <div key={e._id} className="card flex flex-col overflow-hidden">
              <Thumb course={e.course} className="aspect-video w-full" />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="line-clamp-2 font-semibold">{e.course.title}</h3>
                <p className="text-xs text-slate-500">{e.course.instructor?.name}</p>
                <div className="mt-auto">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full bg-indigo-600" style={{ width: `${e.percentComplete}%` }} /></div>
                  <div className="mt-1 flex justify-between text-xs text-slate-500"><span>{e.percentComplete}% complete</span>{e.completedAt && <span>🏆 Completed</span>}</div>
                </div>
                <Link to={`/learn/${e.course._id}`} className="btn btn-primary btn-sm">{e.percentComplete ? 'Continue' : 'Start'}</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
