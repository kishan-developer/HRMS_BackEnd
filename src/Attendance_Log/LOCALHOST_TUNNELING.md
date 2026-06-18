# Exposing Localhost to Internet for Realtime Software

Since Realtime Software doesn't support localhost, you need to expose your local development server to the internet. Here are the best solutions:

## Solution 1: Ngrok (Recommended)

### Install Ngrok

**macOS:**
```bash
brew install ngrok/ngrok/ngrok
```

**Windows:**
Download from https://ngrok.com/download

**Linux:**
```bash
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

### Setup Ngrok

1. **Sign up for free account** at https://ngrok.com/signup
2. **Get your authtoken** from dashboard
3. **Configure ngrok:**
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

### Expose Your Backend

```bash
cd /Users/kishan/Desktop/Projects/HRMS_APP_Software/BackEnd

# Start your backend (in one terminal)
npm run dev

# In another terminal, start ngrok on port 5000
ngrok http 5000
```

Ngrok will provide a public URL like:
```
https://abc1-23-45-67-89.ngrok-free.app
```

### Configure Realtime Software

Use the ngrok URL:
```
API URL: https://abc1-23-45-67-89.ngrok-free.app/api/v1/realtime/attendance
```

### Ngrok Features

- **Free tier** provides HTTPS automatically
- **Inspect traffic** in real-time at http://localhost:4040
- **Replay requests** for debugging
- **Custom subdomains** (paid plan)

### Ngrok Configuration File

Create `ngrok.yml`:
```yaml
version: "2"
authtoken: YOUR_AUTH_TOKEN

tunnels:
  hrms-api:
    addr: 5000
    proto: http
    bind_tls: true
    inspect: true
    web_addr: 4040
```

Start with:
```bash
ngrok start hrms-api
```

## Solution 2: LocalTunnel

### Install LocalTunnel

```bash
npm install -g localtunnel
```

### Expose Your Backend

```bash
# Start your backend
npm run dev

# In another terminal
lt --port 5000
```

LocalTunnel will provide a URL like:
```
https://random-name.loca.lt
```

### Configure Realtime Software

```
API URL: https://random-name.loca.lt/api/v1/realtime/attendance
```

### Custom Subdomain (Optional)

```bash
lt --port 5000 --subdomain my-hrms-api
```

This gives: `https://my-hrms-api.loca.lt`

## Solution 3: Cloudflare Tunnel

### Install cloudflared

**macOS:**
```bash
brew install cloudflare/cloudflare/cloudflared
```

### Setup Cloudflare Tunnel

1. **Login:**
   ```bash
   cloudflared tunnel login
   ```

2. **Create tunnel:**
   ```bash
   cloudflared tunnel create hrms-api
   ```

3. **Configure tunnel** - Create `config.yml`:
   ```yaml
   tunnel: YOUR_TUNNEL_ID
   credentials-file: /path/to/credentials.json

   ingress:
     - hostname: your-domain.com
       service: http://localhost:5000
     - service: http_status:404
   ```

4. **Run tunnel:**
   ```bash
   cloudflared tunnel run hrms-api
   ```

## Solution 4: Temporary Cloud Server

### Deploy to Render/Railway/Vercel

**Render (Free tier):**
1. Push code to GitHub
2. Create account at https://render.com
3. Connect GitHub repo
4. Deploy as Web Service
5. Get public URL

**Railway (Free tier):**
1. Create account at https://railway.app
2. New Project → Deploy from GitHub
3. Get public URL

## Solution 5: SSH Tunneling (If you have a VPS)

If you have a VPS with public IP:

```bash
# On VPS
ssh -R 5000:localhost:5000 user@your-vps.com

# Then access via your-vps.com:5000
```

## Recommended Setup for Development

### Using Ngrok (Best for Development)

1. **Start your backend:**
   ```bash
   cd /Users/kishan/Desktop/Projects/HRMS_APP_Software/BackEnd
   npm run dev
   ```

2. **Start ngrok in new terminal:**
   ```bash
   ngrok http 5000
   ```

