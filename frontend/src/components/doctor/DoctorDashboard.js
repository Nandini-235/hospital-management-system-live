import React, { useEffect, useState, useCallback } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Badge,
  Menu,
  MenuItem,
  Divider as MenuDivider,
  Fab,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Dashboard,
  People,
  CalendarToday,
  AccessTime,
  Assignment,
  Analytics,
  Menu as MenuIcon,
  LocalHospital,
  AccountCircle,
  PlayArrow,
  CheckCircle,
  Timer,
  Person,
  Settings,
  Logout,
  Refresh,
  Notifications,
  AutorenewOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { toast } from 'react-toastify';
import DoctorAnalytics from './DoctorAnalytics';
import {io} from 'socket.io-client';
const socket = io('http://localhost:5000'); // Replace with your server URL



const drawerWidth = 240;

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [stats, setStats] = useState({
    today: 0,
    thisWeek:  0 ,
    thisMonth: 0,
    waitingNow: 0
  });
  const [waitingPatients, setWaitingPatients] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  
  // Auto-refresh states
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [newPatientAlert, setNewPatientAlert] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  
  const [openConsultationDialog, setOpenConsultationDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [consultationForm, setConsultationForm] = useState({
    diagnosis: '',
    prescription: '',
    notes: '',
    followUpDate: '',
    additionalNotes: ''
  });

  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  // Fetch functions with useCallback to prevent infinite loops
  const fetchStats = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/doctor/appointments/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const fetchTodayAppointments = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/doctor/appointments/today', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodayAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error fetching today appointments:', error);
    }
  }, []);

  const fetchWaitingPatients = useCallback(async (showAlert = false) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/doctor/waiting-patients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newWaitingPatients = response.data.waitingPatients || [];
      
      // Check if there are new patients
      if (showAlert && newWaitingPatients.length > waitingPatients.length) {
        setNewPatientAlert(true);
        toast.info(`🏥 New patient arrived! Total waiting: ${newWaitingPatients.length}`, {
          position: "top-right",
          autoClose: 5000,
        });
      }
      
      setWaitingPatients(newWaitingPatients);
      setLastRefresh(new Date());
      
      console.log(`🔄 Refreshed waiting patients: ${newWaitingPatients.length} patients`);
    } catch (error) {
      console.error('Error fetching waiting patients:', error);
    }
  }, [waitingPatients.length]);

  // Manual refresh all data
  const handleManualRefresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered');
    await Promise.all([
      fetchStats(),
      fetchTodayAppointments(),
      fetchWaitingPatients(true)
    ]);
    toast.success('✅ Data refreshed!');
  }, [fetchStats, fetchTodayAppointments, fetchWaitingPatients]);

  // Initial data load
  useEffect(() => {
    fetchStats();
    fetchTodayAppointments();
    fetchWaitingPatients();
  }, [fetchStats, fetchTodayAppointments, fetchWaitingPatients]);

  // Auto-refresh setup
  useEffect(() => {
    if (isAutoRefresh) {
      console.log('🔄 Setting up auto-refresh every 10 seconds');
      
      const interval = setInterval(() => {
        console.log('🔄 Auto-refresh triggered');
        fetchWaitingPatients(true);
        fetchStats();
      }, 10000); // Refresh every 10 seconds
      
      setRefreshInterval(interval);
      
      return () => {
        console.log('🛑 Clearing auto-refresh interval');
        clearInterval(interval);
      };
    } else if (refreshInterval) {
      console.log('🛑 Auto-refresh disabled, clearing interval');
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [isAutoRefresh, fetchWaitingPatients, fetchStats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setIsAutoRefresh(!isAutoRefresh);
    toast.info(`Auto-refresh ${!isAutoRefresh ? 'enabled' : 'disabled'}`);
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
    console.log('Viewing profile for:', user.name);
    handleProfileMenuClose();
    alert(`Profile: Dr. ${user.name}\n Specialization: ${user.specialization || 'General'}\nEmail: ${user.email}`);
  };

  const handleLogout = () => {
    console.log('🚪 Logout clicked for user:', user.name);
    
    const confirmLogout = window.confirm('Are you sure you want to logout, Dr.Tanvi?');
    
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

  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  const handleStartConsultation = (appointment) => {
    console.log('Starting consultation for:', appointment);
    setSelectedAppointment(appointment);
    setConsultationForm({
      diagnosis: '',
      prescription: '',
      notes: '',
      followUpDate: '',
      additionalNotes: ''
    });
    setOpenConsultationDialog(true);
  };

  const handleCompleteConsultation = async () => {
    if (!selectedAppointment) return;

    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/doctor/appointments/${selectedAppointment._id}/complete`,
        consultationForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Consultation completed successfully!');
      setOpenConsultationDialog(false);
      setSelectedAppointment(null);
      
      // Refresh data after completing consultation
      handleManualRefresh();
    } catch (error) {
      console.error('Error completing consultation:', error);
      toast.error('Error completing consultation');
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, view: 'dashboard' },
    { text: 'Patient Queue', icon: <People />, view: 'queue' },
    { text: 'Today\'s Appointments', icon: <CalendarToday />, view: 'appointments' },
    { text: 'Analytics', icon: <Analytics />, view: 'analytics' }
  ];

  const DashboardHome = () => (
    <Box>
      {/* Auto-refresh indicator */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#333', fontWeight: 600, mb: 0 }}>
          Doctor Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            icon={isAutoRefresh ? <AutorenewOutlined /> : <Timer />}
            label={`${isAutoRefresh ? 'Auto' : 'Manual'} | Last: ${moment(lastRefresh).format('HH:mm:ss')}`}
            color={isAutoRefresh ? 'success' : 'default'}
            size="small"
            onClick={toggleAutoRefresh}
            sx={{ cursor: 'pointer' }}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={handleManualRefresh}
          >
            Refresh
          </Button>
        </Box>
      </Box>
      
      <Typography variant="body1" color="textSecondary" paragraph>
        Welcome back, Dr.Tanvi Jadhav! Here's your practice overview.
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', height: '140px' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" height="100%">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Today's Patients
                  </Typography>
                  <Typography variant="h3" component="div">
                    {stats.today}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <CalendarToday />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white', height: '140px' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" height="100%">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    This Week
                  </Typography>
                  <Typography variant="h3" component="div">
                    {stats.thisWeek}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <Assignment />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white', height: '140px' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" height="100%">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    This Month
                  </Typography>
                  <Typography variant="h3" component="div">
                    {stats.thisMonth}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <Analytics />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: waitingPatients.length > 0 ? 
              'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)' : 
              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white', 
            height: '140px',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.02)'
            }
          }}
          onClick={() => setCurrentView('queue')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" height="100%">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Waiting Now
                  </Typography>
                  <Typography variant="h3" component="div">
                    {waitingPatients.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <Badge badgeContent={waitingPatients.length} color="error">
                    <AccessTime />
                  </Badge>
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Schedule
              </Typography>
              {todayAppointments.length > 0 ? (
                todayAppointments.slice(0, 5).map((appointment, index) => (
                  <Box key={appointment._id || index} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                    <Box>
                      <Typography variant="subtitle2">
                        {appointment.patient?.firstName} {appointment.patient?.lastName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {appointment.reasonForVisit}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="primary">
                      {appointment.appointmentTime}
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography variant="body2" color="textSecondary">
                  No appointments scheduled for today
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" gutterBottom>
                  Patients Waiting ({waitingPatients.length})
                </Typography>
                {waitingPatients.length > 0 && (
                  <Chip 
                    icon={<Notifications />}
                    label="New patients!"
                    color="warning"
                    size="small"
                  />
                )}
              </Box>
              {waitingPatients.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No patients waiting
                </Typography>
              ) : (
                waitingPatients.slice(0, 3).map((patient, index) => (
                  <Box key={patient.appointmentId || index} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                    <Box>
                      <Typography variant="subtitle2">
                        {patient.patient?.firstName} {patient.patient?.lastName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Arrived: {moment(patient.arrivedAt).format('h:mm A')} 
                        ({moment(patient.arrivedAt).fromNow()})
                      </Typography>
                    </Box>
                    <Button 
                      size="small" 
                      variant="contained" 
                      startIcon={<PlayArrow />}
                      onClick={() => handleStartConsultation(patient)}
                      color="success"
                    >
                      Start
                    </Button>
                  </Box>
                ))
              )}
              {waitingPatients.length > 0 && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => setCurrentView('queue')}
                  sx={{ mt: 2 }}
                  fullWidth
                >
                  View All Queue ({waitingPatients.length})
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

 const PatientQueueView = () => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#333', fontWeight: 600, mb: 0 }}>
        Patient Queue ({waitingPatients.length})
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip 
          icon={isAutoRefresh ? <AutorenewOutlined /> : <Timer />}
          label={`Auto-refresh: ${isAutoRefresh ? 'ON' : 'OFF'}`}
          color={isAutoRefresh ? 'success' : 'default'}
          size="small"
          onClick={toggleAutoRefresh}
          sx={{ cursor: 'pointer' }}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<Refresh />}
          onClick={handleManualRefresh}
        >
          Refresh Now
        </Button>
      </Box>
    </Box>
    
    <Typography variant="body1" color="textSecondary" paragraph>
      Manage patients currently waiting for consultation. Last updated: {moment(lastRefresh).format('HH:mm:ss')}
    </Typography>
    
    {waitingPatients.length > 0 ? (
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#6c5ce7' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Patient Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Arrived At</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Waiting Time</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Reason</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {waitingPatients.map((patient, index) => (
                  <TableRow key={patient.appointmentId || index} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: '#6c5ce7' }}>
                          {/* ✅ FIXED: Access nested patient object */}
                          {patient.patient?.firstName?.charAt(0) || 'P'}
                        </Avatar>
                        <Typography variant="subtitle2">
                          {/* ✅ FIXED: Access nested patient object */}
                          {patient.patient?.firstName} {patient.patient?.lastName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Timer sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                        {moment(patient.arrivedAt).format('h:mm A')}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<AccessTime />}
                        label={`${moment().diff(moment(patient.arrivedAt), 'minutes')} min`}
                        color={moment().diff(moment(patient.arrivedAt), 'minutes') > 30 ? 'error' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{patient.reasonForVisit || 'General consultation'}</TableCell>
                    <TableCell>
                      <Button 
                        variant="contained" 
                        size="small"
                        startIcon={<PlayArrow />}
                        onClick={() => handleStartConsultation(patient)}
                        sx={{ 
                          bgcolor: '#6c5ce7',
                          '&:hover': { bgcolor: '#5a4fcf' }
                        }}
                      >
                        START CONSULTATION
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    ) : (
      <Card>
        <CardContent>
          <Box textAlign="center" py={4}>
            <People sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
              No patients in queue
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Patients will appear here when they arrive for their appointments
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<Refresh />}
              onClick={handleManualRefresh}
              sx={{ mt: 2 }}
            >
              Check for New Patients
            </Button>
          </Box>
        </CardContent>
      </Card>
    )}
  </Box>
);

  // ... rest of your existing views (TodayAppointmentsView, AnalyticsView, renderContent, drawer, etc.)
  
  const TodayAppointmentsView = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#333', fontWeight: 600 }}>
        Today's Appointments
      </Typography>
      
      {todayAppointments.length > 0 ? (
        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todayAppointments.map((appointment, index) => (
                    <TableRow key={appointment._id || index}>
                      <TableCell>{appointment.appointmentTime}</TableCell>
                      <TableCell>
                        {appointment.patient?.firstName} {appointment.patient?.lastName}
                      </TableCell>
                      <TableCell>{appointment.reasonForVisit}</TableCell>
                      <TableCell>
                        <Chip
                          label={appointment.status}
                          color={
                            appointment.status === 'completed' ? 'success' :
                            appointment.status === 'arrived' ? 'warning' : 'primary'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {appointment.status === 'arrived' && (
                          <Button 
                            variant="contained" 
                            size="small"
                            startIcon={<PlayArrow />}
                            onClick={() => handleStartConsultation(appointment)}
                          >
                            Start Consultation
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
      ) : (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <CalendarToday sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                No appointments scheduled for today
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  const AnalyticsView = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#333', fontWeight: 600 }}>
        Analytics
      </Typography>
      <Card>
        <CardContent>
          <Box textAlign="center" py={4}>
            <Analytics sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="textSecondary">
             Analaytics
            </Typography>
            <DoctorAnalytics />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'queue':
        return <PatientQueueView />;
      case 'appointments':
        return <TodayAppointmentsView />;
      case 'analytics':
        return <AnalyticsView />;
      default:
        return <DashboardHome />;
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Dr. {user?.name?.split(' ')[0]}
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              selected={currentView === item.view}
              onClick={() => handleNavigation(item.view)}
            >
              <ListItemIcon>
                {item.text === 'Patient Queue' ? (
                  <Badge badgeContent={waitingPatients.length} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
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
            HMS - Doctor Dashboard
          </Typography>
          
          {/* Auto-refresh status */}
          <Chip 
            icon={isAutoRefresh ? <AutorenewOutlined /> : <Timer />}
            label={isAutoRefresh ? 'Live' : 'Manual'}
            color={isAutoRefresh ? 'success' : 'default'}
            size="small"
            sx={{ mr: 2 }}
          />
          
          <Typography variant="body2" sx={{ mr: 2 }}>
            Dr. {user.name}
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

      {/* Floating Auto-refresh Toggle */}
      <Fab
        color={isAutoRefresh ? 'success' : 'default'}
        aria-label="toggle auto refresh"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}
        onClick={toggleAutoRefresh}
      >
        {isAutoRefresh ? <AutorenewOutlined /> : <Timer />}
      </Fab>

      {/* New Patient Alert */}
      <Snackbar
        open={newPatientAlert}
        autoHideDuration={6000}
        onClose={() => setNewPatientAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNewPatientAlert(false)} 
          severity="info" 
          sx={{ width: '100%' }}
        >
          🏥 New patient has arrived and is waiting!
        </Alert>
      </Snackbar>

      {/* Consultation Dialog */}
      <Dialog 
        open={openConsultationDialog} 
        onClose={() => setOpenConsultationDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Complete Consultation
          <Typography variant="subtitle2" color="textSecondary">
            Patient: {selectedAppointment?.patientName}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Diagnosis"
                multiline
                rows={3}
                value={consultationForm.diagnosis}
                onChange={(e) => setConsultationForm({...consultationForm, diagnosis: e.target.value})}
                margin="normal"
                placeholder="Enter diagnosis..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Medication"
                value={consultationForm.prescription}
                onChange={(e) => setConsultationForm({...consultationForm, prescription: e.target.value})}
                margin="normal"
                placeholder="Prescribed medication..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Follow-up Date"
                type="date"
                value={consultationForm.followUpDate}
                onChange={(e) => setConsultationForm({...consultationForm, followUpDate: e.target.value})}
                InputLabelProps={{ shrink: true }}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                multiline
                rows={2}
                value={consultationForm.additionalNotes}
                onChange={(e) => setConsultationForm({...consultationForm, additionalNotes: e.target.value})}
                margin="normal"
                placeholder="Any additional notes..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConsultationDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCompleteConsultation} 
            variant="contained"
            startIcon={<CheckCircle />}
          >
            Complete Consultation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DoctorDashboard;
