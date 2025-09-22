import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { CloudUpload, PhotoLibrary } from '@mui/icons-material';

const MediaPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Media Files
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload and manage your media files. The system will automatically detect duplicates using AI.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Upload Media Files
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Drag and drop or click to upload images, videos, and audio files.
              </Typography>
              <Button variant="contained" startIcon={<CloudUpload />}>
                Choose Files
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <PhotoLibrary sx={{ fontSize: 64, color: 'secondary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Browse Library
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                View and manage your uploaded media files with advanced filtering.
              </Typography>
              <Button variant="outlined" startIcon={<PhotoLibrary />}>
                View Library
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MediaPage;