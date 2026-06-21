import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search,
  Cancel,
  CheckCircle,
  Person,

} from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useSocket } from '../../context/SocketContext';
import Loading from '../common/Loading';
//import { STATUS_COLORS, PRIORITY_COLORS } from '../../utils/constants';
import moment from 'moment';

const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const { emitPatientArrived, emitAppointmentUpdate } = useSocket();

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line
  }, [statusFilter]);

  useEffect(() => {
    // Listen for real-time updates
    const handleAppointmentUpdate = (event) => {
      const updatedAppointment = event.detail;
      setAppointments(prev => 
        prev.map(app => 
          app._id === updatedAppointment._id ? updatedAppointment : app
        )
      );
    };

    window.addEventListener('appointment-updated', handleAppointmentUpdate);
    return () => window.removeEventListener('appointment-updated', handleAppointmentUpdate);
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let url = '/receptionist/appointments?';
      if (statusFilter) url += `status=${statusFilter}&`;
      
      const response = await api.get(url);
      setAppointments(response.data.appointments);
    } catch (error) {
      toast.error('Error fetching appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsArrived = async (appointmentId) => {
    try {
      const response = await api.put(`/receptionist/appointments/${appointmentId}/arrived`);
      
      setAppointments(prev => 
        prev.map(app => 
          app._id === appointmentId 
            ? { ...app, status: 'arrived', arrivedAt: new Date() }
            : app
        )
      );

      // Emit real-time update
      emitPatientArrived({
        appointmentId: appointmentId,
        patientId: response.data.appointment.patient,
        patientName: response.data.appointment.patient?.firstName + ' ' + response.data.appointment.patient?.lastName
      });

      toast.success('Patient marked as arrived');
    } catch (error) {
      toast.error('Error updating appointment status');
    }
  };

  const handleCancelAppointment = async (appointmentId, reason) => {
    try {
      await api.delete(`/receptionist/appointments/${appointmentId}`, {
        data: { reason }
      });
      
      setAppointments(prev => 
        prev.map(app => 
          app._id === appointmentId 
            ? { ...app, status: 'cancelled' }
            : app
        )
      );

      emitAppointmentUpdate({ appointmentId, status: 'cancelled' });
      toast.success('Appointment cancelled');
      setOpenDialog(false);
    } catch (error) {
      toast.error('Error cancelling appointment');
    }
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'scheduled': 'primary',
      'arrived': 'warning',
      'in-progress': 'info',
      'completed': 'success',
      'cancelled': 'error',
      'no-show': 'default'
    };
    return colorMap[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colorMap = {
      'low': 'success',
      'medium': 'warning',
      'high': 'error',
      'emergency': 'error'
    };
    return colorMap[priority] || 'default';
  };

  const filteredAppointments = appointments.filter(appointment => {
    const searchLower = searchTerm.toLowerCase();
    return (
      appointment.patient?.firstName?.toLowerCase().includes(searchLower) ||
      appointment.patient?.lastName?.toLowerCase().includes(searchLower) ||
      appointment.doctor?.name?.toLowerCase().includes(searchLower) ||
      appointment.reasonForVisit?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) return <Loading />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Appointments
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Filter by Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="arrived">Arrived</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button 
                fullWidth 
                variant="outlined" 
                onClick={fetchAppointments}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Doctor</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAppointments.map((appointment) => (
              <TableRow key={appointment._id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Person sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="subtitle2">
                        {appointment.patient?.firstName} {appointment.patient?.lastName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {appointment.patient?.phone}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">
                      Dr. {appointment.doctor?.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {appointment.doctor?.specialization}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">
                      {moment(appointment.appointmentDate).format('MMM DD, YYYY')}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {moment(appointment.appointmentTime, 'HH:mm').format('h:mm A')}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 200 }}>
                    {appointment.reasonForVisit}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={appointment.priority.charAt(0).toUpperCase() + appointment.priority.slice(1)}
                    color={getPriorityColor(appointment.priority)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={appointment.status.replace('-', ' ').toUpperCase()}
                    color={getStatusColor(appointment.status)}
                    size="small"
                  />
                  {appointment.status === 'arrived' && appointment.arrivedAt && (
                    <Typography variant="caption" display="block" color="textSecondary">
                      Arrived: {moment(appointment.arrivedAt).format('h:mm A')}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    {appointment.status === 'scheduled' && (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => handleMarkAsArrived(appointment._id)}
                        >
                          Mark Arrived
                        </Button>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setOpenDialog(true);
                          }}
                          title="Cancel Appointment"
                        >
                          <Cancel />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredAppointments.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No appointments found
          </Typography>
        </Box>
      )}

      {/* Cancel Appointment Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Cancel Appointment</DialogTitle>
        <DialogContent>
          {selectedAppointment && (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to cancel this appointment?
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Patient:</strong> {selectedAppointment.patient?.firstName} {selectedAppointment.patient?.lastName}<br />
                <strong>Doctor:</strong> Dr. {selectedAppointment.doctor?.name}<br />
                <strong>Date:</strong> {moment(selectedAppointment.appointmentDate).format('MMM DD, YYYY')} at {moment(selectedAppointment.appointmentTime, 'HH:mm').format('h:mm A')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Keep Appointment</Button>
          <Button 
            onClick={() => selectedAppointment && handleCancelAppointment(selectedAppointment._id, 'Cancelled by receptionist')}
            color="error"
            variant="contained"
          >
            Cancel Appointment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentList;
