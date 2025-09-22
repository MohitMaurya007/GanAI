import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DuplicateMatch, PaginationInfo, DuplicateStatus } from '../../types';
import apiService from '../../services/api';

interface DuplicateState {
  matches: DuplicateMatch[];
  selectedMatches: string[];
  currentMatch: DuplicateMatch | null;
  pagination: PaginationInfo | null;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  filters: {
    status?: DuplicateStatus;
    minSimilarity?: number;
    maxSimilarity?: number;
    mediaType?: string;
  };
}

const initialState: DuplicateState = {
  matches: [],
  selectedMatches: [],
  currentMatch: null,
  pagination: null,
  isLoading: false,
  isProcessing: false,
  error: null,
  filters: {},
};

// Async thunks
export const fetchDuplicateMatches = createAsyncThunk(
  'duplicates/fetchMatches',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await apiService.getDuplicates(params);
      if (response.success) {
        return response;
      }
      throw new Error(response.error || 'Failed to fetch duplicate matches');
    } catch (error: any) {
      return rejectWithValue(error.error || error.message);
    }
  }
);

export const reviewDuplicateMatch = createAsyncThunk(
  'duplicates/reviewMatch',
  async (
    { matchId, decision, notes, confidence }: {
      matchId: string;
      decision: DuplicateStatus;
      notes?: string;
      confidence?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.reviewDuplicate(matchId, {
        decision,
        notes,
        confidence,
      });
      if (response.success) {
        return { matchId, decision, notes, confidence };
      }
      throw new Error(response.error || 'Failed to review duplicate');
    } catch (error: any) {
      return rejectWithValue(error.error || error.message);
    }
  }
);

export const confirmDuplicateMatch = createAsyncThunk(
  'duplicates/confirmMatch',
  async (matchId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.confirmDuplicate(matchId);
      if (response.success) {
        return matchId;
      }
      throw new Error(response.error || 'Failed to confirm duplicate');
    } catch (error: any) {
      return rejectWithValue(error.error || error.message);
    }
  }
);

export const rejectDuplicateMatch = createAsyncThunk(
  'duplicates/rejectMatch',
  async (matchId: string, { rejectWithValue }) => {
    try {
      const response = await apiService.rejectDuplicate(matchId);
      if (response.success) {
        return matchId;
      }
      throw new Error(response.error || 'Failed to reject duplicate');
    } catch (error: any) {
      return rejectWithValue(error.error || error.message);
    }
  }
);

export const bulkReviewMatches = createAsyncThunk(
  'duplicates/bulkReview',
  async (
    { matchIds, decision }: { matchIds: string[]; decision: DuplicateStatus },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const promises = matchIds.map(matchId => 
        dispatch(reviewDuplicateMatch({ matchId, decision }))
      );
      
      await Promise.all(promises);
      return { matchIds, decision };
    } catch (error: any) {
      return rejectWithValue(error.error || error.message);
    }
  }
);

