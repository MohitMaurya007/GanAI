import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CloudUpload,
  PhotoLibrary,
  FindInPage,
  TrendingUp,
  Storage,
  Speed,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store';
import { showInfoNotification } from '../store/slices/notificationSlice';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: `${color}.main`, mr: 2 }}>
          {icon}
        </Avatar>
        <Box>
          <Typography variant="h4" component="div" fontWeight="bold">
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);

  useEffect(() => {
    // Welcome notification for new users
    if (user) {
      dispatch(showInfoNotification(
        'Welcome to Smart Duplicate Validator',
        'Start by uploading your media files to detect duplicates automatically.'
      ));
    }
  }, [user, dispatch]);

  // Mock data - in a real app, this would come from API calls
  const stats = {
    totalFiles: 1247,
    duplicatesFound: 89,
    storageUsed: '2.4 GB',
    processingQueue: 3,
  };

  const recentActivity = [
    {
      id: 1,
      type: 'upload',
      message: '15 new images uploaded',
      time: '2 minutes ago',
      status: 'success',
    },
    {
      id: 2,
      type: 'duplicate',
      message: '3 duplicate matches found',
      time: '5 minutes ago',
      status: 'warning',
    },
    {
      id: 3,
      type: 'processing',
      message: 'Video processing completed',
      time: '10 minutes ago',
      status: 'success',
    },
    {
      id: 4,
      type: 'error',
      message: 'Failed to process large video file',
      time: '15 minutes ago',
      status: 'error',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload':
        return <CloudUpload />;
      case 'duplicate':
        return <FindInPage />;
      case 'processing':
        return <Speed />;
      case 'error':
        return <ErrorIcon />;
      default:
        return <CheckCircle />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.firstName || user?.username}!
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Here's an overview of your media library and duplicate detection activity.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Files"
            value={stats.totalFiles.toLocaleString()}
            icon={<PhotoLibrary />}
            color="primary"
            subtitle="Across all media types"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Duplicates Found"
            value={stats.duplicatesFound}
            icon={<FindInPage />}
            color="warning"
            subtitle="Pending review"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Storage Used"
            value={stats.storageUsed}
            icon={<Storage />}
            color="secondary"
            subtitle="Out of 10 GB limit"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Processing Queue"
            value={stats.processingQueue}
            icon={<Speed />}
            color="success"
            subtitle="Files being analyzed"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  fullWidth
                  onClick={() => navigate('/media')}
                >
                  Upload Media Files
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FindInPage />}
                  fullWidth
                  onClick={() => navigate('/duplicates')}
                >
                  Review Duplicates
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<TrendingUp />}
                  fullWidth
                  disabled
                >
                  View Analytics
                  <Chip label="Coming Soon" size="small" sx={{ ml: 1 }} />
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Processing Status */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Processing Status
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Feature Extraction</Typography>
                  <Typography variant="body2">75%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={75} sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Duplicate Detection</Typography>
                  <Typography variant="body2">45%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={45} color="secondary" />
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                {stats.processingQueue} files in queue • Estimated completion: 15 minutes
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List dense>
                {recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: `${getStatusColor(activity.status)}.main`,
                            width: 32,
                            height: 32,
                          }}
                        >
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.message}
                        secondary={activity.time}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                    {index < recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;