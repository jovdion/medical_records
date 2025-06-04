import MedicalRecord from "../models/MedicalRecordModel.js";
import Doctor from "../models/DoctorModel.js";
import Patient from "../models/PatientModel.js";

export const getMedicalRecords = async (req, res) => {
    try {
        const response = await MedicalRecord.findAll({
            include: [
                {
                    model: Patient,
                    attributes: ['id', 'name', 'age', 'gender', 'blood_type']
                },
                {
                    model: Doctor,
                    attributes: ['id', 'name', 'specialty']
                }
            ]
        });
        res.status(200).json(response);
    } catch (error) {
        console.error("Error getting medical records:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get medical record by ID
export const getMedicalRecordById = async (req, res) => {
    try {
        const record = await MedicalRecord.findOne({
            where: {
                id: req.params.id
            },
            include: [
                {
                    model: Patient,
                    attributes: ['id', 'name', 'age', 'gender', 'blood_type']
                },
                {
                    model: Doctor,
                    attributes: ['id', 'name', 'specialty']
                }
            ]
        });

        if (!record) {
            return res.status(404).json({ message: "Medical record not found" });
        }

        res.status(200).json(record);
    } catch (error) {
        console.error("Error getting medical record:", error);
        res.status(500).json({ message: error.message });
    }
};

// CREATE MEDICAL RECORD
export const createMedicalRecord = async (req, res) => {
    try {
        // Get patient details
        const patient = await Patient.findByPk(req.body.patient_id);
        if (!patient) {
            return res.status(400).json({ message: 'Patient not found' });
        }

        // Get doctor details
        const doctor = await Doctor.findByPk(req.body.doctor_id);
        if (!doctor) {
            return res.status(400).json({ message: 'Doctor not found' });
        }

        // Create record with patient and doctor details
        const data = {
            ...req.body,
            patient_name: patient.name,
            patient_age: patient.age,
            patient_gender: patient.gender,
            blood_type: patient.blood_type,
            doctor_name: doctor.name
        };

        const response = await MedicalRecord.create(data);
        res.status(201).json(response);
    } catch (error) {
        console.error("Error creating medical record:", error);
        res.status(500).json({ message: error.message });
    }
};

// UPDATE MEDICAL RECORD
export const updateMedicalRecord = async (req, res) => {
    try {
        let data = { ...req.body };

        // Get patient details if patient_id is provided
        if (req.body.patient_id) {
            const patient = await Patient.findByPk(req.body.patient_id);
            if (!patient) {
                return res.status(400).json({ message: 'Patient not found' });
            }
            data = {
                ...data,
                patient_name: patient.name,
                patient_age: patient.age,
                patient_gender: patient.gender,
                blood_type: patient.blood_type
            };
        }

        // Get doctor details if doctor_id is provided
        if (req.body.doctor_id) {
            const doctor = await Doctor.findByPk(req.body.doctor_id);
            if (!doctor) {
                return res.status(400).json({ message: 'Doctor not found' });
            }
            data.doctor_name = doctor.name;
        }

        const record = await MedicalRecord.findOne({
            where: {
                id: req.params.id
            }
        });

        if (!record) {
            return res.status(404).json({ message: "Medical record not found" });
        }

        await record.update(data);
        res.status(200).json(record);
    } catch (error) {
        console.error("Error updating medical record:", error);
        res.status(500).json({ message: error.message });
    }
};

// DELETE MEDICAL RECORD
export const deleteMedicalRecord = async (req, res) => {
    try {
        const record = await MedicalRecord.findOne({
            where: {
                id: req.params.id
            }
        });

        if (!record) {
            return res.status(404).json({ message: "Medical record not found" });
        }

        await record.destroy();
        res.status(200).json({ message: "Medical record deleted successfully" });
    } catch (error) {
        console.error("Error deleting medical record:", error);
        res.status(500).json({ message: error.message });
    }
}; 