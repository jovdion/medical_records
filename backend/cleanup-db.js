import { Sequelize } from "sequelize";
import db from "./config/database.js";
import MedicalRecord from "./models/MedicalRecordModel.js";
import Patient from "./models/PatientModel.js";
import Doctor from "./models/DoctorModel.js";

async function cleanupDatabase() {
    try {
        console.log('Starting database cleanup...');

        // Delete all medical records first (due to foreign key constraints)
        console.log('Deleting medical records...');
        await MedicalRecord.destroy({
            where: {},
            force: true // This will do a hard delete
        });
        console.log('✓ Medical records deleted');

        // Delete all patients
        console.log('Deleting patients...');
        await Patient.destroy({
            where: {},
            force: true
        });
        console.log('✓ Patients deleted');

        // Delete all doctors
        console.log('Deleting doctors...');
        await Doctor.destroy({
            where: {},
            force: true
        });
        console.log('✓ Doctors deleted');

        console.log('Database cleanup completed successfully!');
        
        // Close the database connection
        await db.close();
        process.exit(0);
    } catch (error) {
        console.error('Error during database cleanup:', error);
        process.exit(1);
    }
}

// Run the cleanup
cleanupDatabase();