# Attendance_Log - Production-Grade Biometric Attendance System

A comprehensive 3-service architecture for real-time biometric attendance management using ZKTeco T304F+ devices.

## Architecture Overview

```
┌─────────────────────┐
│ Realtime T304F+     │
│ 192.168.1.225       │
└──────────┬──────────┘
           │ TCP/IP
           ▼
┌─────────────────────┐
│ Local Sync Agent    │
│ Node.js Service     │
│ Windows Service     │
└──────────┬──────────┘
           │ HTTPS
           ▼
┌─────────────────────┐
│ VPS Express API     │
│ attendance-api      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ MongoDB             │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Next.js HRMS        │
└─────────────────────┘
```

## Project Structure

```
Attendance_Log/
├── models/                      # MongoDB Models
│   ├── device.model.ts         # Biometric device configuration
│   ├── employee.model.ts       # Employee biometric mapping
│   ├── attendance.model.ts     # Raw attendance logs
│   └── daily-attendance.model.ts # Processed daily attendance
│
├── controllers/                 # API Controllers
│   ├── attendance-log.controller.ts    # Sync and log management
│   └── attendance-calculation.controller.ts # Calculation logic
│
├── services/                    # Business Logic
│   ├── device-connection.service.ts    # ZKTeco device connection
│   ├── attendance-sync.service.ts      # Attendance sync logic
│   ├── sync-agent.service.ts           # Sync agent orchestrator
│   ├── sync-agent-standalone.ts        # Standalone Windows service
│   └── cron-scheduler.service.ts       # Scheduled tasks
│
├── routes/                      # API Routes
│   └── attendance-log.routes.ts
│
├── middleware/                  # Express Middleware
│   └── auth.middleware.ts       # API key authentication
│
├── config/                      # Configuration
│   ├── socket.config.ts         # Socket.IO setup
│   └── sync-agent.config.json   # Sync agent configuration
│
├── types/                       # TypeScript Types
│   └── index.ts
│
└── utils/                       # Utility Functions
    ├── socket.util.ts           # Socket utilities
    └── attendance-calculator.util.ts # Calculation helpers
```

## MongoDB Models

### Device
```typescript
{
  branchId: String,
  deviceName: String,
  deviceId: Number,
  ipAddress: String,
  port: Number,
  serialNumber: String,
  status: "online" | "offline" | "error",
  lastSyncAt: Date,
  companyId: String,
  location: String
}
```

### Employee
```typescript
{
  employeeCode: String,
  name: String,
  department: String,
  designation: String,
  biometricUserId: Number,
  branchId: String,
  companyId: String,
  departmentId: String,
  active: Boolean,
  shiftId: ObjectId
}
```

### Attendance Log
```typescript
{
  employeeId: ObjectId,
  biometricUserId: Number,
  punchTime: Date,
  verifyMode: Number,
  deviceId: ObjectId,
  branchId: String,
  companyId: String,
  departmentId: String,
  source: "biometric" | "manual" | "mobile" | "gps",
  punchType: "IN" | "OUT" | "UNKNOWN",
  processed: Boolean,
  syncStatus: "pending" | "synced" | "failed"
}
```

### Daily Attendance
```typescript
{
  employeeId: ObjectId,
  date: Date,
  checkIn: Date,
  checkOut: Date,
  workingHours: Number,
  status: "present" | "absent" | "half-day" | "late-entry" | "early-exit" | "overtime",
  branchId: String,
  companyId: String,
  departmentId: String,
  deviceId: ObjectId,
  lateMinutes: Number,
  earlyExitMinutes: Number,
  overtimeMinutes: Number,
  shiftId: ObjectId
}
```

## Installation

### Backend API (Express)

```bash
cd BackEnd
npm install zklib-js axios node-cron socket.io
```

### Local Sync Agent (Windows)

```bash
cd BackEnd
npm install zklib-js axios node-cron
```

## Configuration

### Sync Agent Config

Edit `src/Attendance_Log/config/sync-agent.config.json`:

```json
{
  "deviceConfigs": [
    {
      "ipAddress": "192.168.1.225",
      "port": 4370,
      "deviceId": 1,
      "branchId": "branch001",
      "companyId": "company001"
    }
  ],
  "apiUrl": "https://api.yourdomain.com",
  "apiToken": "YOUR_SECRET_TOKEN_HERE",
  "syncInterval": 15
}
```

### Environment Variables

Add to your `.env` file:

```env
SYNC_AGENT_API_KEY=your_secret_api_key_here
MONGODB_URI=your_mongodb_connection_string
```

## Usage

### 1. Register Biometric Device

```bash
POST /api/v1/attendance-log/devices/register
{
  "branchId": "branch001",
  "deviceName": "Main Entrance",
  "deviceId": 1,
  "ipAddress": "192.168.1.225",
  "port": 4370,
  "serialNumber": "T304F+12345",
  "companyId": "company001",
  "location": "Main Building"
}
```

### 2. Register Employee with Biometric ID

