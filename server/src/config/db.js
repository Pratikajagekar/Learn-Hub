import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function connectDB() {
  let uri = process.env.MONGO_URI;
  try {
    if (!uri) {
      // Embedded MongoDB: no installation needed. Downloads the mongod binary on first run only.
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const dbPath = path.join(__dirname, '../../../.mongo-data');
      fs.mkdirSync(dbPath, { recursive: true });
      console.log('Starting embedded MongoDB (first run downloads ~100MB, please wait)...');
      const mongod = await MongoMemoryServer.create({ instance: { dbPath, storageEngine: 'wiredTiger' } });
      uri = mongod.getUri('lms');
    }
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}
