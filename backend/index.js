import express from "express";
import dotenv from 'dotenv';
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";

// Import database connection
import db from "./config/database.js";

// Import routing dan model
import UserRoute from "./Route/Userroute.js";
import PatientRoute from "./Route/PatientRoute.js";
import DoctorRoute from "./Route/DoctorRoute.js";
import MedicalRecordRoute from "./Route/MedicalRecordRoute.js";
import DashboardRoute from "./Route/DashboardRoute.js";
import "./models/MedicalRecordModel.js";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['https://medical-records-be-913201672104.us-central1.run.app', 'http://localhost:5000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Set-Cookie']
}));

// API Routes
app.use('/api', UserRoute);
app.use('/api', PatientRoute);
app.use('/api', DoctorRoute);
app.use('/api', MedicalRecordRoute);
app.use('/api', DashboardRoute);

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    await db.authenticate();
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Error', 
      database: 'Disconnected',
      error: error.message 
    });
  }
});

// Serve static frontend files
app.use(express.static(path.join(projectRoot, "frontend")));

// Serve index.html for all other routes to support client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.join(projectRoot, "frontend", "index.html"));
});

// Database synchronization function
const syncDatabase = async () => {
  try {
    console.log('🔄 Starting database synchronization...');
    
    // Import model to ensure it is registered
    const MedicalRecord = (await import('./models/MedicalRecordModel.js')).default;
    
    // Simple sync
    await db.sync({ 
      force: false,
      alter: true
    });
    
    console.log('✅ Database synchronized successfully');
    console.log('📊 All models have been synchronized with the database');
    
  } catch (error) {
    console.error('❌ Database synchronization failed:', error);
    console.log('💡 If this is the first run, please use setup-db.js first');
    throw error;
  }
};

// Initialize server
const startServer = async () => {
  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    await db.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Synchronize database
    await syncDatabase();
    
    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server up and running on port ${PORT}`);
      console.log(`🌐 Health check available at: http://localhost:${PORT}/health`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Something broke!" });
});