```bash
POST /api/v1/attendance-log/employees/register
{
  "employeeCode": "EMP001",
  "name": "John Doe",
  "department": "Engineering",
  "designation": "Software Engineer",
  "biometricUserId": 123,
  "branchId": "branch001",
  "companyId": "company001",
  "departmentId": "dept001"
}
```

### 3. Start Local Sync Agent (Windows)

```bash
# Build the project
npm run build

# Run standalone sync agent
node dist/Attendance_Log/services/sync-agent-standalone.js
```

### 4. Install as Windows Service

```bash
npm install -g node-windows
node scripts/install-windows-service.js
```

### 5. API Endpoints

#### Sync Attendance (Internal - Sync Agent)
```bash
POST /api/v1/attendance-log/sync
Headers: Authorization: Bearer YOUR_SECRET_TOKEN
Body: {
  "logs": [
    {
      "biometricUserId": 123,
      "punchTime": "2024-01-15T09:00:00Z",
      "verifyMode": 1,
      "deviceId": 1,
      "branchId": "branch001",
      "companyId": "company001",
      "deviceIp": "192.168.1.225"
    }
  ]
}
```

#### Get Attendance Logs
```bash
GET /api/v1/attendance-log/logs?companyId=company001&branchId=branch001&startDate=2024-01-01&endDate=2024-01-31&page=1&limit=50
```

#### Get Daily Attendance
```bash
GET /api/v1/attendance-log/daily?companyId=company001&branchId=branch001&date=2024-01-15&page=1&limit=50
```

#### Calculate Daily Attendance
```bash
POST /api/v1/attendance-log/calculate
Body: {
  "date": "2024-01-15"
}
```

#### Get Attendance Report
```bash
GET /api/v1/attendance-log/report?companyId=company001&branchId=branch001&startDate=2024-01-01&endDate=2024-01-31
```

## Real-Time Updates with Socket.IO

### Server Setup

```typescript
import { createServer } from "http";
import { Server } from "socket.io";
import { initializeSocket } from "./Attendance_Log/config/socket.config";

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

initializeSocket(io);
```

### Next.js Frontend Integration

```typescript
import io from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_API_URL);

socket.on("attendance:new", (attendance) => {
  console.log("New attendance:", attendance);
  // Update UI in real-time
});
```

## Attendance Calculation Logic

### Default Shift Configuration
- **Shift Start**: 9:00 AM
- **Shift End**: 6:00 PM
- **Grace Period**: 15 minutes
- **Half Day Threshold**: 4 hours
- **Overtime Threshold**: 30 minutes after shift end

### Status Determination
- **Present**: On time, full working hours
- **Absent**: No punches for the day
- **Half Day**: Less than 4 working hours
- **Late Entry**: Check-in after 9:15 AM
- **Early Exit**: Check-out before 5:45 PM
- **Overtime**: Check-out after 6:30 PM

## Scheduled Tasks

### Daily Attendance Calculation
Runs automatically at midnight (00:00) to calculate attendance for the previous day.

```typescript
import { CronSchedulerService } from "./Attendance_Log/services/cron-scheduler.service";

const cronService = new CronSchedulerService();
cronService.startAllJobs();
```

## Multi-Branch Support

Every attendance record includes:
- `companyId`: Company identifier
- `branchId`: Branch identifier  
- `departmentId`: Department identifier
- `employeeId`: Employee reference

This enables filtering and reporting at any organizational level.

## Security Features

- **API Key Authentication**: For sync agent communication
- **HTTPS Required**: All API communications
- **IP Whitelist**: Configurable for sync agent
- **Rate Limiting**: Prevent API abuse
- **Duplicate Prevention**: Database-level unique constraints

## Device Connection Testing

Before deploying, test device connectivity:

```bash
ping 192.168.1.225
telnet 192.168.1.225 4370
```

## Troubleshooting

### Device Connection Issues
1. Verify device IP address is correct
2. Check if device port is 4370 or 5005
3. Ensure device is on same network as sync agent
4. Test with ping and telnet

### Sync Issues
1. Check API token in sync-agent.config.json
2. Verify API URL is accessible
3. Check MongoDB connection
4. Review sync agent logs

### Attendance Calculation Issues
1. Ensure employee biometricUserId matches device
2. Check date format in calculation request
3. Verify shift configuration
4. Review daily attendance logs

## Future Enhancements

- Face Recognition Integration
- GPS-based Attendance
- Mobile App Attendance
- Leave Management Integration
- Payroll Integration
- Shift Management
- Geo-fencing
- Multi-Company SaaS Support
- WhatsApp Notifications
- Attendance Correction Workflow
- Real-time Dashboard Analytics

## Production Deployment

### VPS Requirements
- Docker
- Nginx
- PM2
- MongoDB
- Redis (for caching)
- Socket.IO
- SSL Certificate

### Local Office Machine
- Windows 11
- Node.js 18+
- PM2
- Stable internet connection

### Monitoring
- Device status monitoring
- Sync agent health checks
- API response time tracking
- Database performance monitoring
- Error logging and alerting

## License

Proprietary - All rights reserved
