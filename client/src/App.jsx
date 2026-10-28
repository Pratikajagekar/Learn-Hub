import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import { Protected } from './components/Common';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Cart from './pages/Cart';
import PaymentSuccess from './pages/PaymentSuccess';
import { Login, Register } from './pages/Auth';
import MyLearning from './pages/MyLearning';
import Learn from './pages/Learn';
import Certificate from './pages/Certificate';
import InstructorDashboard from './pages/InstructorDashboard';
import CourseEditor from './pages/CourseEditor';
import AdminDashboard from './pages/AdminDashboard';
import CodingPractice from './pages/CodingPractice';

const NotFound = () => (
  <div className="py-24 text-center">
    <h1 className="text-5xl font-extrabold">404</h1>
    <p className="mt-2 text-slate-500">Page not found</p>
    <Link to="/" className="btn btn-primary mt-6">Go home</Link>
  </div>
);

export default function App() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Protected><Cart /></Protected>} />
          <Route path="/payment/success" element={<Protected><PaymentSuccess /></Protected>} />
          <Route path="/my-learning" element={<Protected><MyLearning /></Protected>} />
          <Route path="/coding-practice" element={<Protected><CodingPractice /></Protected>} />
          <Route path="/learn/:courseId" element={<Protected><Learn /></Protected>} />
          <Route path="/certificate/:courseId" element={<Protected><Certificate /></Protected>} />
          <Route path="/instructor" element={<Protected roles={['instructor', 'admin']}><InstructorDashboard /></Protected>} />
          <Route path="/instructor/courses/new" element={<Protected roles={['instructor', 'admin']}><CourseEditor /></Protected>} />
          <Route path="/instructor/courses/:id" element={<Protected roles={['instructor', 'admin']}><CourseEditor /></Protected>} />
          <Route path="/admin" element={<Protected roles={['admin']}><AdminDashboard /></Protected>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="no-print mt-10 border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} LearnHub – a MERN learning platform
      </footer>
    </>
  );
}
