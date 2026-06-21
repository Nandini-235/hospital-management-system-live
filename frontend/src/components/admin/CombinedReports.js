import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, Card, CardContent } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const CombinedReports = () => {
  const [monthlyAppointments, setMonthlyAppointments] = useState([]);
  const [totalPatients, setTotalPatients] = useState(null);
  const [userRoles, setUserRoles] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/reports/appointments/monthly').then(res => setMonthlyAppointments(res.data));
    axios.get('http://localhost:5000/api/reports/patients/total').then(res => setTotalPatients(res.data.totalPatients));
    axios.get('http://localhost:5000/api/reports/users/roles').then(res => setUserRoles(res.data));
  }, []);

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Reports & Analytics
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Monthly Appointments</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyAppointments}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#1976d2" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card sx={{ mb: 4, p: 2 }}>
        <Typography variant="h6">Total Patients</Typography>
        <Typography variant="h3" color="primary">{totalPatients !== null ? totalPatients : 'Loading...'}</Typography>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>User Role Distribution</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={userRoles} dataKey="count" nameKey="role" cx="50%" cy="50%" outerRadius={100}>
                {userRoles.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CombinedReports;
