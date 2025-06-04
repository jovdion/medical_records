import { Sequelize } from "sequelize";
import dotenv from 'dotenv';

dotenv.config();

const DB_NAME = process.env.DB_NAME || 'medical_records_db';
const DB_USERNAME = process.env.DB_USERNAME || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;

const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: "mysql",
    logging: false
});

async function cleanupDatabase() {
    try {
        // Drop all tables
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        const [results] = await sequelize.query('SHOW TABLES');
        for (const row of results) {
            const tableName = row[`Tables_in_${DB_NAME}`];
            console.log(`Dropping table: ${tableName}`);
            await sequelize.query(`DROP TABLE IF EXISTS ${tableName}`);
        }
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.log('✅ All tables dropped successfully');
    } catch (error) {
        console.error('❌ Error cleaning up database:', error);
    } finally {
        await sequelize.close();
    }
}

cleanupDatabase(); 