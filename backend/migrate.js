import dotenv from 'dotenv';
import db from './config/database.js';

// Import all models
import './models/Usermodel.js';
import './models/CatatanModel.js';

dotenv.config();

const runMigration = async () => {
  try {
    console.log('🔄 Starting database migration...');
    
    // Test connection
    await db.authenticate();
    console.log('✅ Database connection established');
    
    // Show current tables
    const [results] = await db.query("SHOW TABLES");
    console.log('📋 Current tables in database:', results);
    
    // Sync database (create tables)
    console.log('🔧 Creating/updating tables...');
    await db.sync({ 
      force: false,  // Change to true to drop and recreate all tables (DANGEROUS!)
      alter: true    // This will alter existing tables to match models
    });
    
    console.log('✅ Migration completed successfully!');
    
    // Show tables after migration
    const [newResults] = await db.query("SHOW TABLES");
    console.log('📋 Tables after migration:', newResults);
    
    // Describe Users table structure
    const [userTableStructure] = await db.query("DESCRIBE Users");
    console.log('📊 Users table structure:', userTableStructure);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await db.close();
    console.log('🔒 Database connection closed');
    process.exit(0);
  }
};

// Run migration
runMigration();