// Slice
const duplicateSlice = createSlice({
  name: 'duplicates',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    selectMatch: (state, action: PayloadAction<string>) => {
      if (!state.selectedMatches.includes(action.payload)) {
        state.selectedMatches.push(action.payload);
      }
    },
    deselectMatch: (state, action: PayloadAction<string>) => {
      state.selectedMatches = state.selectedMatches.filter(id => id !== action.payload);
    },
    selectAllMatches: (state) => {
      state.selectedMatches = state.matches.map(match => match.id);
    },
    deselectAllMatches: (state) => {
      state.selectedMatches = [];
    },
    setCurrentMatch: (state, action: PayloadAction<DuplicateMatch | null>) => {
      state.currentMatch = action.payload;
    },
    setFilters: (state, action: PayloadAction<typeof initialState.filters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    updateMatchStatus: (state, action: PayloadAction<{ matchId: string; status: DuplicateStatus }>) => {
      const { matchId, status } = action.payload;
      const matchIndex = state.matches.findIndex(match => match.id === matchId);
      
      if (matchIndex !== -1) {
        state.matches[matchIndex].status = status;
        state.matches[matchIndex].reviewedAt = new Date().toISOString();
      }
      
      if (state.currentMatch?.id === matchId) {
        state.currentMatch.status = status;
        state.currentMatch.reviewedAt = new Date().toISOString();
      }
    },
    addNewMatches: (state, action: PayloadAction<DuplicateMatch[]>) => {
      // Add new matches, avoiding duplicates
      action.payload.forEach(newMatch => {
        if (!state.matches.some(match => match.id === newMatch.id)) {
          state.matches.unshift(newMatch);
        }
      });
    },
    removeMatch: (state, action: PayloadAction<string>) => {
      const matchId = action.payload;
      state.matches = state.matches.filter(match => match.id !== matchId);
      state.selectedMatches = state.selectedMatches.filter(id => id !== matchId);
      
      if (state.currentMatch?.id === matchId) {
        state.currentMatch = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch duplicate matches
      .addCase(fetchDuplicateMatches.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDuplicateMatches.fulfilled, (state, action) => {
        state.isLoading = false;
        state.matches = action.payload.data || [];
        state.pagination = action.payload.pagination || null;
        state.error = null;
      })
      .addCase(fetchDuplicateMatches.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Review duplicate match
      .addCase(reviewDuplicateMatch.pending, (state) => {
        state.isProcessing = true;
      })
      .addCase(reviewDuplicateMatch.fulfilled, (state, action) => {
        state.isProcessing = false;
        const { matchId, decision } = action.payload;
        
        const matchIndex = state.matches.findIndex(match => match.id === matchId);
        if (matchIndex !== -1) {
          state.matches[matchIndex].status = decision;
          state.matches[matchIndex].reviewedAt = new Date().toISOString();
        }
        
        if (state.currentMatch?.id === matchId) {
          state.currentMatch.status = decision;
          state.currentMatch.reviewedAt = new Date().toISOString();
        }
      })
      .addCase(reviewDuplicateMatch.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload as string;
      })
      // Confirm duplicate match
      .addCase(confirmDuplicateMatch.pending, (state) => {
        state.isProcessing = true;
      })
      .addCase(confirmDuplicateMatch.fulfilled, (state, action) => {
        state.isProcessing = false;
        const matchId = action.payload;
        
        const matchIndex = state.matches.findIndex(match => match.id === matchId);
        if (matchIndex !== -1) {
          state.matches[matchIndex].status = DuplicateStatus.CONFIRMED;
          state.matches[matchIndex].reviewedAt = new Date().toISOString();
        }
        
        if (state.currentMatch?.id === matchId) {
          state.currentMatch.status = DuplicateStatus.CONFIRMED;
          state.currentMatch.reviewedAt = new Date().toISOString();
        }
      })
      .addCase(confirmDuplicateMatch.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload as string;
      })
      // Reject duplicate match
      .addCase(rejectDuplicateMatch.pending, (state) => {
        state.isProcessing = true;
      })
      .addCase(rejectDuplicateMatch.fulfilled, (state, action) => {
        state.isProcessing = false;
        const matchId = action.payload;
        
        const matchIndex = state.matches.findIndex(match => match.id === matchId);
        if (matchIndex !== -1) {
          state.matches[matchIndex].status = DuplicateStatus.REJECTED;
          state.matches[matchIndex].reviewedAt = new Date().toISOString();
        }
        
        if (state.currentMatch?.id === matchId) {
          state.currentMatch.status = DuplicateStatus.REJECTED;
          state.currentMatch.reviewedAt = new Date().toISOString();
        }
      })
      .addCase(rejectDuplicateMatch.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload as string;
      })
      // Bulk review
      .addCase(bulkReviewMatches.pending, (state) => {
        state.isProcessing = true;
      })
      .addCase(bulkReviewMatches.fulfilled, (state, action) => {
        state.isProcessing = false;
        const { matchIds, decision } = action.payload;
        
        matchIds.forEach(matchId => {
          const matchIndex = state.matches.findIndex(match => match.id === matchId);
          if (matchIndex !== -1) {
            state.matches[matchIndex].status = decision;
            state.matches[matchIndex].reviewedAt = new Date().toISOString();
          }
        });
        
        // Clear selection after bulk action
        state.selectedMatches = [];
      })
      .addCase(bulkReviewMatches.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  selectMatch,
  deselectMatch,
  selectAllMatches,
  deselectAllMatches,
  setCurrentMatch,
  setFilters,
  clearFilters,
  updateMatchStatus,
  addNewMatches,
  removeMatch,
} = duplicateSlice.actions;

export default duplicateSlice.reducer;