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

// CORS configuration
const allowedOrigins = [
    'https://medical-records-fe-913201672104.us-central1.run.app',
    'https://medical-records-be-913201672104.us-central1.run.app',
    'http://localhost:5000',
    'http://localhost:3000',
    undefined // Allow requests with no origin (like mobile apps or curl requests)
];

// Log environment
console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    allowedOrigins
});

const corsOptions = {
    origin: function (origin, callback) {
        console.log('Request origin:', origin);
        
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            console.log('Origin not allowed:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie', 'X-Token-Expiring'],
    optionsSuccessStatus: 200,
    preflightContinue: false,
    maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Add CORS error handling middleware
app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        console.error('CORS Error:', {
            origin: req.headers.origin,
            method: req.method,
            path: req.path,
            headers: req.headers
        });
        return res.status(403).json({
            message: 'CORS not allowed',
            error: 'Origin not allowed'
        });
    }
    next(err);
});

// Add request logging middleware
app.use((req, res, next) => {
    console.log('Request:', {
        method: req.method,
        path: req.path,
        origin: req.headers.origin,
        cookies: req.cookies,
        headers: {
            ...req.headers,
            authorization: req.headers.authorization ? 
                req.headers.authorization.substring(0, 20) + '...' : 
                'none'
        }
    });
    next();
});

// Add error logging middleware
app.use((err, req, res, next) => {
    console.error('Error details:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    res.status(500).json({ 
        message: "Internal Server Error",
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

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
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV
        });
    } catch (error) {
        console.error('Health check error:', error);
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
    console.error('Error details:', error);
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
    console.error('Error details:', error);
    process.exit(1);
  }
};

// Start the application
startServer();