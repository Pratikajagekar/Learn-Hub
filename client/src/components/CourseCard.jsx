import { Link } from 'react-router-dom';
import { Stars } from './Common';
import { money } from '../utils';

const gradients = ['from-indigo-500 to-purple-600', 'from-emerald-500 to-teal-600', 'from-rose-500 to-orange-500', 'from-sky-500 to-blue-700'];

export function Thumb({ course, className = '' }) {
  const url = course.thumbnail?.url;
  if (url) return <img src={url} alt={course.title} className={`object-cover ${className}`} loading="lazy" />;
  const g = gradients[(course.title?.length || 0) % gradients.length];
  return <div className={`flex items-center justify-center bg-gradient-to-br ${g} p-4 text-center font-bold text-white ${className}`}>{course.title}</div>;
}

export default function CourseCard({ course }) {
  const price = course.discountPrice ?? course.price;
  return (
    <Link to={`/courses/${course.slug}`} className="card group flex flex-col overflow-hidden transition hover:shadow-lg">
      <Thumb course={course} className="aspect-video w-full" />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug group-hover:text-indigo-600">{course.title}</h3>
        <p className="text-xs text-slate-500">{course.instructor?.name}</p>
        <Stars value={course.ratingAverage} count={course.ratingCount} size="text-sm" />
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-lg font-bold">{money(price)}</span>
          {course.discountPrice != null && course.discountPrice < course.price && (
            <span className="text-sm text-slate-400 line-through">{money(course.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
