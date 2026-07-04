import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms';

export const connectDatabase = async (): Promise<boolean> => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      connectTimeoutMS: 30000, // 30 seconds connection timeout
      maxPoolSize: 10,
      minPoolSize: 5,
    });
    console.log('MongoDB connection successful');
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    return false;
  }
};

export const testConnection = async (): Promise<boolean> => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB connection is ready');
      return true;
    }
    return await connectDatabase();
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
    return false;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
};
