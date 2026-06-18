# HRMS Backend API

Backend API for HRMS (Human Resource Management System) built with Node.js, Express, TypeScript, and PostgreSQL.

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- Redis (optional, for caching)
- AWS S3 (optional, for file storage)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hrms
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key-change-this-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET=hrms-documents

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Server
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE hrms;
```

2. Run the SQL migration scripts (to be added in migrations folder):
```bash
# Run migration scripts from migrations/ folder
```

## Development

Run the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Build

Build the TypeScript code:
```bash
npm run build
```

## Production

Run the production server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/change-password/:userId` - Change password
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password

### Health Check
- `GET /health` - Health check endpoint

## Project Structure

```
src/
├── config/          # Configuration files (database, redis, s3)
├── controllers/     # API controllers
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic services
├── middleware/      # Express middleware (auth, rbac, error)
├── validators/      # Request validators
├── utils/           # Utility functions
└── app.ts           # Main application entry point
```

## Features Implemented

- ✅ Project structure with TypeScript
- ✅ Database configuration (PostgreSQL)
- ✅ Redis configuration
- ✅ S3 configuration
- ✅ Authentication middleware (JWT)
- ✅ RBAC middleware
- ✅ Error handling middleware
- ✅ Auth service (login, register, refresh tokens, change password)
- ✅ User model
- ✅ Employee model
- ✅ Auth controller
- ✅ Auth routes
- ✅ Utility functions (date, email, uuid)

## Next Steps

1. Install dependencies: `npm install`
2. Set up PostgreSQL database
3. Create database tables using SQL scripts from BACKEND_PLAN.md
4. Run the development server
5. Implement remaining modules (Employees, Attendance, Leave, etc.)

## Technology Stack

- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Caching**: Redis
- **Authentication**: JWT
- **File Storage**: AWS S3
- **Validation**: express-validator
- **Email**: Nodemailer

## License

ISC
