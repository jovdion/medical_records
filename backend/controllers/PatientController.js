import Patient from "../models/PatientModel.js";

// Get all patients
export const getPatients = async (req, res) => {
    try {
        const patients = await Patient.findAll({
            attributes: ['id', 'name', 'age', 'gender', 'blood_type', 'address', 'phone']
        });
        res.json(patients);
    } catch (error) {
        console.error('Error getting patients:', error);
        res.status(500).json({ message: error.message });
    }
}

// Get patient by ID
export const getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findByPk(req.params.id, {
            attributes: ['id', 'name', 'age', 'gender', 'blood_type', 'address', 'phone']
        });
        if (patient) {
            res.json(patient);
        } else {
            res.status(404).json({ message: 'Patient not found' });
        }
    } catch (error) {
        console.error('Error getting patient:', error);
        res.status(500).json({ message: error.message });
    }
}

// Create patient
export const createPatient = async (req, res) => {
    try {
        const patient = await Patient.create(req.body);
        res.status(201).json(patient);
    } catch (error) {
        console.error('Error creating patient:', error);
        res.status(500).json({ message: error.message });
    }
}

// Update patient
export const updatePatient = async (req, res) => {
    try {
        const updated = await Patient.update(req.body, {
            where: { id: req.params.id }
        });
        if (updated[0] > 0) {
            const patient = await Patient.findByPk(req.params.id);
            res.json(patient);
        } else {
            res.status(404).json({ message: 'Patient not found' });
        }
    } catch (error) {
        console.error('Error updating patient:', error);
        res.status(500).json({ message: error.message });
    }
}

// Delete patient
export const deletePatient = async (req, res) => {
    try {
        const deleted = await Patient.destroy({
            where: { id: req.params.id }
        });
        if (deleted) {
            res.json({ message: 'Patient deleted successfully' });
        } else {
            res.status(404).json({ message: 'Patient not found' });
        }
    } catch (error) {
        console.error('Error deleting patient:', error);
        res.status(500).json({ message: error.message });
    }
} 