const mongoose = require('mongoose');
const patientSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  dateOfBirth: Date,
  gender: String,
  address: { // optional or required — must be handled
    street: String,
    city: String,
    state: String,
    zipCode: String,
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String,
  },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Patient', patientSchema);
