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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Menu,
  Divider as MenuDivider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Dashboard,
  People,
  PersonAdd,
  Settings,
  Assessment,
  LocalHospital,
  Menu as MenuIcon,
  AccountCircle,
  Person,
  Logout,
  Edit,
  Delete,
  Add,
  Block,
  CheckCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import CombinedReports from './CombinedReports.js';

const drawerWidth = 240;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  
  // Data states
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalReceptionists: 0,
    totalPatients: 0,
    totalAppointments: 0
  });
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Dialog states
  const [openUserDialog, setOpenUserDialog] = useState(false);
 // const [openEditDialog, setOpenEditDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
    password:'',
    specialization: '',
    experience: '',
    isActive: true
  });

  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  // Fetch data
  useEffect(() => {
    fetchUsers();
  fetchStats();
  const interval = setInterval(fetchStats, 30000); // every 30 seconds
  return () => clearInterval(interval);
}, []);
  

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
      console.log("Data Refreshed..")
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Event handlers
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    console.log('🔍 Profile menu opened');
    event.preventDefault();
    event.stopPropagation();
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    console.log('❌ Profile menu closed');
    setProfileMenuAnchor(null);
  };

  const handleViewProfile = () => {
    console.log('👤 View Profile clicked for Nandini kakade:');
    handleProfileMenuClose();
    
    const profileInfo = `
Profile Information:
━━━━━━━━━━━━━━━━
👤 Name: Nandini Kakade
📧 Email: admin@hms.com
🎯 Role: Administrator
🏥 Department: Hospital Management
━━━━━━━━━━━━━━━━
    `.trim();
    
    alert(profileInfo);
  };

  const handleSettings = () => {
    console.log('⚙️ Settings clicked');
    handleProfileMenuClose();
    alert('Settings panel coming soon! 🛠️\n\nFeatures to be added:\n• System Configuration\n• User Permissions\n• Backup Settings\n• Security Options');
  };

  const handleLogout = () => {
    console.log('🚪 Logout clicked for user:', user.name);
    
    const confirmLogout = window.confirm('Are you sure you want to logout,', user.name,'?');
    
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

  const handleAddUser = () => {
    setIsEditing(false);
    setUserForm({
      name: '',
      email: '',
      role: '',
      phone: '',
      specialization: '',
      experience: '',
      password: '',
      isActive: true
    });
    setOpenUserDialog(true);
  };

  const handleEditUser = (user) => {
    setIsEditing(true);
    setSelectedUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      specialization: user.specialization || '',
      experience: user.experience || '',
      isActive: user.isActive
    });
    setOpenUserDialog(true);
  };

  const handleSubmitUser = async () => {
    try {
      const token = sessionStorage.getItem('token');
      
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/admin/users/${selectedUser._id}`, userForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('User updated successfully!');
      } else {
        await axios.post('http://localhost:5000/api/admin/users', userForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('User added successfully!');
      }
      
      setOpenUserDialog(false);
      fetchUsers();
      fetchStats();
    } catch (error) {
      toast.error('Error saving user');
      console.error(error);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/users/${userId}/status`, 
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchUsers();
    } catch (error) {
      toast.error('Error updating user status');
      console.error(error);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`);
    
    if (confirmDelete) {
      try {
        const token = sessionStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        toast.success('User deleted successfully!');
        fetchUsers();
        fetchStats();
      } catch (error) {
        toast.error('Error deleting user');
        console.error(error);
      }
    }
  };

  // Menu items
  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, view: 'dashboard' },
    { text: 'User Management', icon: <People />, view: 'users' },
    { text: 'Add User', icon: <PersonAdd />, view: 'add-user', action: handleAddUser },
    { text: 'Reports', icon: <Assessment />, view: 'reports' }
  ];

  // Dashboard views
  const DashboardHome = () => (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#333', fontWeight: 600 }}>
        Admin Dashboard
      </Typography>
      <Typography variant="body1" sx={{ color: '#666', mb: 4 }}>
        Welcome back, {user.name} || Nandini kakade ! Here's your hospital overview.
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', height: '140px', cursor: 'pointer' }} onClick={() => setCurrentView('users')}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" height="100%">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Total Doctors
                  </Typography>
                  <Typography variant="h3" component="div">
                    {stats.totalDoctors}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <People />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', height: '140px', cursor: 'pointer' }} onClick={() => setCurrentView('users')}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" height="100%">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Receptionists
                  </Typography>
                  <Typography variant="h3" component="div">
                    {stats.totalReceptionists}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <PersonAdd />
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
                    Total Patients
                  </Typography>
                  <Typography variant="h3" component="div">
                    {stats.totalPatients}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <Assessment />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', height: '140px' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" height="100%">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Appointments
                  </Typography>
                  <Typography variant="h3" component="div">
                    {stats.totalAppointments}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                  <LocalHospital />
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
                onClick={handleAddUser}
              >
                Add New User
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<People />}
                onClick={() => setCurrentView('users')}
              >
                Manage Users
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<Assessment />}
                onClick={() => setCurrentView('reports')}
              >
                View Reports
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<Settings />}
                onClick={handleSettings}
              >
                System Settings
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  const UserManagementView = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom sx={{ color: '#333', fontWeight: 600 }}>
          User Management ({users.length})
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={handleAddUser}
        >
          Add New User
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
                  <TableCell>Role</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role}
                        color={user.role === 'admin' ? 'error' : user.role === 'doctor' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditUser(user)}
                        title="Edit User"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {user.isActive ? <Block /> : <CheckCircle />}
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteUser(user._id, user.name)}
                        title="Delete User"
                        color="error"
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

  const ReportsView = () => (
  <Box>
    <Typography variant="h4" gutterBottom sx={{ color: '#333', fontWeight: 600 }}>
      Reports & Analytics
    </Typography>
    <Card>
      <CardContent>
        <CombinedReports />
      </CardContent>
    </Card>
  </Box>
);


  const renderContent = () => {
    switch (currentView) {
      case 'users':
        return <UserManagementView />;
      case 'reports':
        return <ReportsView />;
      default:
        return <DashboardHome />;
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Admin Panel
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
                  handleNavigation(item.view);
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
      {/* Fixed AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          height: '64px',
          zIndex: (theme) => theme.zIndex.drawer + 1
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
            HMS - Admin Dashboard
          </Typography>
          
          <Typography variant="body2" sx={{ mr: 2, color: 'rgba(255,255,255,0.8)' }}>
            Welcome, {user.name}|| Nandini kakade!
          </Typography>
          
          <IconButton 
            color="inherit"
            onClick={handleProfileMenuOpen}
            sx={{ 
              mr: 1,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <AccountCircle />
          </IconButton>
          
          <Menu
            anchorEl={profileMenuAnchor}
            open={Boolean(profileMenuAnchor)}
            onClose={handleProfileMenuClose}
            onClick={handleProfileMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              elevation: 3,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                minWidth: 200
              }
            }}
          >
            <MenuItem disabled sx={{ opacity: 1 }}>
              <ListItemIcon>
                <AccountCircle />
              </ListItemIcon>
              <ListItemText 
                primary={user.name}
                secondary="Administrator"
              />
            </MenuItem>
            
            <MenuDivider />
            
            <MenuItem onClick={(e) => {
              e.stopPropagation();
              handleViewProfile();
            }}>
              <ListItemIcon>
                <Person />
              </ListItemIcon>
              <ListItemText primary="View Profile" />
            </MenuItem>
            
            <MenuItem onClick={(e) => {
              e.stopPropagation();
              handleSettings();
            }}>
              <ListItemIcon>
                <Settings />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </MenuItem>
            
            <MenuDivider />
            
            <MenuItem 
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <Logout sx={{ color: 'inherit' }} />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
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

      {/* Main content */}
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

      {/* User Dialog */}
      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                value={userForm.name}
                onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                margin="normal"
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select
                  value={userForm.role}
                  label="Role"
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                >
                  <MenuItem value="doctor">Doctor</MenuItem>
                  <MenuItem value="receptionist">Receptionist</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={userForm.phone}
                onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                margin="normal"
              />
            </Grid>
            {userForm.role === 'doctor' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Specialization"
                    value={userForm.specialization}
                    onChange={(e) => setUserForm({...userForm, specialization: e.target.value})}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Experience (years)"
                    type="number"
                    value={userForm.experience}
                    onChange={(e) => setUserForm({...userForm, experience: e.target.value})}
                    margin="normal"
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={userForm.isActive}
                    onChange={(e) => setUserForm({...userForm, isActive: e.target.checked})}
                  />
                }
                label="Active User"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmitUser} variant="contained">
            {isEditing ? 'Update User' : 'Add User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
