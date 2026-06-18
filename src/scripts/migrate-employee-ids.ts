import mongoose from 'mongoose';
import { User } from '../models/user.model';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms';

async function migrateEmployeeIds() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users with old format employee IDs (EMP prefix or timestamp format)
    const usersWithOldEmployeeIds = await User.find({
      employeeId: { $regex: /^EMP\d+/ }
    });
    console.log(`Found ${usersWithOldEmployeeIds.length} users with old format employee IDs`);

    // Also find users without employeeId
    const usersWithoutEmployeeId = await User.find({ employeeId: { $exists: false } });
    console.log(`Found ${usersWithoutEmployeeId.length} users without employeeId`);

    let updatedCount = 0;
    let sequence = 1;

    // Update users with old format employee IDs
    for (const user of usersWithOldEmployeeIds) {
      const newEmployeeId = `CG-${sequence.toString().padStart(4, '0')}`;
      user.employeeId = newEmployeeId;
      await user.save();
      console.log(`Updated user ${user.email}: ${user.employeeId} -> ${newEmployeeId}`);
      updatedCount++;
      sequence++;
    }

    // Update users without employeeId
    for (const user of usersWithoutEmployeeId) {
      const newEmployeeId = `CG-${sequence.toString().padStart(4, '0')}`;
      user.employeeId = newEmployeeId;
      await user.save();
      console.log(`Updated user ${user.email}: no ID -> ${newEmployeeId}`);
      updatedCount++;
      sequence++;
    }

    console.log(`Successfully updated ${updatedCount} users with CG-XXXX format employee IDs`);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

migrateEmployeeIds();
