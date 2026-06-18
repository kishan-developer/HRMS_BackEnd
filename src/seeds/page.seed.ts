import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Page from '../models/page.model';

dotenv.config();

const seedPages = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    
    // Clear existing pages
    await Page.deleteMany({});
    
    const pages = [
      { pageName: 'Dashboard', route: '/dashboard/[role]', category: 'General' },
      { pageName: 'Notifications', route: '/dashboard/[role]/notifications', category: 'General' },
      { pageName: 'Users', route: '/dashboard/[role]/users', category: 'HR' },
      { pageName: 'Roles', route: '/dashboard/[role]/roles', category: 'HR' },
      { pageName: 'Access Control', route: '/dashboard/[role]/access-control', category: 'HR' },
      { pageName: 'Companies', route: '/dashboard/[role]/companies', category: 'HR' },
      { pageName: 'Employees', route: '/dashboard/[role]/employees', category: 'HR' },
      { pageName: 'Attendance', route: '/dashboard/[role]/attendance', category: 'HR' },
      { pageName: 'Leave Management', route: '/dashboard/[role]/leaves', category: 'HR' },
      { pageName: 'Payroll', route: '/dashboard/[role]/payroll', category: 'Finance' },
      { pageName: 'Payslips', route: '/dashboard/[role]/payslips', category: 'Finance' },
      { pageName: 'Reimbursements', route: '/dashboard/[role]/reimbursements', category: 'Finance' },
      { pageName: 'Loans & Advances', route: '/dashboard/[role]/loans', category: 'Finance' },
      { pageName: 'Assets', route: '/dashboard/[role]/assets', category: 'HR' },
      { pageName: 'Reports', route: '/dashboard/[role]/reports', category: 'Reports' },
      { pageName: 'Master', route: '/dashboard/[role]/master', category: 'Reports' },
      { pageName: 'Audit Logs', route: '/dashboard/[role]/audit-logs', category: 'Admin' },
      { pageName: 'Security', route: '/dashboard/[role]/security', category: 'Admin' },
      { pageName: 'Settings', route: '/dashboard/[role]/settings', category: 'Admin' },
      { pageName: 'Subscriptions', route: '/dashboard/[role]/subscriptions', category: 'Admin' },
    ];
    
    await Page.insertMany(pages);
    console.log('Pages seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding pages:', error);
    process.exit(1);
  }
};

seedPages();
