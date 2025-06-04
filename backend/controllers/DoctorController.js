import Doctor from "../models/DoctorModel.js";

// Get all doctors
export const getDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.findAll();
        res.json(doctors);
    } catch (error) {
        console.error('Error getting doctors:', error);
        res.status(500).json({ message: 'Failed to get doctors', error: error.message });
    }
}

// Get doctor by ID
export const getDoctorById = async (req, res) => {
    try {
        const doctor = await Doctor.findByPk(req.params.id);
        if (doctor) {
            res.json(doctor);
        } else {
            res.status(404).json({ message: 'Doctor not found' });
        }
    } catch (error) {
        console.error('Error getting doctor:', error);
        res.status(500).json({ message: 'Failed to get doctor', error: error.message });
    }
}

// Create new doctor
export const createDoctor = async (req, res) => {
    try {
        // Validasi input
        const { name, specialty, phone, email } = req.body;
        
        if (!name || !specialty) {
            return res.status(400).json({ 
                message: 'Validation error',
                errors: [
                    { field: 'name', message: !name ? 'Nama dokter tidak boleh kosong' : null },
                    { field: 'specialty', message: !specialty ? 'Spesialisasi tidak boleh kosong' : null }
                ].filter(e => e.message)
            });
        }

        const doctor = await Doctor.create(req.body);
        res.status(201).json(doctor);
    } catch (error) {
        console.error('Error creating doctor:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: 'Validation error',
                errors: error.errors.map(e => ({
                    field: e.path,
                    message: e.message
                }))
            });
        }
        res.status(500).json({ message: 'Failed to create doctor', error: error.message });
    }
}

// Update doctor
export const updateDoctor = async (req, res) => {
    try {
        // Validasi input
        const { name, specialty, phone, email } = req.body;
        
        if (!name || !specialty) {
            return res.status(400).json({ 
                message: 'Validation error',
                errors: [
                    { field: 'name', message: !name ? 'Nama dokter tidak boleh kosong' : null },
                    { field: 'specialty', message: !specialty ? 'Spesialisasi tidak boleh kosong' : null }
                ].filter(e => e.message)
            });
        }

        const doctor = await Doctor.findByPk(req.params.id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        await doctor.update(req.body);
        res.json(doctor);
    } catch (error) {
        console.error('Error updating doctor:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: 'Validation error',
                errors: error.errors.map(e => ({
                    field: e.path,
                    message: e.message
                }))
            });
        }
        res.status(500).json({ message: 'Failed to update doctor', error: error.message });
    }
}

// Delete doctor
export const deleteDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findByPk(req.params.id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        await doctor.destroy();
        res.json({ message: 'Doctor deleted successfully' });
    } catch (error) {
        console.error('Error deleting doctor:', error);
        res.status(500).json({ message: 'Failed to delete doctor', error: error.message });
    }
} 