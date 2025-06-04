-- Drop tables if they exist
DROP TABLE IF EXISTS medical_records;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'doctor', 'staff') NOT NULL DEFAULT 'staff',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Create doctors table
CREATE TABLE doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    specialty VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    user_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Create patients table
CREATE TABLE patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT,
    gender ENUM('Laki-laki', 'Perempuan', 'Lainnya'),
    blood_type ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'),
    address TEXT,
    phone VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Create medical_records table
CREATE TABLE medical_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    patient_name VARCHAR(100) NOT NULL,
    patient_age INT,
    patient_gender ENUM('Laki-laki', 'Perempuan', 'Lainnya'),
    blood_type ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'),
    visit_date DATE NOT NULL,
    doctor_id INT NOT NULL,
    doctor_name VARCHAR(100) NOT NULL,
    symptoms TEXT NOT NULL,
    diagnosis VARCHAR(255) NOT NULL,
    treatment TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_patient_name (patient_name),
    INDEX idx_visit_date (visit_date),
    INDEX idx_diagnosis (diagnosis),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Insert sample users (password: password123)
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@hospital.com', '$2b$10$vQc8LHZR.UF3XxlVGHMWXOQw8V3HHh6g4KKEeX8xEKZrIBKA9X5Uy', 'admin'),
('drjohn', 'john.doe@hospital.com', '$2b$10$vQc8LHZR.UF3XxlVGHMWXOQw8V3HHh6g4KKEeX8xEKZrIBKA9X5Uy', 'doctor'),
('drjane', 'jane.smith@hospital.com', '$2b$10$vQc8LHZR.UF3XxlVGHMWXOQw8V3HHh6g4KKEeX8xEKZrIBKA9X5Uy', 'doctor'),
('drrobert', 'robert.johnson@hospital.com', '$2b$10$vQc8LHZR.UF3XxlVGHMWXOQw8V3HHh6g4KKEeX8xEKZrIBKA9X5Uy', 'doctor'),
('staff1', 'staff1@hospital.com', '$2b$10$vQc8LHZR.UF3XxlVGHMWXOQw8V3HHh6g4KKEeX8xEKZrIBKA9X5Uy', 'staff');

-- Insert sample doctors (now with user_id references)
INSERT INTO doctors (name, specialty, phone, email, user_id) VALUES
('Dr. John Doe', 'Umum', '081234567890', 'john.doe@hospital.com', (SELECT id FROM users WHERE username = 'drjohn')),
('Dr. Jane Smith', 'Anak', '081234567891', 'jane.smith@hospital.com', (SELECT id FROM users WHERE username = 'drjane')),
('Dr. Robert Johnson', 'Penyakit Dalam', '081234567892', 'robert.johnson@hospital.com', (SELECT id FROM users WHERE username = 'drrobert'));

-- Insert sample patients
INSERT INTO patients (name, age, gender, blood_type, address, phone) VALUES
('Ahmad Yani', 35, 'Laki-laki', 'O+', 'Jl. Merdeka No. 123', '081234567893'),
('Siti Rahayu', 28, 'Perempuan', 'B+', 'Jl. Sudirman No. 456', '081234567894'),
('Budi Santoso', 45, 'Laki-laki', 'A+', 'Jl. Gatot Subroto No. 789', '081234567895');

-- Insert sample medical records
INSERT INTO medical_records (
    patient_id, patient_name, patient_age, patient_gender, blood_type, 
    visit_date, doctor_id, doctor_name, symptoms, diagnosis, treatment, notes
) VALUES
(1, 'Ahmad Yani', 35, 'Laki-laki', 'O+', 
 CURDATE(), 1, 'Dr. John Doe', 
 'Demam tinggi 38.5°C\nBatuk kering\nPilek', 
 'Flu', 
 'Paracetamol 500mg 3x sehari\nVitamin C 500mg 2x sehari\nCTM 1x sehari', 
 'Istirahat yang cukup, banyak minum air putih'),

(2, 'Siti Rahayu', 28, 'Perempuan', 'B+',
 DATE_SUB(CURDATE(), INTERVAL 1 DAY), 2, 'Dr. Jane Smith',
 'Nyeri ulu hati\nMual\nKembung', 
 'Gastritis', 
 'Antasida 3x sehari\nOmeprazole 20mg 1x sehari', 
 'Hindari makanan pedas dan asam, makan teratur'),

(3, 'Budi Santoso', 45, 'Laki-laki', 'A+',
 DATE_SUB(CURDATE(), INTERVAL 2 DAY), 3, 'Dr. Robert Johnson',
 'Sakit kepala berdenyut\nMual\nSensitif terhadap cahaya', 
 'Migrain', 
 'Paracetamol 500mg\nAnti mual\nIstirahat di ruangan gelap', 
 'Kurangi paparan cahaya terang, hindari trigger migrain'); 