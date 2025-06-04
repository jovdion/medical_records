#!/bin/bash

# Create directories if they don't exist
mkdir -p Route
mkdir -p models
mkdir -p controllers
mkdir -p middleware
mkdir -p config

# Copy files with correct case
cp Route/Userroute.js Route/UserRoute.js
cp Route/PatientRoute.js Route/PatientRoute.js
cp Route/DoctorRoute.js Route/DoctorRoute.js
cp Route/MedicalRecordRoute.js Route/MedicalRecordRoute.js
cp Route/DashboardRoute.js Route/DashboardRoute.js

# Make the script executable
chmod +x copy-files.sh 