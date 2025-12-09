import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached!.conn) {
    console.log('Using cached MongoDB connection');
    return cached!.conn;
  }

  if (!cached!.promise) {
    console.log('Creating new MongoDB connection...');
    console.log('MongoDB URI exists:', !!MONGODB_URI);
    
    cached!.promise = mongoose.connect(MONGODB_URI!).then((mongoose) => {
      console.log('MongoDB connected successfully');
      console.log('MongoDB connected successfully');
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

mongoose.connection.on('connected', () => {
  console.log('Mongo has connected successfully');
});

mongoose.connection.on('reconnected', () => {
  console.log('Mongo has reconnected');
});

mongoose.connection.on('error', (error) => {
  console.log('Mongo connection has an error', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongo connection is disconnected');
});

export default dbConnect;