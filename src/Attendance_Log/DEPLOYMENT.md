# Production Deployment Guide

## Architecture Overview

This deployment guide covers setting up a production-grade biometric attendance system with the following components:

1. **VPS/Cloud Server** - Hosts the Express API and MongoDB
2. **Local Office Machine** - Runs the Windows Sync Agent
3. **Biometric Device** - ZKTeco T304F+ connected to local network

## VPS Deployment

### Server Requirements

- **OS**: Ubuntu 20.04+ or CentOS 8+
- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB recommended)
- **Storage**: 50GB+ SSD
- **Network**: Stable internet connection

### Step 1: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git
```

### Step 2: Deploy Application

```bash
# Clone repository (or deploy via CI/CD)
cd /var/www
git clone <your-repo-url> hrms-api
cd hrms-api/BackEnd

# Install dependencies
npm install --production

# Install attendance log specific dependencies
npm install zklib-js axios node-cron socket.io

# Build TypeScript
npm run build

# Create environment file
cp .env.example .env
nano .env
```

Configure `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/hrms
SYNC_AGENT_API_KEY=<generate-secure-random-key>
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

### Step 3: Configure MongoDB Security

```bash
# Enable authentication in MongoDB
sudo nano /etc/mongod.conf

# Add to security section:
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod

# Create admin user
mongosh
use admin
db.createUser({
  user: "admin",
  pwd: "secure_password",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

# Create application user
use hrms
db.createUser({
  user: "hrms_user",
  pwd: "secure_password",
  roles: [ { role: "readWrite", db: "hrms" } ]
})
exit

# Update MONGODB_URI in .env
MONGODB_URI=mongodb://hrms_user:secure_password@localhost:27017/hrms
```

### Step 4: Start Application with PM2

```bash
# Start the API server
pm2 start dist/server.js --name hrms-api

# Start cron scheduler (if using)
pm2 start dist/Attendance_Log/services/cron-scheduler.service.js --name hrms-cron

# Save PM2 configuration
pm2 save
pm2 startup
```

### Step 5: Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/hrms-api
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/hrms-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: Set up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

### Step 7: Configure Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status
```

## Local Office Machine Deployment

### Windows Machine Setup

#### Step 1: Install Prerequisites

1. **Install Node.js 18+**
   - Download from https://nodejs.org/
   - Install with default settings

2. **Install Git**
   - Download from https://git-scm.com/
   - Install with default settings

3. **Test network connectivity to biometric device**
   ```cmd
   ping 192.168.1.225
   telnet 192.168.1.225 4370
   ```

#### Step 2: Deploy Sync Agent

```cmd
# Clone repository
cd C:\
git clone <your-repo-url> hrms-sync-agent
cd hrms-sync-agent\BackEnd

# Install dependencies
npm install
npm install zklib-js axios node-cron

# Build TypeScript
npm run build

# Configure sync agent
notepad src\Attendance_Log\config\sync-agent.config.json
```

Configure `sync-agent.config.json`:

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
  "apiToken": "your_vps_sync_agent_api_key",
  "syncInterval": 15
}
```

#### Step 3: Test Sync Agent

```cmd
# Run standalone to test
node dist\Attendance_Log\services\sync-agent-standalone.js
```

Verify logs show successful connection and sync.

#### Step 4: Install as Windows Service

```cmd
# Install node-windows globally
npm install -g node-windows

# Install the service
node src\Attendance_Log\scripts\install-windows-service.js
```

The service will:
- Start automatically on Windows boot
- Run in the background
- Restart automatically if it crashes

Manage the service:
- Open Windows Services (Win+R, type `services.msc`)
- Find "Attendance Sync Agent"
- Start/Stop/Restart as needed

#### Step 5: Monitor Sync Agent

```cmd
# Check service status
sc query "Attendance Sync Agent"

# View service logs
# Logs are typically in:
# C:\Users\<username>\AppData\Roaming\nmlogs\
```

## Monitoring and Maintenance

### VPS Monitoring

```bash
# Check PM2 processes
pm2 list
pm2 logs hrms-api
pm2 monit

# Check MongoDB
sudo systemctl status mongod
mongosh
use hrms
db.AttendanceLog.countDocuments()
db.DailyAttendance.countDocuments()

# Check Nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check system resources
htop
df -h
free -m
```

