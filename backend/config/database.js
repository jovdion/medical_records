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

// Local database configuration
const sequelizeConfig = {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "mysql",
  dialectOptions: {
    connectTimeout: 30000,
    timezone: '+00:00',
    dateStrings: true,
    typeCast: true
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  timezone: '+00:00',
  logging: false
};

// Initialize Sequelize connection
const db = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, sequelizeConfig);

// Test the connection
const testConnection = async () => {
  try {
    await db.authenticate();
    console.log('✅ Database connection has been established successfully.');
  } catch (error) {
    if (error.original && error.original.code === 'ER_BAD_DB_ERROR') {
      console.log('🔄 Database does not exist, attempting to create it...');
      // Create a temporary connection without database selection
      const tempDb = new Sequelize('', DB_USERNAME, DB_PASSWORD, {
        ...sequelizeConfig,
        database: null
      });
      
      try {
        await tempDb.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME};`);
        console.log(`✅ Database ${DB_NAME} created successfully`);
        await tempDb.close();
        
        // Try to connect again
        await db.authenticate();
        console.log('✅ Successfully connected to the new database');
      } catch (createError) {
        console.error('❌ Failed to create database:', createError);
        throw createError;
      }
    } else {
      console.error('❌ Unable to connect to the database:', error);
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        original: error.original
      });
      throw error;
    }
  }
};

// Test connection on startup
testConnection();

export default db;