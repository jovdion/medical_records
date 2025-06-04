import express from "express";
import {
    getMedicalRecords,
    getMedicalRecordById,
    createMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord
} from "../controllers/MedicalRecordController.js";

const router = express.Router();

// Medical Records endpoints
router.get('/medical-records', getMedicalRecords);
router.get('/medical-records/:id', getMedicalRecordById);
router.post('/medical-records', createMedicalRecord);
router.put('/medical-records/:id', updateMedicalRecord);
router.delete('/medical-records/:id', deleteMedicalRecord);

export default router; 