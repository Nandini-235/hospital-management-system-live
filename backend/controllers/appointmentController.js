const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const moment = require('moment');

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let query = {};

        // Filter by date range
        if (req.query.startDate && req.query.endDate) {
            query.appointmentDate = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        // Filter by status
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Filter by doctor (for doctor role)
        if (req.user.role === 'doctor') {
            query.doctor = req.user.id;
        } else if (req.query.doctor) {
            query.doctor = req.query.doctor;
        }

        const appointments = await Appointment.find(query)
            .populate('patient', 'firstName lastName phone email')
            .populate('doctor', 'name specialization')
            .populate('createdBy', 'name')
            .sort({ appointmentDate: 1, appointmentTime: 1 })
            .skip(skip)
            .limit(limit);

        const total = await Appointment.countDocuments(query);

        res.json({
            success: true,
            appointments,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Get appointments error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching appointments',
            error: error.message
        });
    }
};

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('patient')
            .populate('doctor', 'name specialization phone')
            .populate('createdBy', 'name');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        res.json({
            success: true,
            appointment
        });
    } catch (error) {
        console.error('Get appointment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching appointment',
            error: error.message
        });
    }
};

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private (Receptionist, Admin)
const createAppointment = async (req, res) => {
    try {
        const {
            patient,
            doctor,
            appointmentDate,
            appointmentTime,
            reasonForVisit,
            priority,
            notes
        } = req.body;

        // Check if patient exists
        const patientExists = await Patient.findById(patient);
        if (!patientExists) {
            return res.status(400).json({
                success: false,
                message: 'Patient not found'
            });
        }

        // Check if doctor exists
        const doctorExists = await User.findOne({ _id: doctor, role: 'doctor' });
        if (!doctorExists) {
            return res.status(400).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Check for time slot availability
        const existingAppointment = await Appointment.findOne({
            doctor,
            appointmentDate: new Date(appointmentDate),
            appointmentTime,
            status: { $nin: ['cancelled', 'no-show'] }
        });

        if (existingAppointment) {
            return res.status(400).json({
                success: false,
                message: 'This time slot is already booked'
            });
        }

        const appointment = new Appointment({
            patient,
            doctor,
            appointmentDate: new Date(appointmentDate),
            appointmentTime,
            reasonForVisit,
            priority: priority || 'medium',
            notes: notes || '',
            createdBy: req.user.id
        });

        const savedAppointment = await appointment.save();
        await savedAppointment.populate([
            { path: 'patient', select: 'firstName lastName phone email' },
            { path: 'doctor', select: 'name specialization' },
            { path: 'createdBy', select: 'name' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Appointment created successfully',
            appointment: savedAppointment
        });
    } catch (error) {
        console.error('Create appointment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating appointment',
            error: error.message
        });
    }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Check if rescheduling to a new time slot
        if (req.body.appointmentDate || req.body.appointmentTime) {
            const appointmentDate = req.body.appointmentDate ? new Date(req.body.appointmentDate) : appointment.appointmentDate;
            const appointmentTime = req.body.appointmentTime || appointment.appointmentTime;
            const doctor = req.body.doctor || appointment.doctor;

            // Check for conflicts only if it's a different time slot
            const isDifferentSlot = 
                appointmentDate.getTime() !== appointment.appointmentDate.getTime() ||
                appointmentTime !== appointment.appointmentTime ||
                doctor.toString() !== appointment.doctor.toString();

            if (isDifferentSlot) {
                const existingAppointment = await Appointment.findOne({
                    _id: { $ne: appointment._id },
                    doctor,
                    appointmentDate,
                    appointmentTime,
                    status: { $nin: ['cancelled', 'no-show'] }
                });

                if (existingAppointment) {
                    return res.status(400).json({
                        success: false,
                        message: 'This time slot is already booked'
                    });
                }
            }
        }

        // Update appointment fields
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined && key !== 'arrivedAt' && key !== 'completedAt') {
                appointment[key] = req.body[key];
            }
        });

        appointment.modifiedBy = req.user.id;

        // Handle status-specific updates
        if (req.body.status === 'arrived' && appointment.status !== 'arrived') {
            appointment.arrivedAt = new Date();
        } else if (req.body.status === 'completed' && appointment.status !== 'completed') {
            appointment.completedAt = new Date();
        }

        const updatedAppointment = await appointment.save();
        await updatedAppointment.populate([
            { path: 'patient', select: 'firstName lastName phone email' },
            { path: 'doctor', select: 'name specialization' },
            { path: 'createdBy', select: 'name' }
        ]);

        res.json({
            success: true,
            message: 'Appointment updated successfully',
            appointment: updatedAppointment
        });
    } catch (error) {
        console.error('Update appointment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating appointment',
            error: error.message
        });
    }
};

