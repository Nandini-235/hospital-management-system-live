const express = require('express');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const {
    getPatients,
    getPatient,
    createPatient,
    updatePatient
} = require('../controllers/patientController');
const {
    getAppointments,
    getAppointment,
    createAppointment,
    updateAppointment,
    cancelAppointment
} = require('../controllers/appointmentController');
const User = require('../models/User');

const router = express.Router();

// Apply middleware to all routes
router.use(protect);
router.use(authorize('receptionist', 'admin'));

// Patient routes
router.route('/patients')
    .get(getPatients)
    .post(createPatient);

router.route('/patients/:id')
    .get(getPatient)
    .put(updatePatient);

// Appointment routes
router.route('/appointments')
    .get(getAppointments)
    .post(createAppointment);

router.route('/appointments/:id')
    .get(getAppointment)
    .put(updateAppointment)
    .delete(cancelAppointment);

// @desc    Mark patient as arrived
// @route   PUT /api/receptionist/appointments/:id/arrived
// @access  Private/Receptionist
router.put('/appointments/:id/arrived', async (req, res) => {
    try {
        const Appointment = require('../models/Appointment');
        const appointment = await Appointment.findById(req.params.id)
            .populate('patient', 'firstName lastName');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        appointment.status = 'arrived';
        appointment.arrivedAt = new Date();
        appointment.modifiedBy = req.user.id;

        await appointment.save();

        // Emit socket event for real-time update
        const { io } = require('../server');
        io.to('doctor').emit('patient-arrived', {
            appointmentId: appointment._id,
            patientId: appointment.patient._id,
            patientName: appointment.patient.firstName + ' ' + appointment.patient.lastName,
            arrivedAt: appointment.arrivedAt
        });

        res.json({
            success: true,
            message: 'Patient marked as arrived',
            appointment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error updating appointment',
            error: error.message
        });
    }
});

// @desc    Get available doctors
// @route   GET /api/receptionist/doctors
// @access  Private/Receptionist
router.get('/doctors', async (req, res) => {
    try {
        const doctors = await User.find({
            role: 'doctor',
            isActive: true
        }).select('name specialization experience');

        res.json({
            success: true,
            doctors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching doctors',
            error: error.message
        });
    }
});

module.exports = router;
