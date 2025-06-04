import { Sequelize } from "sequelize";
import db from "../config/database.js";

const { DataTypes } = Sequelize;

const Patient = db.define('patients', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notNull: {
                msg: 'Nama pasien tidak boleh kosong'
            },
            notEmpty: {
                msg: 'Nama pasien tidak boleh kosong'
            }
        }
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            isInt: {
                msg: 'Umur harus berupa angka'
            },
            min: {
                args: [0],
                msg: 'Umur tidak boleh kurang dari 0'
            },
            max: {
                args: [150],
                msg: 'Umur tidak boleh lebih dari 150'
            }
        }
    },
    gender: {
        type: DataTypes.ENUM('Laki-laki', 'Perempuan', 'Lainnya'),
        allowNull: true,
        validate: {
            isIn: {
                args: [['Laki-laki', 'Perempuan', 'Lainnya']],
                msg: 'Jenis kelamin harus Laki-laki, Perempuan, atau Lainnya'
            }
        }
    },
    blood_type: {
        type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'),
        allowNull: true,
        validate: {
            isIn: {
                args: [['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']],
                msg: 'Golongan darah tidak valid'
            }
        }
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    }
}, {
    tableName: 'patients',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default Patient; 