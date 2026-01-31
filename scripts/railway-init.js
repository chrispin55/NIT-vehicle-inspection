#!/usr/bin/env node

// Railway Database Initialization Script
// This script initializes the database when deployed on Railway

const { initializeDatabase, verifyDatabase } = require('../database/init.js');
const { logger } = require('../utils/errorHandler');

async function initRailwayDatabase() {
  try {
    logger.info('🚀 Initializing Railway database...');
    
    // Initialize database schema and data
    const initResult = await initializeDatabase();
    
    if (initResult.success) {
      logger.info('✅ Database initialized successfully:', {
        vehicles: initResult.vehicles,
        drivers: initResult.drivers,
        users: initResult.users,
        statements: initResult.statementsExecuted
      });
      
      // Verify database integrity
      const verifyResult = await verifyDatabase();
      
      if (verifyResult.success) {
        logger.info('✅ Database verification passed');
        logger.info('🎉 Railway database setup completed successfully!');
        
        console.log('\n🎊 Railway Database Setup Complete!');
        console.log('📊 Database Statistics:');
        console.log(`   - Vehicles: ${initResult.vehicles}`);
        console.log(`   - Drivers: ${initResult.drivers}`);
        console.log(`   - Users: ${initResult.users}`);
        console.log(`   - Tables: ${verifyResult.tables}`);
        console.log('\n🔐 Default Login:');
        console.log('   Username: admin');
        console.log('   Password: nit2023');
        console.log('\n🌐 Your app is ready at: ' + (process.env.RAILWAY_PUBLIC_DOMAIN || 'https://your-app.railway.app'));
        
      } else {
        logger.error('❌ Database verification failed');
        process.exit(1);
      }
    } else {
      logger.error('❌ Database initialization failed');
      process.exit(1);
    }
    
  } catch (error) {
    logger.error('💥 Railway database initialization failed:', error);
    console.error('\n❌ Database setup failed. Please check the logs and try again.');
    process.exit(1);
  }
}

// Run initialization
if (require.main === module) {
  initRailwayDatabase();
}

module.exports = { initRailwayDatabase };
