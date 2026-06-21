import React from 'react';
import { Chip, Box } from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const AutoRefreshIndicator = ({ lastRefresh, isAuto = true }) => (
  <Box display="flex" alignItems="center" ml={2}>
    <Chip
      icon={isAuto ? <AutorenewIcon /> : <CheckCircleIcon />}
      label={
        <Box display="flex" alignItems="center">
          {isAuto ? "Auto" : "Live"}
          {lastRefresh && (
            <>
              {` | Last: ${lastRefresh.toLocaleTimeString()}`}
            </>
          )}
        </Box>
      }
      color={isAuto ? "success" : "info"}
      size="small"
      sx={{ fontWeight: 500, fontSize: "0.9rem" }}
    />
  </Box>
);

export default AutoRefreshIndicator;
