import Patient from "../models/PatientModel.js";
import Doctor from "../models/DoctorModel.js";
import MedicalRecord from "../models/MedicalRecordModel.js";

export const getDashboardStats = async (req, res) => {
    try {
        // Get counts
        const totalPatients = await Patient.count();
        const totalDoctors = await Doctor.count();
        const totalRecords = await MedicalRecord.count();

        // Get recent records with patient and doctor names
        const recentRecords = await MedicalRecord.findAll({
            limit: 5,
            order: [['visit_date', 'DESC']],
            include: [
                {
                    model: Patient,
                    attributes: ['name'],
                    as: 'patient'
                },
                {
                    model: Doctor,
                    attributes: ['name'],
                    as: 'doctor'
                }
            ]
        });

        // Format recent records
        const formattedRecords = recentRecords.map(record => ({
            visit_date: record.visit_date,
            patient_name: record.patient?.name || 'Unknown',
            doctor_name: record.doctor?.name || 'Unknown',
            diagnosis: record.diagnosis
        }));

        res.json({
            totalPatients,
            totalDoctors,
            totalRecords,
            recentRecords: formattedRecords
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ 
            message: "Error fetching dashboard statistics",
            error: error.message 
        });
    }
}; 