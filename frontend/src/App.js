import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/Login';
import AdminDashboard from './components/admin/AdminDashboard';
import ReceptionistDashboard from './components/receptionist/ReceptionistDashboard';
import DoctorDashboard from './components/doctor/DoctorDashboard';
import NotFound from './pages/NotFound';
import './styles/Dashboard.css';
import './styles/Login.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/receptionist/*" 
              element={
                <ProtectedRoute allowedRoles={['receptionist', 'admin']}>
                  <ReceptionistDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/doctor/*" 
              element={
                <ProtectedRoute allowedRoles={['doctor', 'admin']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
