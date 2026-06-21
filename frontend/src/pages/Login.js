import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs
} from '@mui/material';
import { LocalHospital } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';

const Login = () => {
  const [tab, setTab] = useState(0);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'receptionist',
    specialization: '',
    experience: ''
  });

  const { login, register, isAuthenticated, loading, error, clearError, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || getDefaultRoute(user?.role);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getDefaultRoute(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  function getDefaultRoute(role) {
    switch (role) {
      case USER_ROLES.ADMIN:
        return '/admin';
      case USER_ROLES.DOCTOR:
        return '/doctor';
      case USER_ROLES.RECEPTIONIST:
        return '/receptionist';
      default:
        return '/';
    }
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    const result = await login(loginData.email, loginData.password);
    if (result.success) {
      navigate(getDefaultRoute(result.user.role), { replace: true });
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    const result = await register(registerData);
    if (result.success) {
      navigate(getDefaultRoute(result.user.role), { replace: true });
    }
  };

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    clearError();
  };

  return (
    <div className="login-container">
      <Container maxWidth="sm">
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          minHeight="100vh"
          py={3}
        >
          <Paper elevation={8} sx={{ p: 4, borderRadius: 2 }}>
            <Box textAlign="center" mb={3}>
              <LocalHospital color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h4" component="h1" gutterBottom color="primary" fontWeight="bold">
                HMS
              </Typography>
              <Typography variant="h6" color="textSecondary">
                Hospital Management System
              </Typography>
            </Box>

            <Tabs 
              value={tab} 
              onChange={handleTabChange} 
              centered 
              sx={{ mb: 3 }}
            >
              <Tab label="Login" />
              <Tab label="Register" />
            </Tabs>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {tab === 0 ? (
              // Login Form
              <form onSubmit={handleLoginSubmit}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  margin="normal"
                  required
                  autoFocus
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  margin="normal"
                  required
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </form>
            ) : (
              // Register Form
              <form onSubmit={handleRegisterSubmit}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Phone"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  margin="normal"
                  required
                />
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={registerData.role}
                    label="Role"
                    onChange={(e) => setRegisterData({ ...registerData, role: e.target.value })}
                  >
                    <MenuItem value="receptionist">Receptionist</MenuItem>
                    <MenuItem value="doctor">Doctor</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
                
                {registerData.role === 'doctor' && (
                  <>
                    <TextField
                      fullWidth
                      label="Specialization"
                      value={registerData.specialization}
                      onChange={(e) => setRegisterData({ ...registerData, specialization: e.target.value })}
                      margin="normal"
                      required
                    />
                    <TextField
                      fullWidth
                      label="Experience (years)"
                      type="number"
                      value={registerData.experience}
                      onChange={(e) => setRegisterData({ ...registerData, experience: e.target.value })}
                      margin="normal"
                      required
                    />
                  </>
                )}
                
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  margin="normal"
                  required
                  helperText="Minimum 6 characters"
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Registering...
                    </>
                  ) : (
                    'Register'
                  )}
                </Button>
              </form>
            )}

            {/* Demo Credentials */}
            <Box mt={3} p={2} bgcolor="grey.100" borderRadius={1}>
              <Typography variant="subtitle2" gutterBottom>
                Demo Credentials:
              </Typography>
              <Typography variant="body2">
                <strong>Admin:</strong> admin@hms.com / password123<br />
                <strong>Doctor:</strong> doctor@hms.com / password123<br />
                <strong>Receptionist:</strong> receptionist@hms.com / password123
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    </div>
  );
};

export default Login;
