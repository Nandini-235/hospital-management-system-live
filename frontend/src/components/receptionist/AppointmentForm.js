import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Autocomplete,
  Chip
} from '@mui/material';
import { CalendarMonth } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { TIME_SLOTS, APPOINTMENT_PRIORITY } from '../../utils/constants';
import moment from 'moment';

const AppointmentForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedPatient = location.state?.selectedPatient;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    patient: selectedPatient?._id || '',
    doctor: '',
    appointmentDate: '',
    appointmentTime: '',
    reasonForVisit: '',
    priority: 'medium',
    notes: ''
  });

  useEffect(() => {
    fetchDoctors();
    if (!selectedPatient) {
      fetchPatients();
    }
  }, [selectedPatient]);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/receptionist/patients?limit=100');
      setPatients(response.data.patients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/receptionist/doctors');
      setDoctors(response.data.doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/receptionist/appointments', formData);
      toast.success('Appointment scheduled successfully!');
      navigate('/receptionist/appointments');
    } catch (error) {
      const message = error.response?.data?.message || 'Error scheduling appointment';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'error',
      emergency: 'error'
    };
    return colors[priority] || 'default';
  };

  // Get minimum date (today)
  const minDate = moment().format('YYYY-MM-DD');
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Schedule New Appointment
      </Typography>
      
      {selectedPatient && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Scheduling appointment for: <strong>{selectedPatient.firstName} {selectedPatient.lastName}</strong>
        </Alert>
      )}
      
      <Card elevation={3}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Patient Selection */}
              <Grid item xs={12} md={6}>
                {selectedPatient ? (
                  <TextField
                    fullWidth
                    label="Patient"
                    value={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
                    disabled
                  />
                ) : (
                  <Autocomplete
                    fullWidth
                    options={patients}
                    getOptionLabel={(patient) => `${patient.firstName} ${patient.lastName} - ${patient.phone}`}
                    value={patients.find(p => p._id === formData.patient) || null}
                    onChange={(event, newValue) => {
                      handleInputChange('patient', newValue ? newValue._id : '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Patient"
                        required
                      />
                    )}
                    renderOption={(props, patient) => (
                      <li {...props}>
                        <Box>
                          <Typography variant="subtitle2">
                            {patient.firstName} {patient.lastName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {patient.phone} | {patient.email}
                          </Typography>
                        </Box>
                      </li>
                    )}
                  />
                )}
              </Grid>

              {/* Doctor Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Select Doctor</InputLabel>
                  <Select
                    value={formData.doctor}
                    label="Select Doctor"
                    onChange={(e) => handleInputChange('doctor', e.target.value)}
                  >
                    {doctors.map(doctor => (
                      <MenuItem key={doctor._id} value={doctor._id}>
                        <Box>
                          <Typography variant="subtitle2">
                            Dr. {doctor.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {doctor.specialization} • {doctor.experience} years exp.
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Date and Time */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Appointment Date"
                  type="date"
                  value={formData.appointmentDate}
                  onChange={(e) => handleInputChange('appointmentDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: minDate }}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Appointment Time</InputLabel>
                  <Select
                    value={formData.appointmentTime}
                    label="Appointment Time"
                    onChange={(e) => handleInputChange('appointmentTime', e.target.value)}
                  >
                    {TIME_SLOTS.map(time => (
                      <MenuItem key={time} value={time}>
                        {moment(time, 'HH:mm').format('h:mm A')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Priority */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    label="Priority"
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                  >
                    {Object.entries(APPOINTMENT_PRIORITY).map(([key, value]) => (
                      <MenuItem key={key} value={value}>
                        <Chip 
                          label={value.charAt(0).toUpperCase() + value.slice(1)}
                          color={getPriorityColor(value)}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Reason for Visit */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reason for Visit"
                  value={formData.reasonForVisit}
                  onChange={(e) => handleInputChange('reasonForVisit', e.target.value)}
                  multiline
                  rows={3}
                  required
                  placeholder="Brief description of the patient's symptoms or reason for appointment"
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Additional Notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  multiline
                  rows={2}
                  placeholder="Any additional information or special instructions"
                />
              </Grid>
            </Grid>

            {/* Submit Buttons */}
            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/receptionist/appointments')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<CalendarMonth />}
                disabled={loading}
              >
                {loading ? 'Scheduling...' : 'Schedule Appointment'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AppointmentForm;
