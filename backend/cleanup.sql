-- Drop both databases if they exist
DROP DATABASE IF EXISTS medical_records_db;
DROP DATABASE IF EXISTS medical_records;

-- Create fresh database
CREATE DATABASE medical_records_db;

-- Drop groups if they exist
DROP TABLE IF EXISTS groups_medical_records;
DROP TABLE IF EXISTS groups_doctors;
DROP TABLE IF EXISTS groups_patients;

-- Drop regular tables if they exist
DROP TABLE IF EXISTS medical_records;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS patients;

-- Drop the groups themselves
DROP VIEW IF EXISTS groups;

-- Drop tables in correct order to handle foreign key constraints
DROP TABLE IF EXISTS medical_records;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS patients; 