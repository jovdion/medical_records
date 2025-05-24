import express from "express";
import {getCatatan, createCatatan, updateCatatan, deleteCatatan} from "../controllers/CatatanController.js";
import { verifyToken } from "../middleware/VerivyToken.js";

const router = express.Router();

//endpoint
router.get('/catatan', verifyToken, getCatatan);
router.post('/catatan', verifyToken, createCatatan);
router.put('/catatan-update/:id', verifyToken, updateCatatan);
router.delete('/catatan-hapus/:id', verifyToken, deleteCatatan);


export default router;