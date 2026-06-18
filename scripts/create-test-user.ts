import mongoose from 'mongoose';
import { User } from '../src/models/user.model';
import { hashPassword } from '../src/utils/password.util';
import dotenv from 'dotenv';

dotenv.config();

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms');
    console.log('Connected to MongoDB');

    const hashedPassword = await hashPassword('User@321');

    const user = await User.findOneAndUpdate(
      { email: 'gunnikij1665@gmail.com' },
      {
        password: hashedPassword,
        role: 'superadmin',
        isActive: true,
      },
      { upsert: true, new: true }
    );

    console.log('Test user created/updated successfully:');
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Password: User@321');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error creating test user:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createTestUser();
