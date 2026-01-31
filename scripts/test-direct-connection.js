// Test Direct Database Connection
// Using the provided MySQL connection string

const mysql = require('mysql2/promise');

async function testDirectConnection() {
    console.log('🔍 Testing direct MySQL connection...');
    
    const config = {
        host: 'turntable.proxy.rlwy.net',
        port: 12096,
        user: 'root',
        password: 'lTatesqgMIzyrKwiJGDVyJNrJgbQmpNe',
        database: 'railway',
        charset: 'utf8mb4'
    };
    
    try {
        console.log('📡 Connecting to:', `${config.user}@${config.host}:${config.port}/${config.database}`);
        
        const connection = await mysql.createConnection(config);
        console.log('✅ Database connection successful!');
        
        // Test basic query
        const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
        console.log(`📊 Users table count: ${rows[0].count}`);
        
        // Test vehicles table
        const [vehicles] = await connection.execute('SELECT COUNT(*) as count FROM vehicles');
        console.log(`🚗 Vehicles table count: ${vehicles[0].count}`);
        
        // Test drivers table
        const [drivers] = await connection.execute('SELECT COUNT(*) as count FROM drivers');
        console.log(`👨‍💼 Drivers table count: ${drivers[0].count}`);
        
        await connection.end();
        console.log('✅ Connection test completed successfully!');
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('🔧 Error details:', error);
        process.exit(1);
    }
}

testDirectConnection();
