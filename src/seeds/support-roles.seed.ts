import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Role from '../models/role.model';

dotenv.config();

const supportRoles = [
  {
    name: 'Support Manager',
    code: 'SUPPORT_MANAGER',
    description: 'Manages the support team, oversees ticket resolution, and handles escalated issues',
    isSystemRole: true,
    permissions: [
      { module: 'support', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'tickets', actions: ['read', 'create', 'update', 'delete', 'assign'] },
      { module: 'requests', actions: ['read', 'create', 'update', 'delete'] },
      { module: 'knowledge-base', actions: ['read', 'create', 'update', 'delete', 'publish'] },
      { module: 'announcements', actions: ['read', 'create', 'update', 'delete', 'publish'] },
      { module: 'reports', actions: ['read'] },
      { module: 'live-chat', actions: ['read', 'manage'] },
    ],
    status: 'active' as const,
  },
  {
    name: 'Support Executive',
    code: 'SUPPORT_EXECUTIVE',
    description: 'Handles day-to-day support operations, manages tickets and requests',
    isSystemRole: true,
    permissions: [
      { module: 'support', actions: ['read'] },
      { module: 'tickets', actions: ['read', 'create', 'update'] },
      { module: 'requests', actions: ['read', 'create', 'update'] },
      { module: 'knowledge-base', actions: ['read'] },
      { module: 'announcements', actions: ['read'] },
      { module: 'reports', actions: ['read'] },
    ],
    status: 'active' as const,
  },
  {
    name: 'Technical Support',
    code: 'TECHNICAL_SUPPORT',
    description: 'Handles technical issues and provides technical assistance',
    isSystemRole: true,
    permissions: [
      { module: 'support', actions: ['read'] },
      { module: 'tickets', actions: ['read', 'create', 'update'] },
      { module: 'technical-issues', actions: ['read', 'create', 'update', 'resolve'] },
      { module: 'knowledge-base', actions: ['read', 'create', 'update'] },
      { module: 'reports', actions: ['read'] },
    ],
    status: 'active' as const,
  },
  {
    name: 'Help Desk Agent',
    code: 'HELP_DESK_AGENT',
    description: 'First point of contact for support inquiries and basic issue resolution',
    isSystemRole: true,
    permissions: [
      { module: 'support', actions: ['read'] },
      { module: 'tickets', actions: ['read', 'create'] },
      { module: 'requests', actions: ['read', 'create'] },
      { module: 'knowledge-base', actions: ['read'] },
      { module: 'announcements', actions: ['read'] },
      { module: 'live-chat', actions: ['read', 'respond'] },
    ],
    status: 'active' as const,
  },
  {
    name: 'Customer Success Executive',
    code: 'CUSTOMER_SUCCESS_EXECUTIVE',
    description: 'Ensures customer satisfaction, handles feedback and proactive support',
    isSystemRole: true,
    permissions: [
      { module: 'support', actions: ['read'] },
      { module: 'tickets', actions: ['read', 'create', 'update'] },
      { module: 'requests', actions: ['read', 'create', 'update'] },
      { module: 'knowledge-base', actions: ['read', 'create', 'update'] },
      { module: 'announcements', actions: ['read', 'create'] },
      { module: 'reports', actions: ['read'] },
    ],
    status: 'active' as const,
  },
];

const seedSupportRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms');
    console.log('Connected to MongoDB');

    for (const roleData of supportRoles) {
      const existingRole = await Role.findOne({ code: roleData.code });
      if (existingRole) {
        console.log(`Role ${roleData.code} already exists, skipping...`);
        continue;
      }

      const role = new Role(roleData);
      await role.save();
      console.log(`Created role: ${role.name} (${role.code})`);
    }

    console.log('Support roles seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding support roles:', error);
    process.exit(1);
  }
};

seedSupportRoles();
