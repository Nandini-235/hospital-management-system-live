const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();
const reportRoutes = require('./routes/reportRoutes');
const http = require('http');
const mongoose = require('mongoose');
    mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hospital', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
socketIo = require('socket.io');
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('✅ Connected to MongoDB');
});
// Load environment variables
dotenv.config();

// CREATE HTTP SERVER
const server = http.createServer(app);

// SOCKET.IO SETUP
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});


// Middleware
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use(express.json());
// Mongoose Models
const Patient = require('./models/Patient');
const Appointment = require('./models/Appointment');
const User = require('./models/User');
//Report routes
app.use('/api/reports', reportRoutes);
// Basic route
app.get('/', (req, res) => {
    res.json({
        message: 'HMS Backend Server is running!',
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});


// Health check
app.get('/api/health', (req, res) => {
    res.json({
        message: 'HMS Server is healthy!',
        uptime: process.uptime(),
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});


// ================== AUTHENTICATION ROUTES ==================

// LOGIN ENDPOINT
app.post('/api/auth/login', (req, res) => {
    console.log('🔐 Login attempt:', req.body);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email and password are required'
        });
    }
    
    const demoLoginUsers = {
        'admin@hms.com': {
            id: '1',
            name: 'Nandini',
            email: 'admin@hms.com',
            role: 'admin',
            password: 'password123'
        },
        'doctor@hms.com': {
            id: '2',
            name: 'Dr. Tanvi Jadhav',
            email: 'doctor@hms.com',
            role: 'doctor',
            password: 'password123',
            specialization: 'Cardiology',
            experience: 8
        },
        'receptionist@hms.com': {
            id: '3',
            name: 'Apurva Karpe',
            email: 'receptionist@hms.com',
            role: 'receptionist',
            password: 'password123'
        }
    };
    
    const user = demoLoginUsers[email.toLowerCase()];
    
    if (user && user.password === password) {
        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            specialization: user.specialization || null,
            experience: user.experience || null
        };
        
        res.json({
            success: true,
            message: 'Login successful',
            user: userResponse,
            token: `demo-token-${user.id}-${Date.now()}`
        });
        
        console.log('✅ Login successful for:', user.name);
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
        console.log('❌ Login failed for:', email);
    }
});


// REGISTER ENDPOINT
app.post('/api/auth/register', (req, res) => {
    console.log('📝 Registration attempt:', req.body);
    
    const { name, email, password, role, phone } = req.body;
    
    if (!name || !email || !password || !role) {
        return res.status(400).json({
            success: false,
            message: 'Name, email, password, and role are required'
        });
    }
    
    const existingEmails = ['admin@hms.com', 'doctor@hms.com', 'receptionist@hms.com'];
    
    if (existingEmails.includes(email.toLowerCase())) {
        return res.status(400).json({
            success: false,
            message: 'User already exists with this email'
        });
    }
    
    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        role,
        phone: phone || 'N/A'
    };
    
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: newUser,
        token: `demo-token-${newUser.id}-${Date.now()}`
    });
    
    console.log('✅ Registration successful for:', name);
});


// PROFILE ENDPOINT
app.get('/api/auth/profile', (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token || !token.startsWith('demo-token-')) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, invalid token'
        });
    }
    
    const tokenParts = token.split('-');
    const userId = tokenParts[2];
    
    const demoProfiles = {
        '1': { id: '1', name: 'Nandini Kakade', email: 'admin@hms.com', role: 'admin' },
        '2': { id: '2', name: 'Dr. Tanvi Jadhav', email: 'doctor@hms.com', role: 'doctor', specialization: 'Cardiology', experience: 8 },
        '3': { id: '3', name: 'Apurva Karpe', email: 'receptionist@hms.com', role: 'receptionist' }
    };
    
    const user = demoProfiles[userId];
    
    if (user) {
        res.json({ success: true, user });
    } else {
        res.status(401).json({ success: false, message: 'User not found' });
    }
});


// ================== ADMIN ROUTES ==================


