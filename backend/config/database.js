import { Sequelize } from "sequelize";
import dotenv from 'dotenv';

dotenv.config();

const DB_NAME = process.env.DB_NAME || 'medical_records_db';
const DB_USERNAME = process.env.DB_USERNAME || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_HOST = process.env.DB_HOST || '34.72.200.235';
const DB_PORT = process.env.DB_PORT || 3306;

console.log('Database Config:', {
  name: DB_NAME,
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USERNAME
});

// Database configuration
const sequelizeConfig = {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "mysql",
  dialectOptions: {
    connectTimeout: 60000, // Increased timeout to 60 seconds
    timezone: '+00:00',
    dateStrings: true,
    typeCast: true,
    // Add SSL if needed
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  pool: {
    max: 10,         // Increased max connections
    min: 0,
    acquire: 60000,  // Increased acquire timeout
    idle: 20000,     // Increased idle timeout
    evict: 30000,    // Connection eviction time
    retry: {
      match: [
        /Deadlock/i,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /TimeoutError/,
        /SequelizeConnectionAcquireTimeoutError/
      ],
      max: 3 // Maximum retry attempts
    }
  },
  timezone: '+00:00',
  logging: console.log, // Enable logging for debugging
  retry: {
    max: 3 // Global retry attempts
  }
};

// Initialize Sequelize connection
const db = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, sequelizeConfig);

// Test the connection with retries
const testConnection = async (retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempting database connection (attempt ${attempt}/${retries})...`);
      await db.authenticate();
      console.log('✅ Database connection has been established successfully.');
      return true;
    } catch (error) {
      console.error(`❌ Connection attempt ${attempt} failed:`, error.message);
      
      if (error.original && error.original.code === 'ER_BAD_DB_ERROR') {
        console.log('🔄 Database does not exist, attempting to create it...');
        try {
          const tempDb = new Sequelize('', DB_USERNAME, DB_PASSWORD, {
            ...sequelizeConfig,
            database: null
          });
          
          await tempDb.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME};`);
          console.log(`✅ Database ${DB_NAME} created successfully`);
          await tempDb.close();
          continue; // Try to connect again
        } catch (createError) {
          console.error('❌ Failed to create database:', createError);
          if (attempt === retries) throw createError;
        }
      }
      
      if (attempt === retries) {
        console.error('❌ All connection attempts failed');
        throw error;
      }
      
      // Wait before next retry
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`Waiting ${delay}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Test connection on startup
testConnection().catch(error => {
  console.error('Fatal database connection error:', error);
  process.exit(1);
});

export default db;