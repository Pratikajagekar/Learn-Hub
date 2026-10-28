import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(__dirname, '../../uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => cb(null, crypto.randomBytes(12).toString('hex') + path.extname(file.originalname).toLowerCase()),
});
export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^(video|image)\//.test(file.mimetype)) cb(null, true);
    else cb(new AppError('Only video and image files are allowed', 400));
  },
}).single('file');

const cloudinaryOn = () => process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

export const handleUpload = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);
  if (cloudinaryOn()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    const r = await cloudinary.uploader.upload(req.file.path, { resource_type: 'auto', folder: 'lms' });
    fs.unlink(req.file.path, () => {});
    return res.json({ status: 'success', data: { url: r.secure_url, publicId: r.public_id, duration: Math.round(r.duration || 0) } });
  }
  res.json({ status: 'success', data: { url: `/uploads/${req.file.filename}`, publicId: null } });
});
