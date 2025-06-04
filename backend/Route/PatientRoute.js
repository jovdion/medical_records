import express from "express";
import {
    getPatients,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient
} from "../controllers/PatientController.js";

const router = express.Router();

// Get all patients
router.get('/patients', getPatients);

// Get patient by ID
router.get('/patients/:id', getPatientById);

// Create new patient
router.post('/patients', createPatient);

// Update patient
router.put('/patients/:id', updatePatient);

// Delete patient
router.delete('/patients/:id', deletePatient);

export default router; 