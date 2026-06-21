import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, Typography } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const DoctorAnalytics = () => {
  const [stats, setStats] = useState({
    today: 0,
    waitingNow: 0,
    statusBreakdown: {},
  });

  useEffect(() => {
    axios.get('http://localhost:5000/api/doctor/appointments/stats').then(res => {
      setStats(res.data.stats);
    });
  }, []);

  // prepare chart-friendly data from status breakdown
  const chartData = Object.entries(stats.statusBreakdown || {}).map(([status, value]) => ({
    status,
    value,
  }));

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>Today's Appointments: {stats.today}</Typography>
        <Typography variant="body1">Waiting Patients: {stats.waitingNow}</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <XAxis dataKey="status" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default DoctorAnalytics;
