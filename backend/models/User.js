const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
name: {
type: String,
required: [true, 'Please add a name'],
trim: true
},
email: {
type: String,
required: [true, 'Please add an email'],
unique: true,
lowercase: true
},
password: {
type: String,
required: [true, 'Please add a password'],
minlength: 6
},
role: {
type: String,
required: [true, 'Please specify a role'],
enum: ['admin', 'doctor', 'receptionist'],
default: 'receptionist'
},
phone: {
type: String,
required: [true, 'Please add a phone number']
},
specialization: {
type: String,
required: function() { return this.role === 'doctor'; }
},
experience: {
type: Number,
required: function() { return this.role === 'doctor'; }
},
isActive: {
type: Boolean,
default: true
},
profileImage: {
type: String,
default: ''
}
}, {
timestamps: true
});
// Encrypt password before saving
userSchema.pre('save', async function(next) {
if (!this.isModified('password')) {
next();
}
const salt = await bcrypt.genSalt(10);
this.password = await bcrypt.hash(this.password, salt);
next();
});
// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
return await bcrypt.compare(enteredPassword, this.password);
};
module.exports = mongoose.model('User', userSchema);