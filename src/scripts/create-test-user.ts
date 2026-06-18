import mongoose from 'mongoose';
import { hashPassword } from '../utils/password.util';
import { User } from '../models/user.model';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const createTestUser = async () => {
  try {
    // Connect to MongoDB using environment variable
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'ashuprajapativns421@gmail.com' });
    if (existingUser) {
      console.log('User already exists. Updating password...');
      
      // Update password
      const hashedPassword = await hashPassword('Test@123456');
      existingUser.password = hashedPassword;
      existingUser.isActive = true;
      await existingUser.save();
      console.log('Password updated successfully');
    } else {
      // Create new user
      const hashedPassword = await hashPassword('Test@123456');
      await User.create({
        email: 'ashuprajapativns421@gmail.com',
        password: hashedPassword,
        role: 'employee',
        isActive: true,
      });
      console.log('Test user created successfully');
      console.log('Email: ashuprajapativns421@gmail.com');
      console.log('Password: Test@123456');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
};

createTestUser();
