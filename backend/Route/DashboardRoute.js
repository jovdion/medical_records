import express from "express";
import { getDashboardStats } from "../controllers/DashboardController.js";
import { verifyToken } from "../middleware/VerifyToken.js";

const router = express.Router();

router.get('/dashboard/stats', verifyToken, getDashboardStats);

export default router; 