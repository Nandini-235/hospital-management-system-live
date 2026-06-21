import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  Divider as MenuDivider
} from '@mui/material';
import {
  Dashboard,
  PersonAdd,
  People,
  CalendarMonth,
  Assignment,
  LocalHospital,
  Menu as MenuIcon,
  AccountCircle,
  Add,
  Visibility,
  Person,
  Settings,
  Logout,
  Refresh,
  Delete
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import AutoRefreshIndicator from './AutoRefreshIndicator';

const drawerWidth = 240;
// If your backend base URL is different, change this.
const API_BASE = 'http://localhost:5000/api/receptionist';

const ReceptionistDashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingAppointments: 0
  });
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [loading,setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [openPatientDialog, setOpenPatientDialog] = useState(false);
  const [openAppointmentDialog, setOpenAppointmentDialog] = useState(false);

  const [patientForm, setPatientForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  const [appointmentForm, setAppointmentForm] = useState({
    patient: '',
    doctor: '',
    appointmentDate: '',
    appointmentTime: '',
    reasonForVisit: '',
    priority: 'medium'
  });
      < AutoRefreshIndicator lastRefresh={lastRefresh} isAuto={true} />

  const navigate = useNavigate();

  // safe parse user
  let user = {};
  try {
    user = JSON.parse(sessionStorage.getItem('user') || '{}');
  } catch (e) {
    user = {};
  }

  // Fetch data function
  const fetchData = async () => {
    setLoading(true);
    try {

      console.log('🔄 Fetching receptionist data...');
      const token = sessionStorage.getItem('token');

      if (!token) {
        console.log('❌ No token found, redirecting to login');
        navigate('/login');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all data
      const [patientsRes, appointmentsRes, doctorsRes] = await Promise.all([
        axios.get(`${API_BASE}/patients`, { headers }),
        axios.get(`${API_BASE}/appointments`, { headers }),
        axios.get(`${API_BASE}/doctors`, { headers })
      ]);

      console.log('✅ Data fetched successfully');
      setPatients(patientsRes.data.patients || []);
      setAppointments(appointmentsRes.data.appointments || []);
      setDoctors(doctorsRes.data.doctors || []);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = (appointmentsRes.data.appointments || []).filter(apt =>
        apt.appointmentDate && apt.appointmentDate.startsWith(today)
      );

      setStats({
        totalPatients: (patientsRes.data.patients || []).length,
        todayAppointments: todayAppointments.length,
        pendingAppointments: (appointmentsRes.data.appointments || []).filter(apt => apt.status === 'scheduled').length
      });
      setLastRefresh(new Date());
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      if (error.response?.status === 401) {
        sessionStorage.clear();
        navigate('/login');
      } else {
        toast.error('Error loading data. Please try refreshing.');
      }
    }
    finally{
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
  fetchData();
  const interval = setInterval(fetchData, 10000); // every 30 seconds
  return () => clearInterval(interval);
}, []);

  // Manual refresh
  const handleRefresh = async () => {
  try {
    const token = sessionStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.get(`${API_BASE}/appointments`, { headers });
    setAppointments(response.data.appointments || []); // FIXED
    console.log("Data Refreshed..")
  } catch (error) {
    console.error('Error fetching appointments:', error);
  }
};


  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleViewProfile = () => {
    console.log('Viewing profile for:', user?.name);
    handleProfileMenuClose();
    alert(`Profile: ${"Apurva Karpe"}\nRole: ${'Receptionist'}\nEmail: ${'receptionist@hms.com'}`);
  };

  const handleLogout = () => {
    console.log('🚪 Logout clicked for user:', user.name);
    
    const confirmLogout = window.confirm('Are you sure you want to logout Miss. Apurva Karpe?');
    
    if (confirmLogout) {
      try {
        sessionStorage.clear();
        sessionStorage.clear();
        console.log("All Stoarage clear");
        window.location.reload();
        
      } catch (error) {
        console.error('❌ Logout error:', error);
        window.location.href = '/login';
      }
    } else {
      handleProfileMenuClose();
    }
  };
  const handleAddPatient = () => {
    console.log('🆕 Opening add patient dialog');
    setPatientForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      address: { street: '', city: '', state: '', zipCode: '' },
      emergencyContact: { name: '', phone: '', relationship: '' }
    });
    setOpenPatientDialog(true);
  };
useEffect(() => {
  handleRefresh();
}, []);

  // Fixed delete patient implementation
  const handleDeletePatient = async (patient) => {
    if (!patient) return;
    const confirmed = window.confirm(`Are you sure you want to delete patient "${patient.firstName} ${patient.lastName}"?`);
    if (!confirmed) return;

    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${API_BASE}/patients/${patient._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Patient deleted successfully!');
      await fetchData();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error deleting patient';
      toast.error(errorMessage);
      console.error('Delete error:', error);
    }
  };

  const handleScheduleAppointment = () => {
    console.log('📅 Opening schedule appointment dialog');
    setAppointmentForm({
      patient: '',
      doctor: '',
      appointmentDate: '',
      appointmentTime: '',
      reasonForVisit: '',
      priority: 'medium'
    });
    setOpenAppointmentDialog(true);
  };

  const handleViewPatients = () => {
    console.log('👥 Navigating to patients view');
    setCurrentView('patients');
  };

  const handleViewAppointments = () => {
    console.log('📋 Navigating to appointments view');
    setCurrentView('appointments');
  };

  const handleSubmitPatient = async () => {
    try {
      console.log('👤 Submitting new patient:', patientForm);
      const token = sessionStorage.getItem('token');

      await axios.post(`${API_BASE}/patients`, patientForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Patient added successfully');
      toast.success('Patient added successfully!');
      setOpenPatientDialog(false);

      // Refresh data
      fetchData();
    } catch (error) {
      console.error('❌ Error adding patient:', error);
      toast.error('Error adding patient. Please try again.');
    }
  };

  const handleSubmitAppointment = async () => {
    try {
      console.log('📅 Submitting new appointment:', appointmentForm);
      const token = sessionStorage.getItem('token');

      await axios.post(`${API_BASE}/appointments`, appointmentForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Appointment scheduled successfully');
      toast.success('Appointment scheduled successfully!');
      setOpenAppointmentDialog(false);

      // Refresh data
      fetchData();
    } catch (error) {
      console.error('❌ Error scheduling appointment:', error);
      toast.error('Error scheduling appointment. Please try again.');
    }
  };

  const handleMarkArrived = async (appointmentId) => {
    try {
      console.log('✅ Marking patient as arrived:', appointmentId);
      const token = sessionStorage.getItem('token');

      await axios.put(`${API_BASE}/appointments/${appointmentId}/arrived`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Patient marked as arrived');
      toast.success('Patient marked as arrived!');

      // Refresh data
      fetchData();
    } catch (error) {
      console.error('❌ Error marking patient as arrived:', error);
      toast.error('Error updating appointment. Please try again.');
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, view: 'dashboard' },
    { text: 'Add Patient', icon: <PersonAdd />, view: 'add-patient', action: handleAddPatient },
    { text: 'Patient List', icon: <People />, view: 'patients', action: handleViewPatients },
    { text: 'New Appointment', icon: <CalendarMonth />, view: 'new-appointment', action: handleScheduleAppointment },
    { text: 'Appointments', icon: <Assignment />, view: 'appointments', action: handleViewAppointments }
  ];

  const DashboardHome = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        
        <Typography variant="h4" sx={{ flexGrow: 1 }}>Receptionist Dashboard</Typography>
  <AutoRefreshIndicator lastRefresh={lastRefresh} />
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </Box>

      <Typography variant="body1" sx={{ color: '#666', mb: 4 }}>
        Welcome back, {user?.name || 'Receptionist: Miss. Apurva Karpe'}! Manage patients and appointments efficiently.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            height: '140px',
            cursor: 'pointer',
            '&:hover': { transform: 'scale(1.02)' }
          }}
            onClick={handleViewPatients}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" height="100%">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Total Patients
                  </Typography>
                  <Typography variant="h3" component="div">
                    {stats.totalPatients}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <People />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            height: '140px',
            cursor: 'pointer',
            '&:hover': { transform: 'scale(1.02)' }
          }}
            onClick={handleViewAppointments}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" height="100%">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Today's Appointments
                  </Typography>
                  <Typography variant="h3" component="div">
                    {stats.todayAppointments}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <CalendarMonth />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white',
            height: '140px',
            cursor: 'pointer',
            '&:hover': { transform: 'scale(1.02)' }
          }}
            onClick={handleViewAppointments}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" height="100%">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Pending Appointments
                  </Typography>
                  <Typography variant="h3" component="div">
                    {stats.pendingAppointments}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <Assignment />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PersonAdd />}
                onClick={handleAddPatient}
              >
                Add New Patient
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CalendarMonth />}
                onClick={handleScheduleAppointment}
              >
                Schedule Appointment
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<People />}
                onClick={handleViewPatients}
              >
                View Patients
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Assignment />}
                onClick={handleViewAppointments}
              >
                View Appointments
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  const PatientListView = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom sx={{ color: '#333', fontWeight: 600 }}>
          Patient List ({patients.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddPatient}
        >
          Add New Patient
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient._id}>
                    <TableCell>{patient.firstName} {patient.lastName}</TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell>
                      <Chip
                        label={patient.gender || 'N/A'}
                        size="small"
                        color={patient.gender === 'male' ? 'primary' : (patient.gender === 'female' ? 'secondary' : 'default')}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" title="View Details">
                        <Visibility />
                      </IconButton>
                      <IconButton
                        size="small"
                        title="Delete Patient"
                        onClick={() => handleDeletePatient(patient)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const AppointmentListView = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom sx={{ color: '#333', fontWeight: 600 }}>
          Appointments ({appointments.length})
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleScheduleAppointment}
          >
            Schedule New
          </Button>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>Doctor</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment._id}>
                    <TableCell>
                      {appointment.patient?.firstName} {appointment.patient?.lastName}
                    </TableCell>
                      Dr.Tanvi Jadhav      
                  <TableCell>
                      {appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>{appointment.appointmentTime || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={appointment.status || 'unknown'}
                        color={
                          appointment.status === 'completed' ? 'success' :
                            appointment.status === 'arrived' ? 'warning' :
                              appointment.status === 'scheduled' ? 'primary' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {appointment.status === 'scheduled' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleMarkArrived(appointment._id)}
                        >
                          Mark Arrived
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'patients':
        return <PatientListView />;
      case 'appointments':
        return <AppointmentListView />;
      default:
        return <DashboardHome />;
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Receptionist Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={currentView === item.view}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else {
                  setCurrentView(item.view);
                }
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          height: '64px'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <LocalHospital sx={{ mr: 2 }} />
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            HMS - Receptionist Dashboard
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.name || 'Receptionist Miss. Apurva Karpe'}
          </Typography>
          <IconButton
            color="inherit"
            onClick={handleProfileMenuOpen}
            sx={{ mr: 1 }}
          >
            <AccountCircle />
          </IconButton>

          <Menu
            anchorEl={profileMenuAnchor}
            open={Boolean(profileMenuAnchor)}
            onClose={handleProfileMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleViewProfile}>
              <ListItemIcon>
                <Person />
              </ListItemIcon>
              <ListItemText primary="View Profile" />
            </MenuItem>
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <Settings />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </MenuItem>
            <MenuDivider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: '#f5f5f5',
          minHeight: '100vh',
          mt: '64px'
        }}
      >
        {renderContent()}
      </Box>

      {/* Add Patient Dialog */}
      <Dialog open={openPatientDialog} onClose={() => setOpenPatientDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Patient</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={patientForm.firstName}
                onChange={(e) => setPatientForm({ ...patientForm, firstName: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={patientForm.lastName}
                onChange={(e) => setPatientForm({ ...patientForm, lastName: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={patientForm.email}
                onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={patientForm.phone}
                onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                value={patientForm.dateOfBirth}
                onChange={(e) => setPatientForm({ ...patientForm, dateOfBirth: e.target.value })}
                InputLabelProps={{ shrink: true }}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Gender</InputLabel>
                <Select
                  value={patientForm.gender}
                  label="Gender"
                  onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPatientDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmitPatient} variant="contained">Add Patient</Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Appointment Dialog */}
      <Dialog open={openAppointmentDialog} onClose={() => setOpenAppointmentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule New Appointment</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Patient</InputLabel>
            <Select
              value={appointmentForm.patient}
              label="Select Patient"
              onChange={(e) => setAppointmentForm({ ...appointmentForm, patient: e.target.value })}
            >
              {patients.map(patient => (
                <MenuItem key={patient._id} value={patient._id}>
                  {patient.firstName} {patient.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Select Doctor</InputLabel>
            <Select
              value={appointmentForm.doctor}
              label="Select Doctor"
              onChange={(e) => setAppointmentForm({ ...appointmentForm, doctor: e.target.value })}
            >
              {doctors.map(doctor => (
                <MenuItem key={doctor._id} value={doctor._id}>
                  Dr. {doctor.name} - {doctor.specialization}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Appointment Date"
            type="date"
            value={appointmentForm.appointmentDate}
            onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Appointment Time"
            type="time"
            value={appointmentForm.appointmentTime}
            onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentTime: e.target.value })}
            InputLabelProps={{ shrink: true }}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Reason for Visit"
            multiline
            rows={3}
            value={appointmentForm.reasonForVisit}
            onChange={(e) => setAppointmentForm({ ...appointmentForm, reasonForVisit: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAppointmentDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmitAppointment} variant="contained">Schedule Appointment</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReceptionistDashboard;
