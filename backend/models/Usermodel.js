import { DataTypes } from 'sequelize';
import db from '../config/database.js';  // Updated path to match your structure

const User = db.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true,
            len: [2, 50]
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            notEmpty: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [6, 255]
        }
    },
    role: {
        type: DataTypes.ENUM('admin', 'doctor', 'staff'),
        allowNull: false,
        defaultValue: 'staff'
    },
    refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'users', // Match the table name in setup.sql
    timestamps: true,    // This will use created_at and updated_at
    createdAt: 'created_at', // Match the column names in setup.sql
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['email']
        },
        {
            unique: true,
            fields: ['username']
        }
    ]
});

// Export the User model
export default User;