// @desc    Cancel appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const cancelAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        appointment.status = 'cancelled';
        appointment.modifiedBy = req.user.id;
        appointment.notes = req.body.reason ? `Cancelled: ${req.body.reason}` : appointment.notes;

        await appointment.save();

        res.json({
            success: true,
            message: 'Appointment cancelled successfully'
        });
    } catch (error) {
        console.error('Cancel appointment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error cancelling appointment',
            error: error.message
        });
    }
};

// @desc    Get today's appointments for doctor
// @route   GET /api/appointments/today
// @access  Private (Doctor)
const getTodayAppointments = async (req, res) => {
    try {
        const today = moment().startOf('day');
        const tomorrow = moment(today).add(1, 'day');

        const appointments = await Appointment.find({
            doctor: req.user.id,
            appointmentDate: {
                $gte: today.toDate(),
                $lt: tomorrow.toDate()
            }
        })
        .populate('patient', 'firstName lastName phone email')
        .sort({ appointmentTime: 1 });

        res.json({
            success: true,
            appointments
        });
    } catch (error) {
        console.error('Get today appointments error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching today\'s appointments',
            error: error.message
        });
    }
};

// @desc    Get appointment statistics
// @route   GET /api/appointments/stats
// @access  Private
const getAppointmentStats = async (req, res) => {
    try {
        const today = moment().startOf('day');
        const tomorrow = moment(today).add(1, 'day');
        const startOfWeek = moment().startOf('week');
        const endOfWeek = moment().endOf('week');
        const startOfMonth = moment().startOf('month');
        const endOfMonth = moment().endOf('month');

        let matchQuery = {};
        if (req.user.role === 'doctor') {
            matchQuery.doctor = req.user.id;
        }

        const stats = await Promise.all([
            // Today's appointments
            Appointment.countDocuments({
                ...matchQuery,
                appointmentDate: {
                    $gte: today.toDate(),
                    $lt: tomorrow.toDate()
                }
            }),
            // This week's appointments
            Appointment.countDocuments({
                ...matchQuery,
                appointmentDate: {
                    $gte: startOfWeek.toDate(),
                    $lte: endOfWeek.toDate()
                }
            }),
            // This month's appointments
            Appointment.countDocuments({
                ...matchQuery,
                appointmentDate: {
                    $gte: startOfMonth.toDate(),
                    $lte: endOfMonth.toDate()
                }
            }),
            // Status breakdown
            Appointment.aggregate([
                { $match: matchQuery },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ])
        ]);

        const statusBreakdown = {};
        stats.forEach(item => {
            statusBreakdown[item._id] = item.count;
        });

        res.json({
            success: true,
            stats: {
                today: stats,
                thisWeek: stats,
                thisMonth: stats,
                statusBreakdown
            }
        });
    } catch (error) {
        console.error('Get appointment stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching appointment statistics',
            error: error.message
        });
    }
};

module.exports = {
    getAppointments,
    getAppointment,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    getTodayAppointments,
    getAppointmentStats
};
