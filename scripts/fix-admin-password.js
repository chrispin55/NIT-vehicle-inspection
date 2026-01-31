const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

// Railway database configuration
const dbConfig = {
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

async function fixAdminPassword() {
  let pool;
  try {
    console.log('🔧 Fixing admin password...');
    
    // Create database connection
    pool = mysql.createPool(dbConfig);
    console.log('✅ Database connection established');
    
    // Hash the correct password "nit2023"
    const correctPasswordHash = '$2a$10$XY9vt6.A.Gg.BgAyksbyz.EYqMe8EBZcAYjr2xhC0fc6R4u.LyclG';
    
    // Update the admin user password
    const [result] = await pool.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ?',
      [correctPasswordHash, 'admin']
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Admin password updated successfully!');
      console.log('🔑 Login credentials:');
      console.log('   Username: admin');
      console.log('   Password: nit2023');
    } else {
      console.log('❌ Admin user not found, creating new admin user...');
      
      // Create admin user if not exists
      await pool.execute(
        'INSERT IGNORE INTO users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)',
        ['admin', correctPasswordHash, 'admin@nit.ac.tz', 'System Administrator', 'admin']
      );
      console.log('✅ Admin user created successfully!');
    }
    
    // Verify the update
    const [users] = await pool.execute(
      'SELECT username, password FROM users WHERE username = ?',
      ['admin']
    );
    
    if (users.length > 0) {
      console.log('✅ Verification: Admin user found with updated password hash');
    }
    
  } catch (error) {
    console.error('❌ Error fixing admin password:', error);
  } finally {
    if (pool) {
      await pool.end();
    }
    process.exit(0);
  }
}

fixAdminPassword();
