const mysql = require('mysql2/promise');
require('dotenv').config();

const { logger, DatabaseError, handleDatabaseError } = require('../utils/errorHandler');

const dbConfig = {
  host: process.env.DB_HOST || process.env.RAILWAY_PRIVATE_MYSQL_HOST || 'localhost',
  user: process.env.DB_USER || process.env.RAILWAY_PRIVATE_MYSQL_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.RAILWAY_PRIVATE_MYSQL_PASSWORD || '',
  database: process.env.DB_NAME || process.env.RAILWAY_PRIVATE_MYSQL_DATABASE_NAME || 'nit_vehicle_management',
  port: process.env.DB_PORT || process.env.RAILWAY_PRIVATE_MYSQL_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

// Use Cloud SQL in production (disabled for now)
const isProduction = process.env.NODE_ENV === 'production';
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production';
const useCloudSQL = false; // Disabled until Cloud SQL is properly configured

let pool;

async function initializePool() {
  try {
    if (isRailway) {
      logger.info('🔧 Initializing Railway MySQL connection...');
      pool = mysql.createPool(dbConfig);
    } else {
      logger.info('🔧 Initializing local MySQL connection...');
      pool = mysql.createPool(dbConfig);
    }

    // Test the connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    logger.info('✅ Database pool initialized successfully');
    return pool;
  } catch (error) {
    logger.error('❌ Failed to initialize database pool:', error);
    throw new DatabaseError('Failed to initialize database connection', error);
  }
}

async function testConnection() {
  try {
    if (!pool) {
      await initializePool();
    }
    
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    
    logger.info('✅ Database connection test successful');
    return true;
  } catch (error) {
    logger.error('❌ Database connection test failed:', error);
    return false;
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    logger.info('Database pool closed');
  }
}

// Initialize pool on module load
initializePool().catch((error) => {
  logger.error('Failed to initialize database pool on startup:', error);
  // Don't throw error to allow application to start in some cases
  // The error will be handled when trying to use the database
});

module.exports = {
  pool: pool || mysql.createPool(dbConfig),
  testConnection,
  closePool,
  config: dbConfig,
  initializePool,
  isCloudSQL: useCloudSQL
};
