const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { testConnection } = require('./database/config');
const { 
  globalErrorHandler, 
  requestLogger, 
  notFoundHandler 
} = require('./utils/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Railway (fixes X-Forwarded-For header issue)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Basic middleware
app.use(compression());
app.use(morgan('combined'));
app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for frontend
app.use('/css', express.static('css'));
app.use('/js', express.static('js'));
app.use(express.static('.'));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const { testConnection } = require('./database/config');
    const dbConnected = await testConnection();
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      name: process.env.APP_NAME || 'PROJECT KALI - ITVMS',
      database: dbConnected ? 'connected' : 'disconnected',
      university: 'NIT University Dar es Salaam'
    });
  } catch (error) {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      name: process.env.APP_NAME || 'PROJECT KALI - ITVMS',
      database: 'error',
      error: error.message,
      university: 'NIT University Dar es Salaam'
    });
  }
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/fuel', require('./routes/fuel'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/errors', require('./routes/errors'));

// Serve the main HTML file for the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler
app.use('*', notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

// Start server
async function startServer() {
  try {
    console.log('🚀 Starting NIT University Vehicle Management System...');
    
    // Test database connection with timeout
    console.log('🔍 Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('⚠️  Database connection failed, but server will start anyway');
      console.log('💡 The application will work, but database features may be limited');
    } else {
      console.log('✅ Database connection successful');
    }
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Server started successfully!');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🏫 ${process.env.APP_NAME || 'PROJECT KALI - ITVMS'}`);
      console.log(`🎓 ${process.env.UNIVERSITY_NAME || 'NIT University Dar es Salaam'}`);
    });
    
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
      }
    });
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('🔧 Error details:', error);
    // Don't exit immediately on Railway, let it retry
    if (process.env.RAILWAY_ENVIRONMENT === 'production') {
      console.log('🔄 Railway environment detected, allowing retry...');
      setTimeout(() => {
        process.exit(1);
      }, 5000);
    } else {
      process.exit(1);
    }
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = app;
