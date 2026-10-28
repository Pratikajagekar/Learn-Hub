# LearnHub – MERN Learning Management System (Udemy-style)

Full-stack LMS: **React + Vite + Tailwind** · **Node + Express (MVC)** · **MongoDB + Mongoose** · **JWT in HTTP-only cookies** · RBAC (Student / Instructor / Admin).

## Run it (3 steps)

Requirements: **Node.js 18+** (https://nodejs.org). Nothing else – the database is embedded.

```bash
# 1. install everything (once)
npm run setup

# 2. start API + frontend together
npm start
```
Or just double-click **`start.bat`** (Windows) / run **`./start.sh`** (Mac/Linux): it installs and starts for you.

3. Open **http://localhost:5173**

> First start downloads an embedded MongoDB binary (~100 MB, one time) and seeds demo data. Wait for `✅ API running on http://localhost:5000`.

## Demo accounts
| Role | Email | Password |
|---|---|---|
| Student | student@lms.com | student123 |
| Instructor | instructor@lms.com | instructor123 |
| Admin | admin@lms.com | admin123 |

## Try this flow
1. Browse/filter courses → open one → **Buy now** (demo checkout, instant enrollment).
2. **My learning** → open the player: speed control, bookmarks, auto-resume, mark complete, reviews.
3. Complete all lessons → take the **Final Quiz** → pass the configured score → download/print the certificate.
4. Open **Coding Practice** to run Python, C++, Java, JavaScript or C in the Judge0 sandbox.
5. Instructors edit a course → configure the **Final quiz & certificate** JSON panel → paste YouTube URLs into video lesson URLs to embed videos.
4. Log in as **instructor** → create a course, add sections/lessons (video URL or upload) → *Submit for review*.
5. Log in as **admin** → *Courses* tab → approve → it appears in the catalog. Manage users & categories.

## Features
- Search + filters (category, level, price, rating), sorting, pagination
- Course page with curriculum, free-preview lessons (others locked until enrolled), reviews & ratings
- Cart, checkout (Stripe Checkout when configured, otherwise demo mode), orders, instructor earnings with platform fee
- Video player: playback speed, bookmarks, resume position, progress tracking, completion certificate
- Instructor: course CRUD, sections & lessons, uploads, configurable final quiz JSON, analytics/earnings, approval workflow
- Admin: approve/reject courses, users (role/deactivate), categories, platform stats

## Final quiz setup

In the instructor dashboard, edit a course and use **Final quiz & certificate**. Enter valid JSON in this shape (the `correctAnswer` index starts at `0`):

```json
{
  "title": "Course Completion Quiz",
  "passMark": 70,
  "questions": [
    {
      "question": "What does HTML stand for?",
      "options": ["Hyper Text Markup Language", "High Transfer Machine Language"],
      "correctAnswer": 0,
      "explanation": "HTML means Hyper Text Markup Language."
    }
  ]
}
```

Students must mark every lesson complete, pass the quiz, and then use **Get certificate**. YouTube lesson URLs are embedded automatically in the learning player; standard MP4 URLs continue to use the native video player.

## Configuration (`server/.env`)
| Variable | Purpose |
|---|---|
| `MONGO_URI` | Empty = embedded DB (data in `.mongo-data/`). Set to use MongoDB Atlas/local/Docker (`docker compose up -d`). |
| `STRIPE_SECRET_KEY` | Set to enable real Stripe Checkout. Empty = demo mode. |
| `CLOUDINARY_*` | Set to store uploads on Cloudinary. Empty = saved in `server/uploads/`. |
| `PLATFORM_FEE_PERCENT` | Platform cut on each sale (default 20). |
| `JUDGE0_URL` | Judge0-compatible code execution API URL (defaults to `https://ce.judge0.com`). |
| `JUDGE0_API_KEY`, `JUDGE0_API_HOST` | Optional credentials when using a hosted Judge0 provider. |
| `JWT_SECRET` | **Change in production.** |

To reset demo data, stop the app and delete the `.mongo-data` folder.

## Project structure
```
lms-platform/
├── server/src/
│   ├── models/        User, Category, Course, Section, Lesson, Enrollment, Review, Order
│   ├── controllers/   auth, course, curriculum, cart, payment, learn, admin, upload
│   ├── routes/        index.js  (all REST routes under /api/v1)
│   ├── services/      courseService, orderService
│   ├── middleware/    auth (protect, restrictTo, optionalAuth), errorHandler
│   ├── config/db.js   embedded or external MongoDB
│   ├── seed.js        demo data
│   └── server.js
└── client/src/
    ├── pages/         Home, Courses, CourseDetail, Cart, Learn, Certificate, dashboards…
    ├── components/    Navbar, CourseCard, Common
    └── context/       AuthContext (user + cart)
```

## Production notes
- Set a strong `JWT_SECRET`, `NODE_ENV=production`, a real `MONGO_URI`, and `CLIENT_URL`.
- Build the frontend with `npm run build --prefix client` and serve `client/dist` from a static host / reverse proxy that forwards `/api` and `/uploads` to the server.
- For paid video protection, use Cloudinary/S3 signed URLs.
