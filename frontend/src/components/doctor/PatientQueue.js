import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  Divider,
  Avatar
} from '@mui/material';
import {
  Person,
  AccessTime,
  Phone,
  Email,
  CheckCircle,
  Schedule
} from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import Loading from '../common/Loading';
import moment from 'moment';

const PatientQueue = () => {
  const [waitingPatients, setWaitingPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [consultationData, setConsultationData] = useState({
    diagnosis: '',
    prescription: [],
    followUpDate: '',
    notes: ''
  });
  const [prescriptionInput, setPrescriptionInput] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });

  useEffect(() => {
    fetchWaitingPatients();
    
    // Listen for real-time updates
    const handlePatientArrived = (event) => {
      const newPatient = event.detail;
      setWaitingPatients(prev => [...prev, newPatient]);
    };

    const handleQueueUpdate = (event) => {
      fetchWaitingPatients(); // Refresh the queue
    };

    window.addEventListener('patient-arrived', handlePatientArrived);
    window.addEventListener('queue-update', handleQueueUpdate);
    
    return () => {
      window.removeEventListener('patient-arrived', handlePatientArrived);
      window.removeEventListener('queue-update', handleQueueUpdate);
    };
  }, []);

  const fetchWaitingPatients = async () => {
    try {
      const response = await api.get('/doctor/waiting-patients');
      setWaitingPatients(response.data.waitingPatients);
    } catch (error) {
      console.error('Error fetching waiting patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConsultation = async (appointment) => {
    try {
      await api.put(`/doctor/appointments/${appointment._id}`, {
        status: 'in-progress'
      });
      
      setWaitingPatients(prev => 
        prev.filter(p => p._id !== appointment._id)
      );
      
      toast.success('Consultation started');
    } catch (error) {
      toast.error('Error starting consultation');
    }
  };

  const handleCompleteConsultation = (appointment) => {
    setSelectedPatient(appointment);
    setOpenDialog(true);
  };

  const addPrescription = () => {
    if (prescriptionInput.medication && prescriptionInput.dosage) {
      setConsultationData(prev => ({
        ...prev,
        prescription: [...prev.prescription, { ...prescriptionInput }]
      }));
      setPrescriptionInput({
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      });
    }
  };

  const removePrescription = (index) => {
    setConsultationData(prev => ({
      ...prev,
      prescription: prev.prescription.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitConsultation = async () => {
    try {
      await api.put(`/doctor/appointments/${selectedPatient._id}/complete`, consultationData);
      
      setWaitingPatients(prev => 
        prev.filter(p => p._id !== selectedPatient._id)
      );
      
      toast.success('Consultation completed successfully');
      setOpenDialog(false);
      resetConsultationData();
    } catch (error) {
      toast.error('Error completing consultation');
    }
  };

  const resetConsultationData = () => {
    setConsultationData({
      diagnosis: '',
      prescription: [],
      followUpDate: '',
      notes: ''
    });
    setPrescriptionInput({
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
    setSelectedPatient(null);
  };

  const getWaitingTime = (arrivedAt) => {
    return moment().diff(moment(arrivedAt), 'minutes');
  };

  const getWaitingTimeColor = (minutes) => {
    if (minutes < 15) return 'success';
    if (minutes < 30) return 'warning';
    return 'error';
  };

  if (loading) return <Loading />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Patient Queue
      </Typography>
      
      {waitingPatients.length === 0 ? (
        <Card elevation={3}>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'primary.main', width: 64, height: 64 }}>
                <Schedule fontSize="large" />
              </Avatar>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No patients waiting
              </Typography>
              <Typography variant="body2" color="textSecondary">
                All caught up! No patients are currently in the waiting queue.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Waiting Patients ({waitingPatients.length})
            </Typography>
            <List>
              {waitingPatients.map((appointment, index) => (
                <React.Fragment key={appointment._id}>
                  <ListItem>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <Person />
                    </Avatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {appointment.patient?.firstName} {appointment.patient?.lastName}
                          </Typography>
                          <Chip 
                            icon={<AccessTime />}
                            label={`${getWaitingTime(appointment.arrivedAt)} min`}
                            color={getWaitingTimeColor(getWaitingTime(appointment.arrivedAt))}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            <strong>Reason:</strong> {appointment.reasonForVisit}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={2} mt={1}>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Phone fontSize="small" />
                              <Typography variant="caption">
                                {appointment.patient?.phone}
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Email fontSize="small" />
                              <Typography variant="caption">
                                {appointment.patient?.email}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="caption" color="textSecondary">
                            Arrived at: {moment(appointment.arrivedAt).format('h:mm A')}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box display="flex" gap={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleStartConsultation(appointment)}
                        >
                          Start
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<CheckCircle />}
                          onClick={() => handleCompleteConsultation(appointment)}
                        >
                          Complete
                        </Button>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < waitingPatients.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Complete Consultation Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Complete Consultation
          {selectedPatient && (
            <Typography variant="subtitle2" color="textSecondary">
              Patient: {selectedPatient.patient?.firstName} {selectedPatient.patient?.lastName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Diagnosis"
                value={consultationData.diagnosis}
                onChange={(e) => setConsultationData(prev => ({ ...prev, diagnosis: e.target.value }))}
                multiline
                rows={3}
                required
              />
            </Grid>

            {/* Prescription Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Prescription
              </Typography>
              
              {/* Add Prescription Form */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Medication"
                    value={prescriptionInput.medication}
                    onChange={(e) => setPrescriptionInput(prev => ({ ...prev, medication: e.target.value }))}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Dosage"
                    value={prescriptionInput.dosage}
                    onChange={(e) => setPrescriptionInput(prev => ({ ...prev, dosage: e.target.value }))}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Frequency"
                    value={prescriptionInput.frequency}
                    onChange={(e) => setPrescriptionInput(prev => ({ ...prev, frequency: e.target.value }))}
                    size="small"
                    placeholder="e.g., Twice daily"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Duration"
                    value={prescriptionInput.duration}
                    onChange={(e) => setPrescriptionInput(prev => ({ ...prev, duration: e.target.value }))}
                    size="small"
                    placeholder="e.g., 7 days"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={addPrescription}
                    disabled={!prescriptionInput.medication || !prescriptionInput.dosage}
                  >
                    Add Medication
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Instructions"
                    value={prescriptionInput.instructions}
                    onChange={(e) => setPrescriptionInput(prev => ({ ...prev, instructions: e.target.value }))}
                    size="small"
                    placeholder="e.g., Take with food"
                  />
                </Grid>
              </Grid>

              {/* Prescription List */}
              {consultationData.prescription.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Prescription:
                  </Typography>
                  {consultationData.prescription.map((med, index) => (
                    <Alert 
                      key={index} 
                      severity="info" 
                      onClose={() => removePrescription(index)}
                      sx={{ mb: 1 }}
                    >
                      <strong>{med.medication}</strong> - {med.dosage} - {med.frequency} for {med.duration}
                      {med.instructions && <br />}
                      {med.instructions && <em>Instructions: {med.instructions}</em>}
                    </Alert>
                  ))}
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Follow-up Date"
                type="date"
                value={consultationData.followUpDate}
                onChange={(e) => setConsultationData(prev => ({ ...prev, followUpDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Notes"
                value={consultationData.notes}
                onChange={(e) => setConsultationData(prev => ({ ...prev, notes: e.target.value }))}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            resetConsultationData();
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitConsultation}
            variant="contained"
            disabled={!consultationData.diagnosis}
          >
            Complete Consultation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PatientQueue;
