import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Edit, Settings, Security } from '@mui/icons-material';
import { useAppSelector } from '../store';

const ProfilePage: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Manage your account settings and preferences.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{ width: 80, height: 80, mx: 'auto', mb: 2, fontSize: 32 }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h6" gutterBottom>
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.username
                }
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user?.email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Role: {user?.role}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                fullWidth
                sx={{ mt: 2 }}
              >
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Username"
                    secondary={user?.username}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Email Address"
                    secondary={user?.email}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Member Since"
                    secondary={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Last Login"
                    secondary={user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'N/A'}
                  />
                </ListItem>
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<Settings />}
                >
                  Detection Settings
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Security />}
                >
                  Change Password
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfilePage;