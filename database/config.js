const mysql = require('mysql2/promise');

const { logger, DatabaseError, handleDatabaseError } = require('../utils/errorHandler');

// Import Railway configuration
const { dbConfig, isRailway, initializeRailwayPool } = require('./railway-config');

// Use Cloud SQL in production (disabled for now)
const isProduction = process.env.NODE_ENV === 'production';
const useCloudSQL = false; // Disabled until Cloud SQL is properly configured

let pool;

async function initializePool() {
  try {
    // Debug logging for Railway environment
    logger.info('🔧 Initializing database connection...');
    logger.info('🏗️ Environment:', isRailway ? 'Railway' : 'Local');
    logger.info('📍 Host:', dbConfig.host);
    logger.info('🔌 Port:', dbConfig.port);
    logger.info('👤 User:', dbConfig.user);
    logger.info('💾 Database:', dbConfig.database);
    
    // Use Railway-specific initialization
    if (isRailway) {
      logger.info('� Using Railway MySQL configuration...');
      pool = await initializeRailwayPool();
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

// Initialize pool on first use instead of module load
// This prevents startup crashes in Railway
let poolInitialized = false;

async function ensurePoolInitialized() {
  if (!poolInitialized) {
    try {
      await initializePool();
      poolInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize database pool:', error);
      // Don't throw, allow application to start
      poolInitialized = false;
    }
  }
  return pool;
}

// Test connection function for startup
async function testConnection() {
  try {
    await ensurePoolInitialized();
    if (!pool) return false;
    
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error.message);
    return false;
  }
}

module.exports = {
  getPool: async () => {
    await ensurePoolInitialized();
    return pool;
  },
  pool: pool, // Direct access (may be null until initialized)
  testConnection,
  closePool,
  config: dbConfig,
  initializePool,
  isCloudSQL: useCloudSQL
};
