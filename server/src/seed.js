import User from './models/User.js';
import Category from './models/Category.js';
import Course from './models/Course.js';
import Section from './models/Section.js';
import Lesson from './models/Lesson.js';
import Enrollment from './models/Enrollment.js';
import Review from './models/Review.js';

const VID = (n) => `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/${n}.mp4`;
const VIDEOS = [['BigBuckBunny', 596], ['ElephantsDream', 653], ['Sintel', 888], ['TearsOfSteel', 734], ['ForBiggerBlazes', 15], ['ForBiggerEscapes', 15]];

export default async function seedIfEmpty() {
  if (await User.countDocuments()) return;
  console.log('Seeding demo data...');

  const [admin, ins1, ins2, student] = await User.create([
    { name: 'Admin User', email: 'admin@lms.com', password: 'admin123', role: 'admin' },
    { name: 'Dr. Sarah Johnson', email: 'instructor@lms.com', password: 'instructor123', role: 'instructor', headline: 'Senior Software Engineer & Educator', bio: '12+ years building web platforms and teaching 50,000+ students.' },
    { name: 'Michael Chen', email: 'instructor2@lms.com', password: 'instructor123', role: 'instructor', headline: 'Data Scientist & Designer', bio: 'Former Google data scientist turned full-time teacher.' },
    { name: 'Demo Student', email: 'student@lms.com', password: 'student123', role: 'student' },
  ]);
  const extras = await User.create(
    ['Priya Sharma', 'Rahul Verma', 'Anita Desai'].map((name, i) => ({ name, email: `student${i + 2}@lms.com`, password: 'student123' }))
  );

  const cats = await Category.create(
    ['Web Development', 'Data Science', 'Design', 'Business', 'Marketing', 'Photography'].map((name) => ({ name }))
  );
  const cat = (n) => cats.find((c) => c.name === n)._id;

  const specs = [
    { title: 'Complete MERN Stack Bootcamp', subtitle: 'Build full-stack apps with MongoDB, Express, React and Node', cat: 'Web Development', level: 'intermediate', price: 89.99, discount: 49.99, ins: ins1, tags: ['react', 'node', 'mongodb'], sections: [['Getting Started', ['Course Overview', 'Setting Up Your Environment', 'How the Web Works']], ['Backend with Express', ['REST API Basics', 'MongoDB & Mongoose', 'JWT Authentication']]] },
    { title: 'Modern JavaScript from Scratch', subtitle: 'Master ES6+, async programming and the DOM', cat: 'Web Development', level: 'beginner', price: 59.99, ins: ins1, tags: ['javascript', 'es6'], sections: [['JavaScript Fundamentals', ['Variables & Types', 'Functions', 'Arrays & Objects']], ['Advanced Concepts', ['Promises & Async/Await', 'Modules', 'DOM Manipulation']]] },
    { title: 'Python for Data Science', subtitle: 'NumPy, Pandas, Matplotlib and real-world projects', cat: 'Data Science', level: 'beginner', price: 79.99, discount: 39.99, ins: ins2, tags: ['python', 'pandas'], sections: [['Python Basics', ['Installing Python', 'Data Structures', 'Control Flow']], ['Data Analysis', ['Intro to Pandas', 'Cleaning Data', 'Visualization']]] },
    { title: 'Machine Learning A-Z', subtitle: 'From linear regression to neural networks', cat: 'Data Science', level: 'advanced', price: 99.99, ins: ins2, tags: ['ml', 'python'], sections: [['Foundations', ['What is ML?', 'Regression', 'Classification']], ['Deep Learning', ['Neural Networks', 'CNNs', 'Deployment']]] },
    { title: 'UI/UX Design Masterclass', subtitle: 'Design beautiful, usable interfaces with Figma', cat: 'Design', level: 'all', price: 69.99, ins: ins2, tags: ['figma', 'ux'], sections: [['Design Principles', ['Color & Typography', 'Layout & Spacing', 'User Research']], ['Prototyping', ['Figma Basics', 'Components', 'Handoff']]] },
    { title: 'Digital Marketing Essentials (Free)', subtitle: 'SEO, social media and email marketing basics', cat: 'Marketing', level: 'beginner', price: 0, ins: ins1, tags: ['seo', 'marketing'], sections: [['Marketing Basics', ['Marketing Funnel', 'SEO 101', 'Social Media']], ['Growth', ['Email Marketing', 'Analytics', 'Ad Campaigns']]] },
    { title: 'Photography for Beginners', subtitle: 'Camera basics, composition and editing', cat: 'Photography', level: 'beginner', price: 44.99, ins: ins1, tags: ['camera'], pending: true, sections: [['Camera Basics', ['Exposure Triangle', 'Lenses', 'Lighting']]] },
  ];

  const courses = [];
  for (let i = 0; i < specs.length; i++) {
    const s = specs[i];
    const course = await Course.create({
      instructor: s.ins._id, title: s.title, subtitle: s.subtitle, category: cat(s.cat), level: s.level,
      description: `${s.subtitle}.\n\nThis course takes you step by step from the fundamentals to real-world practice. You will learn by building, with quizzes, downloadable resources and lifetime access.`,
      price: s.price, discountPrice: s.discount, tags: s.tags,
      outcomes: ['Build real-world projects from scratch', 'Understand core concepts deeply', 'Apply best practices used by professionals', 'Get a certificate of completion'],
      requirements: ['A computer with internet access', 'No prior experience required'],
      thumbnail: { url: `https://picsum.photos/seed/lms-${i + 11}/640/360` },
      status: s.pending ? 'pending' : 'published', publishedAt: s.pending ? undefined : new Date(Date.now() - i * 86400000 * 3),
    });
    let v = 0;
    for (let si = 0; si < s.sections.length; si++) {
      const [secTitle, lessons] = s.sections[si];
      const section = await Section.create({ course: course._id, title: secTitle, order: si });
      for (let li = 0; li < lessons.length; li++) {
        const [name, dur] = VIDEOS[v++ % VIDEOS.length];
        await Lesson.create({ course: course._id, section: section._id, title: lessons[li], order: li, type: 'video', video: { url: VID(name), duration: dur }, isPreview: si === 0 && li === 0 });
      }
    }
    courses.push(course);
  }

  // Student is enrolled in course 0 with some progress
  const l0 = await Lesson.find({ course: courses[0]._id }).sort('createdAt');
  await Enrollment.create({ student: student._id, course: courses[0]._id, completedLessons: l0.slice(0, 2).map((l) => l._id), percentComplete: Math.round((2 / l0.length) * 100), lastWatched: { lesson: l0[2]._id, position: 0, at: new Date() } });
  await Course.findByIdAndUpdate(courses[0]._id, { $inc: { enrollmentCount: 1 } });

  // Fake social proof
  const comments = ['Excellent course, very clear explanations!', 'Great value. Learned a lot.', 'Well structured and practical.', 'Highly recommended for beginners.'];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < extras.length; j++) {
      if ((i + j) % 3 === 2) continue;
      await Enrollment.create({ student: extras[j]._id, course: courses[i]._id });
      await Course.findByIdAndUpdate(courses[i]._id, { $inc: { enrollmentCount: 12 + j * 5 } });
      await Review.create({ course: courses[i]._id, student: extras[j]._id, rating: 4 + ((i + j) % 2), comment: comments[(i + j) % comments.length] });
    }
  }
  console.log('Seed complete. Logins: admin@lms.com/admin123, instructor@lms.com/instructor123, student@lms.com/student123');
}