// GET ADMIN STATS
// Admin stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    const [totalDoctors, totalReceptionists, totalPatients, totalAppointments] = await Promise.all([
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'receptionist' }),
      Patient.countDocuments(),
      Appointment.countDocuments()
    ]);
    res.json({ success: true, stats: { totalDoctors, totalReceptionists, totalPatients, totalAppointments }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// Admin users CRUD with real-time updates
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if(!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch(err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/users', async (req, res) => {
  try {
    const user = new User(req.body);
    const saved = await user.save();
    io.emit('userCreated', saved);
    res.status(201).json({ success: true, message: 'User created', user: saved });
  } catch (err) {
    console.error("User creation failed:", err); // << Add this
    res.status(500).json({ success: false, message: err.message });
  }
});


app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if(!updated) return res.status(404).json({ success: false, message: 'User not found' });
    io.emit('userUpdated', updated);
    res.json({ success: true, message: 'User updated', user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if(!deleted) return res.status(404).json({ success: false, message: 'User not found' });
    io.emit('userDeleted', deleted);
    res.json({ success: true, message: 'User deleted', user: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================== RECEPTIONIST ROUTES ==================

// Patients CRUD + real-time
app.get('/api/receptionist/patients', async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const query = search ? {
    $or: [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  } : {};
  try {
    const total = await Patient.countDocuments(query);
    const patients = await Patient.find(query).skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ success: true, patients, pagination: { current: parseInt(page), pages: Math.ceil(total / limit), total }});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/receptionist/patients', async (req, res) => {
  try {
    const patient = new Patient(req.body);
    const saved = await patient.save();
    res.status(201).json({ success: true, patient: saved });
  } catch (err) {
    console.error('Add patient failed:', err); // <-- Add this!
    res.status(500).json({ success: false, message: err.message });
  }
});



app.put('/api/receptionist/patients/:id', async (req, res) => {
  try {
    const updated = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Patient not found' });
    io.emit('patientUpdated', updated);
    res.json({ success: true, message: 'Patient updated', patient: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/receptionist/patients/:id', async (req, res) => {
  try {
    const deleted = await Patient.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Patient not found' });
    io.emit('patientDeleted', deleted);
    res.json({ success: true, message: 'Patient deleted', patient: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Appointments CRUD + real-time
app.get('/api/receptionist/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find().populate('patient').limit(100);
    res.json({ success: true, appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/receptionist/appointments', async (req, res) => {
  try {
    const data = {
      doctor: req.body.doctor,        // from frontend payload
      patient: req.body.patient,      // from frontend payload
      appointmentDate: req.body.appointmentDate,
      appointmentTime: req.body.appointmentTime,
      priority: req.body.priority || 'medium',
      reasonForVisit: req.body.reasonForVisit,
      createdBy: req.user?._id || '6709ef2eac8b1234abcd5678' // example: receptionist ID (can come from token or static for now)
    };

    const appointment = new Appointment(data);
    const saved = await appointment.save();

    io.emit('appointmentCreated', saved);
    res.status(201).json({ success: true, message: 'Appointment scheduled', appointment: saved });
  } catch (err) {
    console.error('Appointment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});



app.put('/api/receptionist/appointments/:id', async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Appointment not found' });
    io.emit('appointmentUpdated', updated);
    res.json({ success: true, message: 'Appointment updated', appointment: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/receptionist/appointments/:id', async (req, res) => {
  try {
    const deleted = await Appointment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Appointment not found' });
    io.emit('appointmentDeleted', deleted);
    res.json({ success: true, message: 'Appointment deleted', appointment: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// Receptionist get all doctors (Mongoose)
app.get('/api/receptionist/doctors', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }); // Use your MongoDB User model
    res.json({ success: true, doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// Mark an appointment as arrived (receptionist action)
app.put('/api/receptionist/appointments/:id/arrived', async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        status: 'arrived',
        arrivedAt: new Date()
      },
      { new: true }
    ).populate('patient').populate('doctor');
    
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    // Send to all clients if using Socket.IO
    io.emit('appointmentArrived', updated);
    res.json({ success: true, appointment: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



// ================== DOCTOR ROUTES ==================

// Doctor stats
app.get('/api/doctor/appointments/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = await Appointment.find({ appointmentDate: { $gte: new Date(today) } });
    const statusCounts = await Promise.all(['scheduled','arrived','completed','cancelled'].map(
      s => Appointment.countDocuments({ status: s })
    ));
    res.json({
      success: true,
      stats: {
        today: todayAppointments.length,
        waitingNow: statusCounts[1],
        statusBreakdown: {
          scheduled: statusCounts[0],
          arrived: statusCounts[1],
          completed: statusCounts[2],
          cancelled: statusCounts[3]
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/doctor/appointments/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const appointments = await Appointment.find({ appointmentDate: { $gte: new Date(today) } }).populate('patient');
    res.json({ success: true, appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Waiting patients
app.get('/api/doctor/waiting-patients', async (req, res) => {
  try {
    const waitingPatients = await Appointment.find({ status: 'arrived' })
      .populate('patient', 'firstName lastName age gender phone email'); // use correct field names
    res.json({ success: true, waitingPatients });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// Complete appointment
// Complete an appointment (doctor)
app.put('/api/doctor/appointments/:id/complete', async (req, res) => {
  console.log('Complete consultation attempt for appointment:', req.params.id, req.body);

  try {
    const updateData = {
      status: 'completed',
      completedAt: new Date(),
      diagnosis: req.body.diagnosis,
      medication: req.body.medication,         // Or adjust key as needed
      followUpDate: new Date(req.body.followUpDate),
      additionalNotes: req.body.additionalNotes,
    };

    const updated = await Appointment.findByIdAndUpdate(
      req.params.id, updateData, { new: true }
    );

    if (!updated) {
      console.log('No appointment found for id:', req.params.id);
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    console.log('Appointment update success:', updated);
    res.json({ success: true, appointment: updated });

  } catch (err) {
    console.error('Error completing consultation route:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// ================== SOCKET.IO REAL-TIME IMPLEMENTATION ==================
// Store connected users by role
const connectedUsers = { admin:new Map(), doctor:new Map(), receptionist:new Map() };

io.on('connection', socket => {
  console.log('🔗 New client connected:', socket.id);

  socket.on('join', (userData) => {
    const { role, name, id } = userData;
    socket.userData = userData;
    socket.join(role);
    if(connectedUsers[role]) connectedUsers[role].set(socket.id, {name, id, socketId: socket.id});
    socket.to('admin').emit('userJoined', { role, name, socketId: socket.id, timestamp: new Date().toISOString() });
    broadcastUserCounts();
  });

  // Example event handling...
  socket.on('disconnect', () => {
    if(socket.userData){
      const {role, name} = socket.userData;
      if(connectedUsers[role]) connectedUsers[role].delete(socket.id);
      socket.to('admin').emit('userLeft', { role, name, socketId: socket.id, timestamp: new Date().toISOString() });
      console.log(`❌ ${role} ${name} left`);
      broadcastUserCounts();
    }
  });

  function broadcastUserCounts() {
    const counts = {
      admin: connectedUsers.admin.size,
      doctor: connectedUsers.doctor.size,
      receptionist: connectedUsers.receptionist.size,
      total: connectedUsers.admin.size + connectedUsers.doctor.size + connectedUsers.receptionist.size
    };
    io.emit('userCounts', counts);
    console.log('📊 User counts broadcasted:', counts);
  }
});
// Socket.IO API endpoints
app.get('/api/socket/connected-users', (req, res) => {
  const users = {
    admin: Array.from(connectedUsers.admin.values()),
    doctor: Array.from(connectedUsers.doctor.values()),
    receptionist: Array.from(connectedUsers.receptionist.values())
  };
  
  res.json({
    success: true,
    connectedUsers: users,
    totalConnected: users.admin.length + users.doctor.length + users.receptionist.length
  });
});
// Send broadcast message (admin only)
app.post('/api/socket/broadcast', (req, res) => {
  const { message, type, targetRole } = req.body;
  
  if (targetRole) {
    io.to(targetRole).emit('broadcast', {
      message,
      type,
      timestamp: new Date().toISOString(),
      from: 'Nandini'
    });
  } else {
    io.emit('broadcast', {
      message,
      type,
      timestamp: new Date().toISOString(),
      from: 'Nandini'
    });
  }
  
  res.json({ success: true, message: 'Broadcast sent' });
});

// ================== ERROR HANDLING ==================


// Catch all route
app.use('*', (req, res) => {
    console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        availableRoutes: {
            auth: ['/api/auth/login', '/api/auth/register', '/api/auth/profile'],
            admin: ['/api/admin/stats', '/api/admin/users', '/api/admin/users/:id', '/api/admin/users/:id/status'],
            receptionist: ['/api/receptionist/patients', '/api/receptionist/appointments', '/api/receptionist/doctors'],
            doctor: ['/api/doctor/appointments/stats', '/api/doctor/appointments/today', '/api/doctor/waiting-patients', '/api/doctor/appointments/:id/complete'],
            debug: ['/api/debug/data', '/api/debug/full-data']
        }
    });
});


const PORT = process.env.PORT || 5000;


server.listen(PORT, () => {
    console.log('🚀 ================================================');
    console.log(`✅ HMS Server running on port ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🔐 All authentication routes working`);
    console.log(`📊 All dashboard routes implemented`);
    console.log(`👥 All user management routes working`);
    console.log(`👩‍⚕️ All doctor routes including complete appointment`);
    console.log(`🔄 Socket.IO: Real-time features enabled`);
    console.log(`🩺 Patient name fix: Applied`);
    console.log(`👨‍👩‍👧‍👦 Custom names: Applied`);
    console.log('🚀 ================================================');
    console.log('📋 Demo Login Credentials:');
    console.log('   👩‍💼 Admin (Nandini): [admin@hms.com](mailto:admin@hms.com) / password123');
    console.log('   👩‍⚕️ Doctor (Dr. Tanvi Jadhav): [doctor@hms.com](mailto:doctor@hms.com) / password123');
    console.log('   👩‍💻 Receptionist (Apurva Karpe): [receptionist@hms.com](mailto:receptionist@hms.com) / password123');
    console.log('🚀 ================================================');
    
});