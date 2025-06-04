import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig = {
    host: '34.72.200.235',
    user: 'root',
    password: '', // Sesuaikan dengan password MySQL Anda
    multipleStatements: true // Mengizinkan multiple SQL statements
};

const DB_NAME = 'medical_records_db';

const cleanupDatabase = async () => {
    let connection;
    try {
        console.log('🧹 Starting database cleanup...');

        // Buat koneksi tanpa memilih database
        connection = await mysql.createConnection(dbConfig);

        // Drop database jika ada
        console.log('🗑️ Dropping databases if they exist...');
        await connection.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
        await connection.query('DROP DATABASE IF EXISTS medical_records');
        console.log('✅ Old databases dropped successfully');

        // Buat database baru
        console.log('📁 Creating fresh database...');
        await connection.query(`CREATE DATABASE ${DB_NAME}`);
        
        // Pilih database yang baru dibuat
        await connection.query(`USE ${DB_NAME}`);
        console.log(`✅ Using database: ${DB_NAME}`);

        // Baca file SQL untuk cleanup tables
        const sqlPath = path.join(__dirname, 'cleanup.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Jalankan SQL commands
        await connection.query(sql);
        console.log('✅ Database cleanup completed successfully');

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔒 Database connection closed');
        }
    }
};

// Run cleanup
cleanupDatabase().catch(error => {
    console.error('Fatal error during cleanup:', error);
    process.exit(1);
});