#!/bin/bash

# Create directories if they don't exist
mkdir -p Route
mkdir -p models
mkdir -p controllers
mkdir -p middleware
mkdir -p config

# Copy Route files with correct case
cp Route/Userroute.js Route/UserRoute.js
cp Route/PatientRoute.js Route/PatientRoute.js
cp Route/DoctorRoute.js Route/DoctorRoute.js
cp Route/MedicalRecordRoute.js Route/MedicalRecordRoute.js
cp Route/DashboardRoute.js Route/DashboardRoute.js

# Copy Controller files with correct case
cp controllers/Usercontroller.js controllers/UserController.js
cp controllers/Refreshtoken.js controllers/RefreshToken.js
cp controllers/DoctorController.js controllers/DoctorController.js
cp controllers/PatientController.js controllers/PatientController.js
cp controllers/MedicalRecordController.js controllers/MedicalRecordController.js
cp controllers/DashboardController.js controllers/DashboardController.js

# Copy Middleware files with correct case
cp middleware/verifytoken.js middleware/VerifyToken.js

# Copy Model files with correct case and ensure consistent naming
cp models/Usermodel.js models/UserModel.js
cp models/DoctorModel.js models/DoctorModel.js
cp models/PatientModel.js models/PatientModel.js
cp models/MedicalRecordModel.js models/MedicalRecordModel.js

# Set permissions
find . -type f -name "*.js" -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;

# Make the script executable
chmod +x copy-files.sh 