import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import seedIfEmpty from './seed.js';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import AppError from './utils/AppError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: { directives: { frameSrc: ["'self'", 'https://www.youtube-nocookie.com', 'https://www.youtube.com'] } } }));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 2000 }));
app.use(compression());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/v1', routes);
app.all('/api/*', (req, res, next) => next(new AppError(`Route ${req.originalUrl} not found`, 404)));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB().then(async () => {
  await seedIfEmpty();
  const server = app.listen(PORT, () => console.log(`\n✅ API running on http://localhost:${PORT}\n`));
  process.on('unhandledRejection', (err) => { console.error('UNHANDLED REJECTION:', err); server.close(() => process.exit(1)); });
});
