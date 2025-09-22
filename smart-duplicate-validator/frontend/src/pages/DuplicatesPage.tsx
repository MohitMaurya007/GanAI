import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
} from '@mui/material';
import { FindInPage, CheckCircle, Cancel } from '@mui/icons-material';

const DuplicatesPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Duplicate Matches
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Review and manage detected duplicate media files. Confirm or reject matches to keep your library organized.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <FindInPage sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Duplicates Found Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Upload some media files to start detecting duplicates automatically.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Chip
                  icon={<CheckCircle />}
                  label="Face Recognition"
                  color="success"
                  variant="outlined"
                />
                <Chip
                  icon={<CheckCircle />}
                  label="Scene Analysis"
                  color="success"
                  variant="outlined"
                />
                <Chip
                  icon={<CheckCircle />}
                  label="Object Detection"
                  color="success"
                  variant="outlined"
                />
                <Chip
                  icon={<CheckCircle />}
                  label="Audio Fingerprinting"
                  color="success"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DuplicatesPage;