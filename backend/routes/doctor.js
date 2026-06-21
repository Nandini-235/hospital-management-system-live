const express = require('express');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const {
    getAppointments,
    getAppointment,
    updateAppointment,
    getTodayAppointments,
    getAppointmentStats
} = require('../controllers/appointmentController');

const router = express.Router();

// Apply middleware to all routes
router.use(protect);
router.use(authorize('doctor', 'admin'));

// Appointment routes for doctors
router.get('/appointments', getAppointments);
router.get('/appointments/today', getTodayAppointments);
router.get('/appointments/stats', getAppointmentStats);
router.get('/appointments/:id', getAppointment);
router.put('/appointments/:id', updateAppointment);

// @desc    Get waiting patients (arrived status)
// @route   GET /api/doctor/waiting-patients
// @access  Private/Doctor
router.get('/waiting-patients', async (req, res) => {
    try {
        const Appointment = require('../models/Appointment');
        const moment = require('moment');
        
        const today = moment().startOf('day');
        const tomorrow = moment(today).add(1, 'day');

        const waitingPatients = await Appointment.find({
            doctor: req.user.id,
            status: 'arrived',
            appointmentDate: {
                $gte: today.toDate(),
                $lt: tomorrow.toDate()
            }
        })
        .populate('patient', 'firstName lastName phone')
        .sort({ arrivedAt: 1 });

        res.json({
            success: true,
            waitingPatients
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching waiting patients',
            error: error.message
        });
    }
});

// @desc    Complete appointment with diagnosis and prescription
// @route   PUT /api/doctor/appointments/:id/complete
// @access  Private/Doctor
router.put('/appointments/:id/complete', async (req, res) => {
    try {
        const Appointment = require('../models/Appointment');
        const { diagnosis, prescription, followUpDate, notes } = req.body;

        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        if (appointment.doctor.toString() !== req.user.id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this appointment'
            });
        }

        appointment.status = 'completed';
        appointment.completedAt = new Date();
        appointment.diagnosis = diagnosis;
        appointment.prescription = prescription || [];
        appointment.followUpDate = followUpDate || null;
        appointment.notes = notes || appointment.notes;
        appointment.modifiedBy = req.user.id;

        await appointment.save();

        res.json({
            success: true,
            message: 'Appointment completed successfully',
            appointment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error completing appointment',
            error: error.message
        });
    }
});

module.exports = router;
