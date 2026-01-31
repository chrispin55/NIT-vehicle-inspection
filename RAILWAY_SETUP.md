# Railway.app Database Setup Guide

## 🚀 Railway Database Integration for PROJECT KALI - ITVMS

### 📋 Prerequisites
- Railway.app account
- GitHub repository connected to Railway
- Project code pushed to GitHub

## 🔧 Step 1: Deploy to Railway

1. **Go to Railway.app** and login
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose your repository**: `chrispin55/NIT-vehicle-inspection`
5. **Click "Deploy Now"**

## 🗄️ Step 2: Add MySQL Database

1. **In your Railway project**, click "New Service"
2. **Select "Add Database"**
3. **Choose "MySQL"**
4. **Give it a name** (e.g., `nit-database`)
5. **Click "Add MySQL"**

## ⚙️ Step 3: Configure Environment Variables

Railway automatically provides these MySQL environment variables:

### Database Variables (Auto-provided by Railway):
- `RAILWAY_PRIVATE_MYSQL_HOST` - Database host
- `RAILWAY_PRIVATE_MYSQL_USER` - Database username  
- `RAILWAY_PRIVATE_MYSQL_PASSWORD` - Database password
- `RAILWAY_PRIVATE_MYSQL_DATABASE_NAME` - Database name
- `RAILWAY_PRIVATE_MYSQL_PORT` - Database port (usually 3306)

### Additional Variables to Add:
In your Railway project settings, add these environment variables:

```bash
# Server Configuration
NODE_ENV=production
PORT=$PORT

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=https://your-app-name.railway.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Application Settings
APP_NAME=PROJECT KALI - ITVMS
APP_VERSION=1.0.0
UNIVERSITY_NAME=NIT University Dar es Salaam

# Security Settings
ENCRYPTION_KEY=your-encryption-key-here
API_KEY=your-api-key-here

# Logging
LOG_LEVEL=info
ENABLE_CLOUD_LOGGING=false
```

## 🔐 Step 4: Generate Security Keys

### JWT Secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Encryption Key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### API Key:
```bash
node -e "console.log('api_' + require('crypto').randomBytes(32).toString('hex'))"
```

## 🗃️ Step 5: Initialize Database

1. **Open Railway Console** for your web service
2. **Run database initialization**:
```bash
npm run init-db
```

Or manually run:
```bash
node database/init.js
```

## ✅ Step 6: Verify Setup

### Check Health Endpoint:
Visit: `https://your-app-name.railway.app/health`

Should return:
```json
{
  "status": "OK",
  "timestamp": "2024-01-31T...",
  "uptime": 123.456,
  "environment": "production",
  "database": "connected"
}
```

### Test Login:
- URL: `https://your-app-name.railway.app`
- Username: `admin`
- Password: `nit2023`

## 🔧 Database Connection Details

Your application will automatically connect to Railway MySQL using:

```javascript
// Database configuration (automatically detected)
const dbConfig = {
  host: process.env.RAILWAY_PRIVATE_MYSQL_HOST,
  user: process.env.RAILWAY_PRIVATE_MYSQL_USER,
  password: process.env.RAILWAY_PRIVATE_MYSQL_PASSWORD,
  database: process.env.RAILWAY_PRIVATE_MYSQL_DATABASE_NAME,
  port: process.env.RAILWAY_PRIVATE_MYSQL_PORT
};
```

## 📊 Railway Dashboard Features

### Monitoring:
- **Logs**: View application logs
- **Metrics**: Monitor performance
- **Deployments**: Track deployment history
- **Environment Variables**: Manage configuration

### Database Management:
- **MySQL Console**: Access database directly
- **Connection String**: Copy for external tools
- **Backups**: Automatic backups included

## 🚨 Troubleshooting

### Common Issues:

1. **Database Connection Failed**:
   - Check MySQL service is running
   - Verify environment variables
   - Check Railway logs

2. **JWT Secret Missing**:
   - Add JWT_SECRET to environment variables
   - Restart the service

3. **CORS Issues**:
   - Update CORS_ORIGIN to your Railway URL
   - Check the exact URL format

4. **Build Failures**:
   - Check package.json scripts
   - Verify all dependencies are installed
   - Review build logs

### Debug Commands:
```bash
# Check environment variables
env | grep RAILWAY

# Test database connection
node -e "const {testConnection} = require('./database/config'); testConnection().then(console.log)"

# Check logs
railway logs
```

## 🔄 Deployment Workflow

### Automatic Deployment:
1. Push changes to GitHub
2. Railway automatically rebuilds
3. New version deployed

### Manual Deployment:
```bash
# Using Railway CLI
railway up

# Or redeploy in Railway dashboard
```

## 📱 Mobile Access

Your app will be available at:
- **Web**: `https://your-app-name.railway.app`
- **Mobile Responsive**: Works on all devices

## 🔗 Integration Complete

Once these steps are completed:
- ✅ Database automatically provisioned by Railway
- ✅ Environment variables configured
- ✅ Application deployed and accessible
- ✅ Database initialized with sample data
- ✅ Ready for production use

## 🎯 Next Steps

1. **Customize** the appearance with enhanced CSS
2. **Add your own data** to the database
3. **Configure** additional features
4. **Monitor** performance in Railway dashboard

Your PROJECT KALI ITVMS is now running on Railway with a fully managed MySQL database! 🚀
