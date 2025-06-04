import { DataTypes } from 'sequelize';

export async function up(queryInterface) {
    // First rename record_id to id
    await queryInterface.renameColumn('MedicalRecords', 'record_id', 'id');

    // Add new columns
    await queryInterface.addColumn('MedicalRecords', 'visit_date', {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    });

    await queryInterface.addColumn('MedicalRecords', 'symptoms', {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ''
    });

    await queryInterface.addColumn('MedicalRecords', 'treatment', {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ''
    });

    await queryInterface.addColumn('MedicalRecords', 'notes', {
        type: DataTypes.TEXT,
        allowNull: true
    });

    await queryInterface.addColumn('MedicalRecords', 'doctor_name', {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Unknown'
    });

    // Add new indexes
    await queryInterface.addIndex('MedicalRecords', ['visit_date']);
}

export async function down(queryInterface) {
    // Remove indexes first
    await queryInterface.removeIndex('MedicalRecords', ['visit_date']);

    // Remove new columns
    await queryInterface.removeColumn('MedicalRecords', 'visit_date');
    await queryInterface.removeColumn('MedicalRecords', 'symptoms');
    await queryInterface.removeColumn('MedicalRecords', 'treatment');
    await queryInterface.removeColumn('MedicalRecords', 'notes');
    await queryInterface.removeColumn('MedicalRecords', 'doctor_name');

    // Rename id back to record_id
    await queryInterface.renameColumn('MedicalRecords', 'id', 'record_id');
} 