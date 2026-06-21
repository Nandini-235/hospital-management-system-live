const jwt = require('jsonwebtoken');
const User = require('../models/User');
const configureSocket = (io) => {
// Middleware for socket authentication
io.use(async (socket, next) => {
try {
const token = socket.handshake.auth.token;
if (!token) {
return next(new Error('No token provided'));
}
const decoded = jwt.verify(token, process.env.JWT_SECRET);
const user = await User.findById(decoded.id).select('-password');
socket.user = user;
next();
} catch (error) {
next(new Error('Authentication error'));
}
});
io.on('connection', (socket) => {
console.log(`User ${socket.user.name} connected`);
// Join room based on user role
socket.join(socket.user.role);
// Patient status updates
socket.on('patient-arrived', (data) => {
io.to('doctor').emit('patient-arrived', {
patientId: data.patientId,
appointmentId: data.appointmentId,
arrivedAt: new Date(),
patientName: data.patientName
});
});
// Real-time appointment updates
socket.on('appointment-updated', (data) => {
io.emit('appointment-updated', data);
});
// Patient queue updates
socket.on('queue-update', (data) => {
io.to('doctor').emit('queue-update', data);
});
socket.on('disconnect', () => {
console.log(`User ${socket.user.name} disconnected`);
});
});
};
module.exports = configureSocket;