3. **Copy the ngrok HTTPS URL** (e.g., `https://abc1-23-45-67-89.ngrok-free.app`)

4. **Configure Realtime Software:**
   ```
   Request Method: POST
   Authorization: Bearer Token
   Token: abc123xyz
   Content-Type: application/json
   Data Format: Body
   API URL: https://abc1-23-45-67-89.ngrok-free.app/api/v1/realtime/attendance
   ```

5. **Test the endpoint:**
   ```bash
   curl -X POST https://abc1-23-45-67-89.ngrok-free.app/api/v1/realtime/test \
     -H "Authorization: Bearer abc123xyz" \
     -H "Content-Type: application/json" \
     -d '{"employee_code":"TEST001","log_datetime":"2025-09-19 08:45:00","log_time":"08:45:00","downloaded_at":"2025-09-19 08:46:00","device_sn":"TEST-SN-001"}'
   ```

6. **Monitor traffic** at http://localhost:4040

## Testing Without Realtime Software

### Use curl to simulate Realtime Software

```bash
# Replace with your ngrok URL
NGROK_URL="https://abc1-23-45-67-89.ngrok-free.app"

curl -X POST $NGROK_URL/api/v1/realtime/attendance \
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

## Production Deployment

For production, deploy to a proper cloud server:

1. **VPS** (DigitalOcean, AWS, GCP, Azure)
2. **PaaS** (Render, Railway, Heroku)
3. **Configure domain** with SSL certificate
4. **Use HTTPS** with Let's Encrypt

See `DEPLOYMENT.md` for detailed production deployment guide.

## Troubleshooting

### Ngrok Issues

**"Account exceeded free tier limits"**
- Free tier has limits on connections/bandwidth
- Upgrade to paid plan or wait for reset

**"Tunnel not found"**
- Restart ngrok
- Check authtoken is correct

**Connection timeout**
- Check if your backend is running on port 5000
- Verify firewall isn't blocking connections

### LocalTunnel Issues

**"Too many connections"**
- Free tier has rate limits
- Use custom subdomain or try ngrok

**Connection unstable**
- LocalTunnel can be less reliable than ngrok
- Consider using ngrok instead

### Backend Not Accessible

**Check if backend is running:**
```bash
curl http://localhost:5000
```

**Check port is correct:**
```bash
lsof -i :5000
```

**Check firewall:**
```bash
# macOS
sudo pfctl -d

# Or allow specific port
```

## Security Considerations

### Development Security

- **Never commit tokens** to git
- **Use environment variables** for sensitive data
- **Rotate ngrok URL** periodically
- **Monitor ngrok dashboard** for suspicious activity
- **Remove test endpoints** before exposing to internet

### Production Security

- **Always use HTTPS**
- **Implement rate limiting**
- **Use strong Bearer tokens**
- **Enable IP whitelisting** if possible
- **Monitor access logs**
- **Keep dependencies updated**

## Quick Start Script

Create `start-dev-with-tunnel.sh`:

```bash
#!/bin/bash

echo "Starting HRMS Backend..."
cd /Users/kishan/Desktop/Projects/HRMS_APP_Software/BackEnd
npm run dev &
BACKEND_PID=$!

echo "Starting Ngrok tunnel..."
ngrok http 5000 &
NGROK_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Ngrok PID: $NGROK_PID"
echo "Check ngrok dashboard at http://localhost:4040"

# Wait for user to stop
read -p "Press Enter to stop..."

kill $BACKEND_PID $NGROK_PID
echo "Stopped"
```

Make executable:
```bash
chmod +x start-dev-with-tunnel.sh
./start-dev-with-tunnel.sh
```

## Comparison

| Solution      | Free Tier | HTTPS | Custom Domain | Stability |
|--------------|-----------|-------|---------------|-----------|
| Ngrok        | Yes       | Yes   | Paid         | High      |
| LocalTunnel  | Yes       | Yes   | Yes          | Medium    |
| Cloudflare   | Yes       | Yes   | Yes          | High      |
| Cloud Server | No        | Manual| Yes          | High      |

**Recommendation:** Use **Ngrok** for development, deploy to cloud for production.
