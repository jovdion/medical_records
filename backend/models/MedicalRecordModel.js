import { Sequelize } from "sequelize";
import db from "../config/database.js";
import Patient from "./PatientModel.js";
import Doctor from "./DoctorModel.js";

const { DataTypes } = Sequelize;

const MedicalRecord = db.define('medical_records', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    patient_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'patients',
            key: 'id'
        }
    },
    patient_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    patient_age: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
            max: 150
        }
    },
    patient_gender: {
        type: DataTypes.ENUM('Laki-laki', 'Perempuan', 'Lainnya'),
        allowNull: true
    },
    blood_type: {
        type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'),
        allowNull: true
    },
    visit_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    doctor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'doctors',
            key: 'id'
        }
    },
    doctor_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    symptoms: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    diagnosis: {
        type: DataTypes.STRING,
        allowNull: false
    },
    treatment: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    freezeTableName: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['patient_name']
        },
        {
            fields: ['visit_date']
        },
        {
            fields: ['diagnosis']
        }
    ]
});

// Define associations
MedicalRecord.belongsTo(Patient, {
    foreignKey: 'patient_id',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});

MedicalRecord.belongsTo(Doctor, {
    foreignKey: 'doctor_id',
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
});

export default MedicalRecord; 