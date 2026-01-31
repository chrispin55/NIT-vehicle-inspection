// Railway MySQL Configuration
// This file handles Railway-specific database configuration

const mysql = require('mysql2/promise');
const { logger } = require('../utils/errorHandler');

// Railway MySQL Configuration
const RAILWAY_DB_CONFIG = {
  // Direct MySQL connection string
  host: 'turntable.proxy.rlwy.net',
  port: 12096,
  user: 'root',
  password: 'lTatesqgMIzyrKwiJGDVyJNrJgbQmpNe',
  database: 'railway',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Fallback configuration for local development
const LOCAL_DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nit_vehicle_management',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Detect if running on Railway
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production' || 
                  process.env.RAILWAY_PUBLIC_DOMAIN ||
                  process.env.RAILWAY_SERVICE_NAME ||
                  process.env.RAILWAY_VOLUME_NAME ||
                  process.env.RAILWAY_TCP_PROXY_PORT; // Additional Railway indicators

// Get appropriate configuration
const dbConfig = isRailway ? RAILWAY_DB_CONFIG : LOCAL_DB_CONFIG;

let pool = null;

async function testRailwayConnection() {
  let connection = null;
  try {
    console.log('🔍 Testing Railway MySQL connection...');
    console.log('📍 Host:', dbConfig.host);
    console.log('🔌 Port:', dbConfig.port);
    console.log('👤 User:', dbConfig.user);
    console.log('💾 Database:', dbConfig.database);
    console.log('🏗️ Is Railway:', isRailway);

    connection = await mysql.createConnection(dbConfig);
    
    // Test basic query
    const [rows] = await connection.execute('SELECT VERSION() as version');
    console.log('📊 MySQL Version:', rows[0].version);
    
    // Test database access
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log('👤 Users in database:', users[0].count);
    
    console.log('✅ Railway MySQL connection successful!');
    return true;
    
  } catch (error) {
    console.error('❌ Railway MySQL connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('SQL State:', error.sqlState);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function initializeRailwayPool() {
  try {
    console.log('🚀 Initializing Railway MySQL pool...');
    console.log('🏗️ Environment:', isRailway ? 'Railway' : 'Local');
    console.log('📍 Host:', dbConfig.host);
    console.log('💾 Database:', dbConfig.database);

    pool = mysql.createPool(dbConfig);
    
    // Test the pool
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    console.log('✅ Railway MySQL pool initialized successfully');
    return pool;
    
  } catch (error) {
    console.error('❌ Failed to initialize Railway MySQL pool:', error);
    throw error;
  }
}

function getPool() {
  return pool;
}

function getConfig() {
  return dbConfig;
}

// Export functions
module.exports = {
  testRailwayConnection,
  initializeRailwayPool,
  getPool,
  getConfig,
  dbConfig,
  isRailway
};
