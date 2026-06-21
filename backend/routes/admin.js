const express = require('express');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

const router = express.Router();

// Apply middleware to all routes
router.use(protect);
router.use(authorize('admin'));

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching users',
            error: error.message
        });
    }
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
router.put('/users/:id/status', async (req, res) => {
    try {
        const { isActive } = req.body;
        
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.isActive = isActive;
        await user.save();

        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error updating user status',
            error: error.message
        });
    }
});

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', async (req, res) => {
    try {
        const stats = await Promise.all([
            User.countDocuments({ role: 'doctor', isActive: true }),
            User.countDocuments({ role: 'receptionist', isActive: true }),
            Patient.countDocuments({ isActive: true }),
            Appointment.countDocuments({ status: { $ne: 'cancelled' } })
        ]);

        res.json({
            success: true,
            stats: {
                totalDoctors: stats,
                totalReceptionists: stats,
                totalPatients: stats,
                totalAppointments: stats
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error fetching stats',
            error: error.message
        });
    }
});

module.exports = router;
