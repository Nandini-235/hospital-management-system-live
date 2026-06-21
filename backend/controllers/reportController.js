const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');

// Get appointment counts grouped by month (example report)
async function getMonthlyAppointmentsReport(req, res) {
  try {
    const stats = await Appointment.aggregate([
      {
        $group: {
          _id: { $month: "$appointmentDate" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Format for frontend charts
    const result = stats.map(stat => {
      const monthName = new Date(0, stat._id - 1).toLocaleString('en-US', { month: 'short' });
      return { label: monthName, value: stat.count };
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching monthly appointments report:", error);
    res.status(500).json({ error: "Failed to fetch report data" });
  }
}

// Total patients count
async function getTotalPatientsReport(req, res) {
  try {
    const count = await Patient.countDocuments();
    res.json({ totalPatients: count });
  } catch (error) {
    console.error("Error fetching total patients report:", error);
    res.status(500).json({ error: "Failed to fetch report data" });
  }
}

// User role distribution (admins, doctors, receptionists)
async function getUserRoleDistribution(req, res) {
  try {
    const stats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);
    const result = stats.map(s => ({ role: s._id, count: s.count }));
    res.json(result);
  } catch (error) {
    console.error("Error fetching user role distribution:", error);
    res.status(500).json({ error: "Failed to fetch report data" });
  }
}
//
async function getDoctorAppointmentsStats(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = await Appointment.find({ appointmentDate: { $gte: new Date(today) } });
    const statusCounts = await Promise.all(['scheduled','arrived','completed','cancelled'].map(
      s => Appointment.countDocuments({ status: s })
    ));
    res.json({
      stats: {
        today: todayAppointments.length,
        waitingNow: statusCounts[1],
        statusBreakdown: {
          scheduled: statusCounts[0],
          arrived: statusCounts[1],
          completed: statusCounts[2],
          cancelled: statusCounts[3],
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getMonthlyAppointmentsReport,
  getTotalPatientsReport,
  getUserRoleDistribution,
  getDoctorAppointmentsStats
};
