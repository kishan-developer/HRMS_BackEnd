# Realtime Software Integration Guide

This guide explains how to integrate Realtime Software with your HRMS attendance system.

## Overview

Realtime Software sends attendance data to your Express API via HTTP POST requests with Bearer token authentication.

## Configuration

### 1. Set Bearer Token

Add to your `.env` file:

```env
REALTIME_BEARER_TOKEN=abc123xyz
```

**Important**: Use a secure, random token in production. Generate one with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Register Routes

Add the Realtime attendance routes to your main router in `src/routes/index.ts`:

```typescript
import realtimeAttendanceRoutes from "../Attendance_Log/routes/realtime-attendance.routes";

router.use("/realtime", realtimeAttendanceRoutes);
```

This will create the following endpoints:
- `POST /api/v1/realtime/test` - Test endpoint (remove in production)
- `POST /api/v1/realtime/attendance` - Main attendance endpoint
- `GET /api/v1/realtime/attendance` - Get attendance records
- `GET /api/v1/realtime/stats` - Get statistics

## Realtime Software Configuration

### Recommended Settings

| Setting        | Value                                                                          |
| -------------- | ------------------------------------------------------------------------------ |
| Request Method | POST                                                                           |
| Authorization  | Bearer Token                                                                   |
| Content-Type   | application/json                                                               |
| Data Format    | Body                                                                           |
| API URL        | `https://yourdomain.com/api/v1/realtime/attendance`                           |

### Configure in Realtime Software

1. Open Realtime Software
2. Go to Settings → Integration → API
3. Enter the following:

```
Request Method: POST
Authorization Type: Bearer Token
Token: abc123xyz (or your secure token)
Content-Type: application/json
Data Format: Body
API URL: https://yourdomain.com/api/v1/realtime/attendance
```

## Data Format

Realtime Software sends the following JSON data:

```json
{
  "employee_code": "E1023",
  "log_datetime": "2025-09-19 08:45:00",
  "log_time": "08:45:00",
  "downloaded_at": "2025-09-19 08:46:00",
  "device_sn": "SN-009128"
}
```

## API Endpoints

### 1. Test Endpoint (Development Only)

**Endpoint:** `POST /api/v1/realtime/test`

Use this to debug the data format before configuring Realtime Software.

```bash
curl -X POST http://localhost:5000/api/v1/realtime/test \
  -H "Authorization: Bearer abc123xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_code": "E1023",
    "log_datetime": "2025-09-19 08:45:00",
    "log_time": "08:45:00",
    "downloaded_at": "2025-09-19 08:46:00",
    "device_sn": "SN-009128"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Test endpoint received data",
  "headers": {...},
  "query": {},
  "body": {...}
}
```

### 2. Main Attendance Endpoint

**Endpoint:** `POST /api/v1/realtime/attendance`

**Headers:**
```
Authorization: Bearer abc123xyz
Content-Type: application/json
```

**Body:**
```json
{
  "employee_code": "E1023",
  "log_datetime": "2025-09-19 08:45:00",
  "log_time": "08:45:00",
  "downloaded_at": "2025-09-19 08:46:00",
  "device_sn": "SN-009128"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Attendance received successfully",
  "data": {
    "_id": "...",
    "employee_code": "E1023",
    "log_datetime": "2025-09-19 08:45:00",
    ...
  }
}
```

**Duplicate Response:**
```json
{
  "success": true,
  "message": "Duplicate record - already exists",
  "duplicate": true
}
```

### 3. Get Attendance Records

**Endpoint:** `GET /api/v1/realtime/attendance`

**Query Parameters:**
- `employee_code` (optional) - Filter by employee code
- `device_sn` (optional) - Filter by device serial number
- `startDate` (optional) - Start date for filtering
- `endDate` (optional) - End date for filtering
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Records per page (default: 50)

**Example:**
```bash
curl "http://localhost:5000/api/v1/realtime/attendance?employee_code=E1023&page=1&limit=10"
```

### 4. Get Statistics

**Endpoint:** `GET /api/v1/realtime/stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRecords": 1500,
    "uniqueEmployees": 45,
    "uniqueDevices": 3,
    "employeeStats": [
      {
        "_id": "E1023",
        "totalPunches": 30,
        "firstPunch": "2025-09-01T09:00:00.000Z",
        "lastPunch": "2025-09-19T18:30:00.000Z",
        "devices": ["SN-009128", "SN-009129"]
      }
    ]
  }
}
```

## MongoDB Schema

The attendance data is stored in the `RealtimeAttendance` collection:

```typescript
{
  employee_code: String,      // Employee code from device
  log_datetime: String,       // Original datetime string
  log_time: String,           // Time only
  downloaded_at: String,      // When data was downloaded from device
  device_sn: String,          // Device serial number
  processed: Boolean,         // Internal tracking
  syncStatus: String,         // "pending" | "synced" | "failed"
  parsedLogDateTime: Date,    // Parsed date for querying
  branchId: String,           // Multi-tenant support
  companyId: String,          // Multi-tenant support
  createdAt: Date,            // Auto-generated
  updatedAt: Date             // Auto-generated
}
```

