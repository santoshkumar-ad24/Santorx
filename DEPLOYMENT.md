# Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Configuration
- [ ] Update `.env` file with production values:
  - `NODE_ENV=production`
  - `DATABASE_URL` - Production MongoDB URI
  - `JWT_SECRET` - Strong random secret key
  - `CLOUDINARY_*` - Correct API credentials
  - `PORT` - Production port

### 2. Database
- [ ] MongoDB Atlas or self-hosted MongoDB configured
- [ ] Database backups configured
- [ ] Connection pooling enabled

### 3. Security
- [ ] All sensitive data in `.env` (not hardcoded)
- [ ] `.gitignore` configured to exclude `.env` and `node_modules`
- [ ] Helmet security headers enabled ✓
- [ ] HTTPS enabled on production
- [ ] Input validation enabled ✓
- [ ] CORS configured for production domain

### 4. Code Quality
- [ ] Error handling middleware active ✓
- [ ] Request logging enabled ✓
- [ ] Health check endpoint available ✓
- [ ] Graceful shutdown implemented ✓

### 5. Performance
- [ ] Static file caching enabled ✓
- [ ] Database connection pooling enabled ✓
- [ ] Environment-based configuration ✓

## Deployment Steps

### For Heroku/Railway/Render:
```bash
# Install dependencies
npm install

# Set environment variables in deployment dashboard
# DATABASE_URL, JWT_SECRET, etc.

# Deploy (platform specific)
git push heroku main
```

### For VPS (DigitalOcean, AWS, etc.):
```bash
# SSH into server
ssh user@your-server-ip

# Clone repository
git clone your-repo-url
cd BLOG_WEB

# Install dependencies
npm install

# Set up environment
nano .env  # Configure with production values

# Use PM2 for process management
npm install -g pm2
pm2 start server.js --name "blog-web"
pm2 startup
pm2 save

# Setup Nginx reverse proxy (optional but recommended)
# Setup SSL certificate (Let's Encrypt recommended)
```

## Production Environment Template

```
NODE_ENV=production
PORT=3000
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/blog_db
JWT_SECRET=your_very_secure_random_key_min_32_chars
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CORS_ORIGIN=https://yourdomain.com
```

## Health Check
After deployment, verify:
```bash
curl http://localhost:3000/health
```

## Monitoring
- Log aggregation: Use services like LogRocket, Sentry, or ELK Stack
- Error tracking: Set up alerts for unhandled exceptions
- Performance monitoring: Track response times and database queries
- Uptime monitoring: Use services like Uptime Robot

## Rollback Procedure
```bash
pm2 delete blog-web
git checkout previous-commit-hash
npm install
pm2 start server.js --name "blog-web"
```

## Notes
- Remember to install `dotenv` package: `npm install dotenv`
- Test deployment on staging environment first
- Keep backups of production database
- Monitor logs regularly
