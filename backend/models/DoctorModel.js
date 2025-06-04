import { Sequelize } from "sequelize";
import db from "../config/database.js";

const { DataTypes } = Sequelize;

const Doctor = db.define('doctors', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Nama dokter tidak boleh kosong'
            },
            len: {
                args: [2, 100],
                msg: 'Nama dokter harus antara 2 sampai 100 karakter'
            }
        }
    },
    specialty: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Spesialisasi tidak boleh kosong'
            },
            len: {
                args: [2, 100],
                msg: 'Spesialisasi harus antara 2 sampai 100 karakter'
            }
        }
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
            is: {
                args: /^[0-9+\-() ]*$/,
                msg: 'Nomor telepon hanya boleh berisi angka dan karakter +, -, (, )'
            },
            len: {
                args: [8, 20],
                msg: 'Nomor telepon harus antara 8 sampai 20 karakter'
            }
        }
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: {
                msg: 'Format email tidak valid'
            },
            len: {
                args: [5, 100],
                msg: 'Email harus antara 5 sampai 100 karakter'
            }
        }
    }
}, {
    tableName: 'doctors',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

export default Doctor; 