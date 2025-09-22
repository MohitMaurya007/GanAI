import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MediaFile, PaginationInfo, ProcessingUpdate } from '../../types';
import apiService from '../../services/api';

interface MediaState {
  files: MediaFile[];
  selectedFiles: string[];
  currentFile: MediaFile | null;
  pagination: PaginationInfo | null;
  isLoading: boolean;
  isUploading: boolean;
  uploadProgress: Record<string, number>;
  error: string | null;
}

const initialState: MediaState = {
  files: [],
  selectedFiles: [],
  currentFile: null,
  pagination: null,
  isLoading: false,
  isUploading: false,
  uploadProgress: {},
  error: null,
};

// Async thunks
export const fetchMediaFiles = createAsyncThunk(
  'media/fetchFiles',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await apiService.getMediaFiles(params);
      if (response.success) {
        return response;
      }
      throw new Error(response.error || 'Failed to fetch media files');
    } catch (error: any) {
      return rejectWithValue(error.error || error.message);
    }
  }
);

export const uploadMediaFiles = createAsyncThunk(
  'media/uploadFiles',
  async (
    { files, onProgress }: { files: File[]; onProgress?: (fileId: string, progress: number) => void },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const fileId = `${file.name}-${Date.now()}`;
        
        const response = await apiService.uploadMedia(formData, (progress) => {
          dispatch(updateUploadProgress({ fileId, progress }));
          if (onProgress) {
            onProgress(fileId, progress);
          }
        });
        
        if (response.success) {
          dispatch(removeUploadProgress(fileId));
          return response.data;
        }
        throw new Error(response.error || 'Upload failed');
      });
      
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error: any) {
      return rejectWithValue(error.error || error.message);
    }
  }
);

export const deleteMediaFile = createAsyncThunk(
  'media/deleteFile',
  async (fileId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.deleteMediaFile(fileId);
      if (response.success) {
        return fileId;
      }
      throw new Error(response.error || 'Failed to delete file');
    } catch (error: any) {
      return rejectWithValue(error.error || error.message);
    }
  }
);

export const fetchMediaFile = createAsyncThunk(
  'media/fetchFile',
  async (fileId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.getMediaFile(fileId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error || 'Failed to fetch file');
    } catch (error: any) {
      return rejectWithValue(error.error || error.message);
    }
  }
);

// Slice
const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    selectFile: (state, action: PayloadAction<string>) => {
      if (!state.selectedFiles.includes(action.payload)) {
        state.selectedFiles.push(action.payload);
      }
    },
    deselectFile: (state, action: PayloadAction<string>) => {
      state.selectedFiles = state.selectedFiles.filter(id => id !== action.payload);
    },
    selectAllFiles: (state) => {
      state.selectedFiles = state.files.map(file => file.id);
    },
    deselectAllFiles: (state) => {
      state.selectedFiles = [];
    },
    setCurrentFile: (state, action: PayloadAction<MediaFile | null>) => {
      state.currentFile = action.payload;
    },
    updateUploadProgress: (state, action: PayloadAction<{ fileId: string; progress: number }>) => {
      state.uploadProgress[action.payload.fileId] = action.payload.progress;
    },
    removeUploadProgress: (state, action: PayloadAction<string>) => {
      delete state.uploadProgress[action.payload];
    },
    updateFileProcessingStatus: (state, action: PayloadAction<ProcessingUpdate>) => {
      const { mediaFileId, status, progress, error } = action.payload;
      const fileIndex = state.files.findIndex(file => file.id === mediaFileId);
      
      if (fileIndex !== -1) {
        const file = state.files[fileIndex];
        
        switch (status) {
          case 'processing':
            file.processingStatus = 'PROCESSING';
            break;
          case 'completed':
            file.processingStatus = 'COMPLETED';
            break;
          case 'failed':
            file.processingStatus = 'FAILED';
            file.processingError = error;
            break;
        }
      }
    },
    addMediaFiles: (state, action: PayloadAction<MediaFile[]>) => {
      // Add new files, avoiding duplicates
      action.payload.forEach(newFile => {
        if (!state.files.some(file => file.id === newFile.id)) {
          state.files.unshift(newFile);
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch media files
      .addCase(fetchMediaFiles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMediaFiles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.files = action.payload.data || [];
        state.pagination = action.payload.pagination || null;
        state.error = null;
      })
      .addCase(fetchMediaFiles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Upload media files
      .addCase(uploadMediaFiles.pending, (state) => {
        state.isUploading = true;
        state.error = null;
      })
      .addCase(uploadMediaFiles.fulfilled, (state, action) => {
        state.isUploading = false;
        // Add uploaded files to the beginning of the list
        if (Array.isArray(action.payload)) {
          action.payload.forEach(file => {
            if (!state.files.some(f => f.id === file.id)) {
              state.files.unshift(file);
            }
          });
        }
        state.error = null;
      })
      .addCase(uploadMediaFiles.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.payload as string;
      })
      // Delete media file
      .addCase(deleteMediaFile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteMediaFile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.files = state.files.filter(file => file.id !== action.payload);
        state.selectedFiles = state.selectedFiles.filter(id => id !== action.payload);
        if (state.currentFile?.id === action.payload) {
          state.currentFile = null;
        }
      })
      .addCase(deleteMediaFile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch single media file
      .addCase(fetchMediaFile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMediaFile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentFile = action.payload;
        
        // Update file in the list if it exists
        const fileIndex = state.files.findIndex(file => file.id === action.payload.id);
        if (fileIndex !== -1) {
          state.files[fileIndex] = action.payload;
        }
      })
      .addCase(fetchMediaFile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  selectFile,
  deselectFile,
  selectAllFiles,
  deselectAllFiles,
  setCurrentFile,
  updateUploadProgress,
  removeUploadProgress,
  updateFileProcessingStatus,
  addMediaFiles,
} = mediaSlice.actions;

export default mediaSlice.reducer;