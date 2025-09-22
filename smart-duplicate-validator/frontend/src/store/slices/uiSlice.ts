import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeState } from '../../types';

interface UIState {
  theme: ThemeState;
  sidebarOpen: boolean;
  loading: boolean;
  currentPage: string;
  breadcrumbs: { label: string; path: string }[];
}

const initialState: UIState = {
  theme: {
    mode: 'light',
  },
  sidebarOpen: true,
  loading: false,
  currentPage: '',
  breadcrumbs: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme.mode = state.theme.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme.mode);
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme.mode = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
      localStorage.setItem('sidebarOpen', state.sidebarOpen.toString());
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
      localStorage.setItem('sidebarOpen', action.payload.toString());
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPage = action.payload;
    },
    setBreadcrumbs: (state, action: PayloadAction<{ label: string; path: string }[]>) => {
      state.breadcrumbs = action.payload;
    },
    addBreadcrumb: (state, action: PayloadAction<{ label: string; path: string }>) => {
      state.breadcrumbs.push(action.payload);
    },
    clearBreadcrumbs: (state) => {
      state.breadcrumbs = [];
    },
    initializeUI: (state) => {
      // Initialize theme from localStorage
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
      if (savedTheme) {
        state.theme.mode = savedTheme;
      }
      
      // Initialize sidebar state from localStorage
      const savedSidebarState = localStorage.getItem('sidebarOpen');
      if (savedSidebarState !== null) {
        state.sidebarOpen = savedSidebarState === 'true';
      }
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarOpen,
  setLoading,
  setCurrentPage,
  setBreadcrumbs,
  addBreadcrumb,
  clearBreadcrumbs,
  initializeUI,
} = uiSlice.actions;

export default uiSlice.reducer;