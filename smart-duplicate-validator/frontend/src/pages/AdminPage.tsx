import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  People,
  Settings,
  BarChart,
  Storage,
  Security,
  Notifications,
} from '@mui/icons-material';

const AdminPage: React.FC = () => {
  const adminSections = [
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: <People />,
      action: 'Manage Users',
    },
    {
      title: 'System Settings',
      description: 'Configure detection thresholds and system parameters',
      icon: <Settings />,
      action: 'View Settings',
    },
    {
      title: 'Analytics & Reports',
      description: 'View system usage statistics and performance metrics',
      icon: <BarChart />,
      action: 'View Reports',
    },
    {
      title: 'Storage Management',
      description: 'Monitor storage usage and manage file retention policies',
      icon: <Storage />,
      action: 'Manage Storage',
    },
    {
      title: 'Security & Audit',
      description: 'Review security logs and audit trails',
      icon: <Security />,
      action: 'View Logs',
    },
    {
      title: 'Notifications',
      description: 'Configure system notifications and alerts',
      icon: <Notifications />,
      action: 'Configure',
    },
  ];

  const systemStats = [
    { label: 'Total Users', value: '1,247' },
    { label: 'Active Sessions', value: '89' },
    { label: 'Storage Used', value: '2.4 TB' },
    { label: 'Processing Queue', value: '23' },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Panel
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage system settings, users, and monitor overall performance.
      </Typography>

      {/* System Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {systemStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" gutterBottom>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Admin Sections */}
      <Grid container spacing={3}>
        {adminSections.map((section, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ mr: 2, color: 'primary.main' }}>
                    {section.icon}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {section.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {section.description}
                    </Typography>
                    <Button variant="outlined" size="small">
                      {section.action}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AdminPage;