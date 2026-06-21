export const USER_ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  RECEPTIONIST: 'receptionist'
};

export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  ARRIVED: 'arrived',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show'
};

export const APPOINTMENT_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  EMERGENCY: 'emergency'
};

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

export const PRIORITY_COLORS = {
  low: '#4caf50',
  medium: '#ff9800',
  high: '#f44336',
  emergency: '#9c27b0'
};

export const STATUS_COLORS = {
  scheduled: '#2196f3',
  arrived: '#ff9800',
  'in-progress': '#9c27b0',
  completed: '#4caf50',
  cancelled: '#f44336',
  'no-show': '#9e9e9e'
};

export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30'
];
