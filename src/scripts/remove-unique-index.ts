import mongoose from 'mongoose';
import { Attendance } from '../models/attendance.model';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms';

async function removeUniqueIndex() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the collection
    const collection = mongoose.connection.collection('attendances');
    
    // List all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => ({ name: i.name, key: i.key })));

    // Drop the unique index on userId and date
    try {
      await collection.dropIndex('userId_1_date_1');
      console.log('Successfully dropped unique index userId_1_date_1');
    } catch (error: any) {
      if (error.code === 27) {
        console.log('Index userId_1_date_1 does not exist, skipping');
      } else {
        throw error;
      }
    }

    // Verify indexes after dropping
    const indexesAfter = await collection.indexes();
    console.log('Indexes after removal:', indexesAfter.map(i => ({ name: i.name, key: i.key })));

    console.log('Index removal completed successfully');
  } catch (error) {
    console.error('Error during index removal:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

removeUniqueIndex();
