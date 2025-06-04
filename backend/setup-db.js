import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import models
import MedicalRecord from './models/MedicalRecordModel.js';

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

const DB_NAME = 'medical_records_db'; // Nama database yang konsisten

const setupDatabase = async () => {
    let connection;
    try {
        console.log('🔄 Starting database setup...');

        // Buat koneksi tanpa database dulu
        connection = await mysql.createConnection(dbConfig);

        // Drop kedua database jika ada
        console.log('🗑️ Cleaning up old databases...');
        await connection.query('DROP DATABASE IF EXISTS medical_records_db');
        await connection.query('DROP DATABASE IF EXISTS medical_records');
        
        // Buat database baru
        console.log('📁 Creating fresh database...');
        await connection.query(`CREATE DATABASE ${DB_NAME}`);
        
        // Gunakan database
        await connection.query(`USE ${DB_NAME}`);
        console.log(`✅ Using database: ${DB_NAME}`);

        // Baca file SQL
        const sqlPath = path.join(__dirname, 'setup.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Jalankan SQL commands
        await connection.query(sql);
        console.log('✅ Tables created successfully');

        // Verifikasi struktur
        const [tables] = await connection.query('SHOW TABLES');
        console.log('📊 Created tables:', tables.map(t => Object.values(t)[0]).join(', '));

        // Verifikasi database yang ada
        const [databases] = await connection.query('SHOW DATABASES');
        console.log('📚 Available databases:', databases.map(d => Object.values(d)[0]).join(', '));

    } catch (error) {
        console.error('❌ Database setup failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔒 Database connection closed');
        }
    }
};

// Run setup
setupDatabase().catch(console.error);