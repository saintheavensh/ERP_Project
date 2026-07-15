# Deployment Guide

## Setup & Deployment Instructions

---

## 1. Prerequisites

### 1.1 Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| **Bun** | 1.1+ | JavaScript runtime & package manager |
| **Node.js** | 20+ | (Optional, for some tooling) |
| **Git** | Latest | Version control |

### 1.2 Install Bun

**Windows (PowerShell):**
```powershell
irm bun.sh/install.ps1 | iex
```

**macOS/Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

---

## 2. Development Setup

### 2.1 Clone & Install

```bash
# Clone repository
git clone <repository-url>
cd coba

# Install all dependencies (monorepo)
bun install
```

### 2.2 Database Setup

```bash
cd apps/backend

# Push schema to database (creates local.db)
bun run db:push

# (Optional) Seed initial data
bun run db:seed
```

### 2.3 Run Development Servers

**Option A: Run All (Recommended)**
```bash
# From root directory
bun dev
```

**Option B: Run Separately**
```bash
# Terminal 1: Backend
cd apps/backend
bun dev

# Terminal 2: Frontend
cd apps/frontend
bun dev
```

### 2.4 Access Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:4000 |
| Drizzle Studio | Run `bun run db:studio` |

---

## 3. Environment Variables

### 3.1 Backend (.env)

```env
# apps/backend/.env

# JWT Secret (REQUIRED - change in production!)
JWT_SECRET=your-super-secret-key-change-me

# Database path
DATABASE_URL=./local.db

# Server port
PORT=4000
```

### 3.2 Frontend (.env)

```env
# apps/frontend/.env

# API URL
PUBLIC_API_URL=http://localhost:4000
```

---

## 4. Production Build

### 4.1 Build Frontend

```bash
cd apps/frontend
bun run build
```

Output: `apps/frontend/build/`

### 4.2 Build Backend

Bun runs TypeScript directly, no build needed. For production:

```bash
cd apps/backend
# Run directly
bun run src/index.ts
```

---

## 5. Deployment Options

### 5.1 VPS / Self-Hosted

#### Backend Deployment

1. **Copy files to server:**
```bash
scp -r apps/backend user@server:/app/backend
```

2. **Install dependencies:**
```bash
cd /app/backend
bun install --production
```

3. **Run with PM2 (recommended):**
```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'sth-backend',
    script: 'bun',
    args: 'run src/index.ts',
    cwd: '/app/backend',
    env: {
      NODE_ENV: 'production',
      JWT_SECRET: 'your-production-secret',
      PORT: 4000
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.cjs

# Save PM2 list for auto-restart
pm2 save
pm2 startup
```

4. **Nginx Reverse Proxy:**
```nginx
# /etc/nginx/sites-available/api.example.com
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Frontend Deployment (Static)

1. **Build:**
```bash
cd apps/frontend
bun run build
```

2. **Deploy to Nginx:**
```bash
cp -r build/* /var/www/example.com/
```

3. **Nginx Config:**
```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/example.com;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 5.2 Vercel (Frontend Only)

1. Connect GitHub repo to Vercel
2. Set root directory: `apps/frontend`
3. Set environment variables:
   - `PUBLIC_API_URL`: Your backend URL
4. Deploy

### 5.3 Railway / Render (Full Stack)

#### Backend on Railway

1. Create new project
2. Connect GitHub repo
3. Set root directory: `apps/backend`
4. Set start command: `bun run src/index.ts`
5. Add environment variables

#### Note on SQLite

For production, consider migrating to:
- **Turso** (SQLite edge database)
- **PostgreSQL** (via Drizzle)
- **PlanetScale** (MySQL)

---

## 6. Database Backup

### 6.1 Manual Backup

```bash
# Copy database file
cp apps/backend/local.db backup/local-$(date +%Y%m%d).db
```

### 6.2 Automated Backup Script

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/db"
DB_PATH="/app/backend/local.db"
DATE=$(date +%Y%m%d_%H%M)

mkdir -p $BACKUP_DIR
cp $DB_PATH $BACKUP_DIR/local-$DATE.db

# Keep only last 7 days
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
```

Add to crontab:
```bash
# Every day at 2 AM
0 2 * * * /path/to/backup.sh
```

---

## 7. SSL/HTTPS Setup

### 7.1 Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d example.com -d api.example.com

# Auto-renewal (crontab)
0 0 1 * * certbot renew --quiet
```

---

## 8. Monitoring

### 8.1 PM2 Monitoring

```bash
# Status
pm2 status

# Logs
pm2 logs sth-backend

# Monitor
pm2 monit
```

### 8.2 Health Check

```bash
curl http://localhost:4000/health
```

Expected response:
```json
{"status":"ok","db_users":1}
```

---

## 9. Troubleshooting

### 9.1 Common Issues

| Issue | Solution |
|-------|----------|
| Port already in use | `lsof -i :4000` then `kill -9 <PID>` |
| Database locked | Stop all processes accessing db |
| CORS errors | Check frontend API URL config |
| Auth errors | Verify JWT_SECRET matches |

### 9.2 Reset Database

```bash
cd apps/backend

# Delete database
rm local.db

# Recreate
bun run db:push
bun run db:seed
```

---

## 10. Default Credentials

After seeding, default admin account:

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

> ⚠️ **IMPORTANT**: Change default password in production!
