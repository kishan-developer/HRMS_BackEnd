# Attendance Log System - Installation Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB instance running
- ZKTeco T304F+ biometric device on local network
- Windows machine for local sync agent (if using Windows Service)
- VPS or cloud server for API deployment

## Step 1: Install Dependencies

### Backend API Dependencies

```bash
cd /Users/kishan/Desktop/Projects/HRMS_APP_Software/BackEnd
npm install zklib-js axios node-cron socket.io
```

### Local Sync Agent Dependencies (if running separately)

```bash
npm install zklib-js axios node-cron
```

### Windows Service Dependencies (optional)

```bash
npm install -g node-windows
```

## Step 2: Configure Environment Variables

Add to `BackEnd/.env`:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/hrms

# Sync Agent API Key (generate a secure random string)
SYNC_AGENT_API_KEY=your_secure_random_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=production

# Socket.IO Configuration
SOCKET_PORT=5001
```

## Step 3: Configure Sync Agent

Edit `BackEnd/src/Attendance_Log/config/sync-agent.config.json`:

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
  "apiToken": "your_secure_random_api_key_here",
  "syncInterval": 15
}
```

**Important:** The `apiToken` must match `SYNC_AGENT_API_KEY` in your `.env` file.

## Step 4: Test Device Connectivity

Before deploying, test if your biometric device is accessible:

```bash
# Test network connectivity
ping 192.168.1.225

# Test port connectivity (if telnet is available)
telnet 192.168.1.225 4370
```

If your device uses port 5005 instead of 4370, update the config accordingly.

## Step 5: Build the Project

```bash
cd /Users/kishan/Desktop/Projects/HRMS_APP_Software/BackEnd
npm run build
```

## Step 6: Register API Routes

Add the attendance log routes to your main router in `BackEnd/src/routes/index.ts`:

```typescript
import attendanceLogRoutes from "../Attendance_Log/routes/attendance-log.routes";

router.use("/attendance-log", attendanceLogRoutes);
```

## Step 7: Initialize Socket.IO (Optional)

In your main server file `BackEnd/src/server.ts`:

```typescript
import { createServer } from "http";
import { Server } from "socket.io";
import { initializeSocket } from "./Attendance_Log/config/socket.config";

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  }
});

initializeSocket(io);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Step 8: Register Biometric Device

Use the API to register your biometric device:

```bash
curl -X POST http://localhost:5000/api/v1/attendance-log/devices/register \
  -H "Content-Type: application/json" \
  -d '{
    "branchId": "branch001",
    "deviceName": "Main Entrance",
    "deviceId": 1,
    "ipAddress": "192.168.1.225",
    "port": 4370,
    "serialNumber": "T304F+12345",
    "companyId": "company001",
    "location": "Main Building"
  }'
```

## Step 9: Register Employees

Register employees with their biometric user IDs:

```bash
curl -X POST http://localhost:5000/api/v1/attendance-log/employees/register \
  -H "Content-Type: application/json" \
  -d '{
    "employeeCode": "EMP001",
    "name": "John Doe",
    "department": "Engineering",
    "designation": "Software Engineer",
    "biometricUserId": 123,
    "branchId": "branch001",
    "companyId": "company001",
    "departmentId": "dept001"
  }'
```

## Step 10: Start the Sync Agent

### Option A: Run as Standalone Process

```bash
node dist/Attendance_Log/services/sync-agent-standalone.js
```

### Option B: Install as Windows Service

```bash
# Install the service
node src/Attendance_Log/scripts/install-windows-service.js

# The service will start automatically
# Check Windows Services for "Attendance Sync Agent"
```

To uninstall the Windows Service:

```bash
node src/Attendance_Log/scripts/uninstall-windows-service.js
```

### Option C: Run with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start the sync agent
pm2 start dist/Attendance_Log/services/sync-agent-standalone.js --name attendance-sync-agent

# Monitor logs
pm2 logs attendance-sync-agent

# Stop the service
pm2 stop attendance-sync-agent

# Remove from PM2
pm2 delete attendance-sync-agent
```

## Step 11: Start Cron Scheduler (Optional)

If you want automatic daily attendance calculation, add this to your server startup:

```typescript
import { CronSchedulerService } from "./Attendance_Log/services/cron-scheduler.service";

const cronService = new CronSchedulerService();
cronService.startAllJobs();
```

## Step 12: Verify Installation

Test the sync endpoint:

```bash
curl -X POST http://localhost:5000/api/v1/attendance-log/sync \
  -H "Authorization: Bearer your_secure_random_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

## Troubleshooting

### Device Connection Issues

1. **Device not reachable**
   - Check device IP address in config
   - Ensure device is on same network
   - Test with `ping 192.168.1.225`

2. **Port connection failed**
   - Try port 5005 instead of 4370
   - Check firewall settings
   - Test with `telnet 192.168.1.225 4370`

3. **Authentication errors**
   - Verify API token matches between config and .env
   - Check SYNC_AGENT_API_KEY is set correctly

### Sync Issues

1. **API not receiving data**
   - Check API URL in sync-agent.config.json
   - Verify API is running and accessible
   - Check network connectivity to API server

2. **Duplicate attendance logs**
   - This is normal - duplicates are automatically skipped
   - Check sync status in database

3. **Employee not found**
   - Ensure employee is registered with correct biometricUserId
   - Check companyId and branchId match

### Windows Service Issues

1. **Service won't start**
   - Check if Node.js is in system PATH
   - Verify the compiled JavaScript file exists
   - Check Windows Event Viewer for error logs

2. **Service stops immediately**
   - Check sync-agent.config.json syntax
   - Verify MongoDB connection
   - Review service logs

### Database Issues

1. **Connection refused**
   - Verify MongoDB is running
   - Check MONGODB_URI in .env
   - Ensure MongoDB is accessible from the server

2. **Index creation errors**
   - Ensure MongoDB user has necessary permissions
   - Check for existing conflicting indexes

## Production Deployment

### VPS Setup

1. **Install dependencies on VPS**
   ```bash
   ssh user@your-vps
   cd /path/to/BackEnd
   npm install --production
   ```

2. **Set up PM2**
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name hrms-api
   pm2 startup
   pm2 save
   ```

3. **Configure Nginx reverse proxy**
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Set up SSL with Let's Encrypt**
   ```bash
   sudo certbot --nginx -d api.yourdomain.com
   ```

### Local Office Machine Setup

1. **Install Node.js on Windows machine**
2. **Copy the project to the Windows machine**
3. **Configure sync-agent.config.json with production API URL**
4. **Install and start Windows Service**

### Monitoring

- **Device Status**: Monitor via `/api/v1/attendance-log/devices`
- **Sync Health**: Check sync agent logs
- **API Health**: Use health check endpoints
- **Database Performance**: Monitor MongoDB metrics

## Security Checklist

- [ ] Change default API keys
- [ ] Enable HTTPS in production
- [ ] Configure firewall rules
- [ ] Set up IP whitelisting for sync agent
- [ ] Enable rate limiting on API
- [ ] Regular security updates
- [ ] Backup MongoDB regularly
- [ ] Monitor access logs

## Support

For issues or questions:
1. Check the main README.md
2. Review troubleshooting section
3. Check application logs
4. Verify configuration files
