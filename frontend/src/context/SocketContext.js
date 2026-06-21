import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { isAuthenticated, token, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      // Initialize socket connection
      socketRef.current = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token: token
        }
      });

      const socket = socketRef.current;

      socket.on('connect', () => {
        console.log('Connected to server');
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      // Listen for patient arrival notifications (for doctors)
      if (user?.role === 'doctor') {
        socket.on('patient-arrived', (data) => {
          toast.info(`Patient ${data.patientName} has arrived and is waiting`);
          // You can dispatch custom events here to update UI
          window.dispatchEvent(new CustomEvent('patient-arrived', { detail: data }));
        });
      }

      // Listen for appointment updates
      socket.on('appointment-updated', (data) => {
        window.dispatchEvent(new CustomEvent('appointment-updated', { detail: data }));
      });

      // Listen for queue updates (for doctors)
      if (user?.role === 'doctor') {
        socket.on('queue-update', (data) => {
          window.dispatchEvent(new CustomEvent('queue-update', { detail: data }));
        });
      }

      return () => {
        socket.disconnect();
      };
    }
  }, [isAuthenticated, token, user?.role]);

  const emitPatientArrived = (appointmentData) => {
    if (socketRef.current) {
      socketRef.current.emit('patient-arrived', appointmentData);
    }
  };

  const emitAppointmentUpdate = (appointmentData) => {
    if (socketRef.current) {
      socketRef.current.emit('appointment-updated', appointmentData);
    }
  };

  const emitQueueUpdate = (queueData) => {
    if (socketRef.current) {
      socketRef.current.emit('queue-update', queueData);
    }
  };

  const value = {
    socket: socketRef.current,
    emitPatientArrived,
    emitAppointmentUpdate,
    emitQueueUpdate
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
