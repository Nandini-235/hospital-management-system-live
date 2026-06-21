const mongoose = require('mongoose');
const appointmentSchema = new mongoose.Schema({
patient: {
type: mongoose.Schema.Types.ObjectId,
ref: 'Patient',
required: [true, 'Patient is required']
},
doctor: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User',
required: [true, 'Doctor is required']
},
appointmentDate: {
type: Date,
required: [true, 'Appointment date is required']
},
appointmentTime: {
type: String,
required: [true, 'Appointment time is required']
},
reasonForVisit: {
type: String,
},
status: {
type: String,
enum: ['scheduled', 'arrived', 'in-progress', 'completed', 'cancelled', 'no-show'],
default: 'scheduled'
},
priority: {
type: String,
enum: ['low', 'medium', 'high', 'emergency'],
default: 'medium'
},
notes: {
type: String,
default: ''
},
arrivedAt: {
type: Date,
default: null
},
completedAt: {
type: Date,
default: null
},
diagnosis: {
type: String,
default: ''
},
prescription: [{
medication: String,
dosage: String,
frequency: String,
duration: String,
instructions: String
}],
followUpDate: {
type: Date,
default: null
},
createdBy: {
    type: mongoose.Schema.Types.ObjectId,
ref: 'User',
required: false
},
modifiedBy: {
type: mongoose.Schema.Types.ObjectId,
ref: 'User'
}
}, {
timestamps: true
});// Index for efficient queries
appointmentSchema.index({ appointmentDate: 1, doctor: 1 });
appointmentSchema.index({ patient: 1 });
appointmentSchema.index({ status: 1 });
// Virtual for waiting time (in minutes)
appointmentSchema.virtual('waitingTime').get(function() {
if (this.arrivedAt && this.status === 'arrived') {
const now = new Date();
const diffInMs = now - this.arrivedAt;
return Math.floor(diffInMs / (1000 * 60));
}
return 0;
});
// Ensure virtual fields are serialized
appointmentSchema.set('toJSON', { virtuals: true });
module.exports = mongoose.model('Appointment', appointmentSchema);