### Database Backup

```bash
# Create backup script
sudo nano /usr/local/bin/backup-mongodb.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mongodb"
MONGODB_URI="mongodb://hrms_user:password@localhost:27017/hrms"

mkdir -p $BACKUP_DIR
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/backup_$DATE"
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" "$BACKUP_DIR/backup_$DATE"
rm -rf "$BACKUP_DIR/backup_$DATE"

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-mongodb.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /usr/local/bin/backup-mongodb.sh
```

### Log Rotation

```bash
# Configure PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## Security Hardening

### 1. API Security

- [ ] Use strong API keys (32+ characters)
- [ ] Enable rate limiting
- [ ] Implement IP whitelisting for sync agent
- [ ] Use HTTPS only
- [ ] Validate all input data
- [ ] Sanitize database queries

### 2. Server Security

```bash
# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Use SSH keys only
# Set: PasswordAuthentication no

# Restart SSH
sudo systemctl restart sshd

# Install fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. MongoDB Security

- [ ] Enable authentication
- [ ] Use strong passwords
- [ ] Restrict network access
- [ ] Enable encryption at rest
- [ ] Regular security updates

## Scaling Considerations

### Database Scaling

- **Read Replicas**: Add MongoDB read replicas for reporting
- **Sharding**: Consider sharding for large datasets
- **Indexing**: Ensure proper indexes on frequently queried fields
- **Caching**: Use Redis for caching frequently accessed data

### API Scaling

- **Load Balancing**: Use Nginx as load balancer
- **Horizontal Scaling**: Run multiple API instances behind load balancer
- **Queue System**: Use Redis/RabbitMQ for async processing
- **CDN**: Use CDN for static assets

### Sync Agent Scaling

- **Multiple Devices**: Run multiple sync agents for different branches
- **Queue System**: Implement queue for handling sync failures
- **Retry Logic**: Implement exponential backoff for failed syncs

## Disaster Recovery

### Backup Strategy

1. **Database Backups**: Daily automated backups
2. **Code Backups**: Git repository
3. **Configuration Backups**: Version control
4. **Off-site Backups**: Cloud storage for critical backups

### Recovery Procedure

1. **Restore Database**: From latest backup
2. **Deploy Code**: From Git repository
3. **Configure Environment**: From documentation
4. **Test**: Verify all functionality
5. **Switch DNS**: Update DNS to point to recovered server

## Performance Optimization

### Database Optimization

```javascript
// Create compound indexes for common queries
db.AttendanceLog.createIndex({ companyId: 1, branchId: 1, punchTime: -1 });
db.AttendanceLog.createIndex({ biometricUserId: 1, punchTime: 1 }, { unique: true });
db.DailyAttendance.createIndex({ employeeId: 1, date: 1 }, { unique: true });
```

### API Optimization

- **Response Compression**: Enable gzip compression
- **Caching**: Implement Redis caching
- **Pagination**: Always paginate large datasets
- **Query Optimization**: Use selective field projection

### Network Optimization

- **CDN**: Use CDN for static assets
- **HTTP/2**: Enable HTTP/2 in Nginx
- **Keep-Alive**: Enable persistent connections
- **Compression**: Enable gzip/brotli compression

## Troubleshooting

### Common Issues

1. **Sync Agent Not Connecting**
   - Check network connectivity to API
   - Verify API token
   - Check firewall settings
   - Review sync agent logs

2. **High Memory Usage**
   - Monitor MongoDB memory
   - Check for memory leaks in Node.js
   - Implement connection pooling
   - Add swap space if needed

3. **Slow API Response**
   - Check database query performance
   - Add missing indexes
   - Implement caching
   - Scale horizontally

## Support and Maintenance

### Regular Tasks

- **Daily**: Monitor logs and error rates
- **Weekly**: Review backup status
- **Monthly**: Security updates and patches
- **Quarterly**: Performance review and optimization

### Emergency Contacts

- **System Administrator**: [Contact]
- **Database Administrator**: [Contact]
- **Network Administrator**: [Contact]
- **Application Developer**: [Contact]