## Duplicate Prevention

The system automatically prevents duplicate attendance records using a compound unique index on:
- `employee_code`
- `log_datetime`
- `device_sn`

If a duplicate is received, the API returns success with `duplicate: true`.

## Real-Time Updates

The system emits Socket.IO events for real-time updates:

**Event:** `realtime:attendance:new`

**Payload:**
```json
{
  "_id": "...",
  "employee_code": "E1023",
  "log_datetime": "2025-09-19 08:45:00",
  "log_time": "08:45:00",
  "device_sn": "SN-009128",
  "receivedAt": "2025-09-19T08:46:00.000Z"
}
```

### Frontend Integration (Next.js)

```typescript
import io from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_API_URL);

socket.on("realtime:attendance:new", (attendance) => {
  console.log("New realtime attendance:", attendance);
  // Update UI in real-time
});
```

## Testing Before Production

### 1. Test the Endpoint

```bash
# Start your server
npm run dev

# Test the endpoint
curl -X POST http://localhost:5000/api/v1/realtime/test \
  -H "Authorization: Bearer abc123xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_code": "TEST001",
    "log_datetime": "2025-09-19 08:45:00",
    "log_time": "08:45:00",
    "downloaded_at": "2025-09-19 08:46:00",
    "device_sn": "TEST-SN-001"
  }'
```

### 2. Check Server Logs

You should see:
```
=== Realtime Software Test Endpoint ===
Headers: {...}
Query: {}
Body: {...}
========================================
```

### 3. Test Real Endpoint

```bash
curl -X POST http://localhost:5000/api/v1/realtime/attendance \
  -H "Authorization: Bearer abc123xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_code": "TEST001",
    "log_datetime": "2025-09-19 08:45:00",
    "log_time": "08:45:00",
    "downloaded_at": "2025-09-19 08:46:00",
    "device_sn": "TEST-SN-001"
  }'
```

### 4. Verify in MongoDB

```bash
mongosh
use hrms
db.RealtimeAttendance.find().pretty()
```

## Troubleshooting

### 401 Unauthorized

**Problem:** Authorization header missing or invalid

**Solution:**
- Check that `REALTIME_BEARER_TOKEN` is set in `.env`
- Verify the token matches exactly in Realtime Software configuration
- Ensure "Bearer " prefix is included

### 400 Bad Request

**Problem:** Missing required fields

**Solution:**
- Verify all required fields are present: `employee_code`, `log_datetime`, `log_time`, `downloaded_at`, `device_sn`
- Check field names match exactly (case-sensitive)

### 403 Forbidden

**Problem:** Invalid token

**Solution:**
- Regenerate token and update both `.env` and Realtime Software
- Ensure no extra spaces in token

### Duplicate Records

**Problem:** Same attendance received multiple times

**Solution:**
- This is normal behavior - duplicates are automatically handled
- Check response for `duplicate: true` flag
- System prevents database duplicates via unique index

### Connection Issues

**Problem:** Realtime Software cannot reach API

**Solution:**
- Verify API URL is accessible from Realtime Software machine
- Check firewall settings
- Ensure HTTPS is properly configured in production
- Test with curl from the same network as Realtime Software

## Security Best Practices

1. **Use HTTPS in production** - Never send Bearer tokens over HTTP
2. **Generate secure tokens** - Use cryptographically secure random tokens
3. **Rotate tokens regularly** - Change tokens periodically
4. **Monitor logs** - Watch for failed authentication attempts
5. **IP whitelisting** - Consider whitelisting Realtime Software IP address
6. **Rate limiting** - Implement rate limiting to prevent abuse

## Integration with Existing System

### Map Employee Codes

You may need to map Realtime employee codes to your internal employee IDs:

```typescript
// Example mapping function
const mapEmployeeCode = async (employeeCode: string) => {
  const employee = await Employee.findOne({ employeeCode });
  return employee?._id;
};
```

### Process Attendance

After receiving Realtime attendance, you can process it into your daily attendance system:

```typescript
// In receiveRealtimeAttendance controller
const employee = await mapEmployeeCode(employee_code);
if (employee) {
  await processAttendance(employee, parsedLogDateTime, device_sn);
}
```

## Production Checklist

- [ ] Set secure `REALTIME_BEARER_TOKEN` in production environment
- [ ] Enable HTTPS on API server
- [ ] Remove test endpoint from production routes
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Test with actual Realtime Software
- [ ] Verify data flow end-to-end
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Document the integration for your team

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify MongoDB connection
3. Test with curl command
4. Review Realtime Software configuration
5. Check network connectivity
