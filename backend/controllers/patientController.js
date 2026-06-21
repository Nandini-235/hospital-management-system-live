const Patient = require('../models/Patient');

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private (Receptionist, Doctor, Admin)
const getPatients = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const search = req.query.search || '';
        const searchQuery = search ? {
            $or: [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ]
        } : {};

        const patients = await Patient.find({ 
            ...searchQuery, 
            isActive: true 
        })
        .populate('addedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        const total = await Patient.countDocuments({ 
            ...searchQuery, 
            isActive: true 
        });

        res.json({
            success: true,
            patients,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Get patients error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching patients',
            error: error.message
        });
    }
};

// @desc    Get single patient
// @route   GET /api/patients/:id
// @access  Private (Receptionist, Doctor, Admin)
const getPatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id)
            .populate('addedBy', 'name');

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        res.json({
            success: true,
            patient
        });
    } catch (error) {
        console.error('Get patient error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching patient',
            error: error.message
        });
    }
};

// @desc    Create new patient
// @route   POST /api/patients
// @access  Private (Receptionist, Admin)
const createPatient = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth,
            gender,
            address,
            emergencyContact,
            medicalHistory,
            allergies,
            currentMedications,
            insuranceInfo
        } = req.body;

        // Check if patient with email already exists
        const existingPatient = await Patient.findOne({ email });
        if (existingPatient) {
            return res.status(400).json({
                success: false,
                message: 'Patient with this email already exists'
            });
        }

        const patient = new Patient({
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth,
            gender,
            address,
            emergencyContact,
            medicalHistory: medicalHistory || [],
            allergies: allergies || [],
            currentMedications: currentMedications || [],
            insuranceInfo,
            addedBy: req.user.id
        });

        const savedPatient = await patient.save();
        await savedPatient.populate('addedBy', 'name');

        res.status(201).json({
            success: true,
            message: 'Patient created successfully',
            patient: savedPatient
        });
    } catch (error) {
        console.error('Create patient error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating patient',
            error: error.message
        });
    }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private (Receptionist, Doctor, Admin)
const updatePatient = async (req, res) => {
    try {
        let patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Update patient fields
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined) {
                patient[key] = req.body[key];
            }
        });

        patient.modifiedBy = req.user.id;
        const updatedPatient = await patient.save();
        await updatedPatient.populate('addedBy', 'name');

        res.json({
            success: true,
            message: 'Patient updated successfully',
            patient: updatedPatient
        });
    } catch (error) {
        console.error('Update patient error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating patient',
            error: error.message
        });
    }
};

// @desc    Delete patient (soft delete)
// @route   DELETE /api/patients/:id
// @access  Private (Admin only)
const deletePatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        patient.isActive = false;
        patient.modifiedBy = req.user.id;
        await patient.save();

        res.json({
            success: true,
            message: 'Patient deleted successfully'
        });
    } catch (error) {
        console.error('Delete patient error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting patient',
            error: error.message
        });
    }
};

module.exports = {
    getPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient
};
