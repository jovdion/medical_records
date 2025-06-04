import express from "express";
import {
    getDoctors,
    getDoctorById,
    createDoctor,
    updateDoctor,
    deleteDoctor
} from "../controllers/DoctorController.js";

const router = express.Router();

// Get all doctors
router.get('/doctors', getDoctors);

// Get doctor by ID
router.get('/doctors/:id', getDoctorById);

// Create new doctor
router.post('/doctors', createDoctor);

// Update doctor
router.put('/doctors/:id', updateDoctor);

// Delete doctor
router.delete('/doctors/:id', deleteDoctor);

export default router; 