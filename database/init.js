const { pool, testConnection } = require('./config');
const { logger } = require('../utils/errorHandler');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    logger.info('🚀 Starting database initialization...');
    
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Cannot connect to database');
    }

    // Read and execute schema file
    const schemaPath = path.join(__dirname, 'init.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    logger.info(`📝 Executing ${statements.length} SQL statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        await pool.execute(statement);
        successCount++;
      } catch (error) {
        // Ignore errors for CREATE DATABASE and INSERT IGNORE statements
        if (!statement.includes('CREATE DATABASE') && !statement.includes('INSERT IGNORE')) {
          logger.error('❌ Error executing statement:', {
            statement: statement.substring(0, 100) + '...',
            error: error.message
          });
          errorCount++;
        }
      }
    }

    logger.info('✅ Database initialized successfully!');
    logger.info('📊 Sample data has been inserted');
    
    // Test the setup by querying some data
    const [vehicles] = await pool.execute('SELECT COUNT(*) as count FROM vehicles');
    const [drivers] = await pool.execute('SELECT COUNT(*) as count FROM drivers');
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
    
    logger.info(`📈 Database contains: ${vehicles[0].count} vehicles, ${drivers[0].count} drivers, ${users[0].count} users`);
    
    return {
      success: true,
      vehicles: vehicles[0].count,
      drivers: drivers[0].count,
      users: users[0].count,
      statementsExecuted: successCount,
      errors: errorCount
    };
    
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Additional function to verify database integrity
async function verifyDatabase() {
  try {
    logger.info('🔍 Verifying database integrity...');
    
    // Check all required tables exist
    const requiredTables = ['users', 'vehicles', 'drivers', 'trips', 'maintenance_records', 'fuel_records'];
    const [tables] = await pool.execute('SHOW TABLES');
    const existingTables = tables.map(row => Object.values(row)[0]);
    
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    if (missingTables.length > 0) {
      throw new Error(`Missing tables: ${missingTables.join(', ')}`);
    }
    
    // Check admin user exists
    const [adminUsers] = await pool.execute('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
    if (adminUsers[0].count === 0) {
      throw new Error('No admin user found in database');
    }
    
    logger.info('✅ Database integrity verified');
    return { success: true, tables: existingTables.length };
    
  } catch (error) {
    logger.error('❌ Database verification failed:', error);
    throw error;
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => verifyDatabase())
    .then(() => {
      logger.info('🎉 Database setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeDatabase, verifyDatabase };
