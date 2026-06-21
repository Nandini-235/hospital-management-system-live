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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Search,
  Visibility,
  CalendarMonth,
  Phone,
  Email
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import Loading from '../common/Loading';
import moment from 'moment';

const PatientList = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line
  }, [searchTerm]);

  const fetchPatients = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get(`/receptionist/patients?page=${page}&search=${searchTerm}&limit=10`);
      setPatients(response.data.patients);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Error fetching patients');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatient = async (patientId) => {
    try {
      const response = await api.get(`/receptionist/patients/${patientId}`);
      setSelectedPatient(response.data.patient);
      setOpenDialog(true);
    } catch (error) {
      toast.error('Error fetching patient details');
    }
  };

  const handleScheduleAppointment = (patient) => {
    navigate('/receptionist/new-appointment', { 
      state: { selectedPatient: patient } 
    });
  };

  const getAgeFromDOB = (dateOfBirth) => {
    return moment().diff(moment(dateOfBirth), 'years');
  };

  if (loading) return <Loading />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Patient List
      </Typography>

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search patients by name, email, or phone..."
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
      </Box>

      {/* Patients Count */}
      <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
        Total Patients: {pagination.total}
      </Typography>

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Emergency Contact</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient._id}>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">
                      {patient.firstName} {patient.lastName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Added by: {patient.addedBy.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{getAgeFromDOB(patient.dateOfBirth)}</TableCell>
                <TableCell>
                  <Chip 
                    label={patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                    color={patient.gender === 'male' ? 'primary' : patient.gender === 'female' ? 'secondary' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{patient.phone}</TableCell>
                <TableCell>{patient.email}</TableCell>
                <TableCell>
                  <Typography variant="caption" display="block">
                    {patient.emergencyContact.name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {patient.emergencyContact.phone}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleViewPatient(patient._id)}
                      title="View Details"
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleScheduleAppointment(patient)}
                      title="Schedule Appointment"
                      color="primary"
                    >
                      <CalendarMonth />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Patient Details Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Patient Details
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Personal Information
                    </Typography>
                    <Typography><strong>Name:</strong> {selectedPatient.firstName} {selectedPatient.lastName}</Typography>
                    <Typography><strong>Age:</strong> {getAgeFromDOB(selectedPatient.dateOfBirth)} years</Typography>
                    <Typography><strong>Gender:</strong> {selectedPatient.gender}</Typography>
                    <Typography><strong>DOB:</strong> {moment(selectedPatient.dateOfBirth).format('MM/DD/YYYY')}</Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      <Phone fontSize="small" sx={{ mr: 1 }} />
                      <Typography>{selectedPatient.phone}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mt={1}>
                      <Email fontSize="small" sx={{ mr: 1 }} />
                      <Typography>{selectedPatient.email}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Emergency Contact
                    </Typography>
                    <Typography><strong>Name:</strong> {selectedPatient.emergencyContact.name}</Typography>
                    <Typography><strong>Phone:</strong> {selectedPatient.emergencyContact.phone}</Typography>
                    <Typography><strong>Relationship:</strong> {selectedPatient.emergencyContact.relationship}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              {selectedPatient.address && (
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Address
                      </Typography>
                      <Typography>{selectedPatient.address.street}</Typography>
                      <Typography>
                        {selectedPatient.address.city}, {selectedPatient.address.state} {selectedPatient.address.zipCode}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Medical Information
                    </Typography>
                    <Typography><strong>Allergies:</strong></Typography>
                    <Box sx={{ mb: 2 }}>
                      {selectedPatient.allergies?.length > 0 ? (
                        selectedPatient.allergies.map((allergy, index) => (
                          <Chip key={index} label={allergy} size="small" sx={{ mr: 1, mb: 1 }} />
                        ))
                      ) : (
                        <Typography variant="body2" color="textSecondary">None reported</Typography>
                      )}
                    </Box>
                    <Typography><strong>Current Medications:</strong></Typography>
                    <Box>
                      {selectedPatient.currentMedications?.length > 0 ? (
                        selectedPatient.currentMedications.map((medication, index) => (
                          <Chip key={index} label={medication} size="small" sx={{ mr: 1, mb: 1 }} />
                        ))
                      ) : (
                        <Typography variant="body2" color="textSecondary">None reported</Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          {selectedPatient && (
            <Button 
              variant="contained" 
              onClick={() => {
                setOpenDialog(false);
                handleScheduleAppointment(selectedPatient);
              }}
              startIcon={<CalendarMonth />}
            >
              Schedule Appointment
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientList;
