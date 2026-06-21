const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/appointments/monthly', reportController.getMonthlyAppointmentsReport);
router.get('/patients/total', reportController.getTotalPatientsReport);
router.get('/users/roles', reportController.getUserRoleDistribution);
router.get('/doctor/appointments/stats', reportController.getDoctorAppointmentsStats);

module.exports = router;
