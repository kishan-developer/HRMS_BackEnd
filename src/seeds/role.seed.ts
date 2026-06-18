import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Role } from '../models/access-control.model';

dotenv.config();

const seedRoles = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    
    // Clear existing roles
    await Role.deleteMany({});
    
    const roles = [
      {
        name: 'Super Admin',
        code: 'superadmin',
        description: 'Full system access',
        priority: 1,
        permissions: [],
        isActive: true,
        isSystem: true,
      },
      {
        name: 'HR Manager',
        code: 'hr_manager',
        description: 'HR management access',
        priority: 2,
        permissions: [],
        isActive: true,
        isSystem: true,
      },
      {
        name: 'Accounts Manager',
        code: 'accounts',
        description: 'Finance and payroll access',
        priority: 3,
        permissions: [],
        isActive: true,
        isSystem: true,
      },
      {
        name: 'Employee',
        code: 'employee',
        description: 'Employee access',
        priority: 5,
        permissions: [],
        isActive: true,
        isSystem: true,
      },
      {
        name: 'Support',
        code: 'support',
        description: 'Support access',
        priority: 4,
        permissions: [],
        isActive: true,
        isSystem: true,
      },
    ];
    
    await Role.insertMany(roles);
    console.log('Roles seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding roles:', error);
    process.exit(1);
  }
};

seedRoles();
