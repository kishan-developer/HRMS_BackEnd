import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { LeaveType } from '../models/leave-type.model';

dotenv.config();

const seedLeaveTypes = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    
    // Clear existing leave types
    await LeaveType.deleteMany({});
    
    const leaveTypes = [
      {
        name: 'Casual Leave',
        code: 'CL',
        description: 'Leave for personal reasons or short breaks',
        daysAllowed: 12,
        isPaid: true,
        requiresApproval: true,
        requiresDocument: false,
        carryForwardAllowed: true,
        maxCarryForwardDays: 5,
        isActive: true,
      },
      {
        name: 'Paternity Leave',
        code: 'PL',
        description: 'Leave for new fathers',
        daysAllowed: 15,
        isPaid: true,
        requiresApproval: true,
        requiresDocument: true,
        carryForwardAllowed: false,
        maxCarryForwardDays: 0,
        isActive: true,
      },
    ];
    
    await LeaveType.insertMany(leaveTypes);
    console.log('Leave types seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding leave types:', error);
    process.exit(1);
  }
};

seedLeaveTypes();
