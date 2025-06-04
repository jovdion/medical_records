import express from "express";
import { verifyToken } from "../middleware/verifytoken.js";
import { getDashboardStats } from "../controllers/DashboardController.js";

const router = express.Router();

router.get('/dashboard/stats', verifyToken, getDashboardStats);

export default router; 