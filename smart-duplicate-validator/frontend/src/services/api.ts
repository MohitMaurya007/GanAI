import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, LoginCredentials, RegisterData, User, UserSettings } from '../types';

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic request method
  private async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.api(config);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw {
        success: false,
        error: error.message || 'Network error occurred',
      };
    }
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request({
      method: 'POST',
      url: '/api/auth/login',
      data: credentials,
    });
  }

  async register(data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request({
      method: 'POST',
      url: '/api/auth/register',
      data,
    });
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return this.request({
      method: 'GET',
      url: '/api/auth/profile',
    });
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    return this.request({
      method: 'PUT',
      url: '/api/auth/profile',
      data,
    });
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse> {
    return this.request({
      method: 'POST',
      url: '/api/auth/change-password',
      data,
    });
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return this.request({
      method: 'POST',
      url: '/api/auth/refresh-token',
    });
  }

  async logout(): Promise<ApiResponse> {
    return this.request({
      method: 'POST',
      url: '/api/auth/logout',
    });
  }

  // User settings endpoints
  async getUserSettings(): Promise<ApiResponse<UserSettings>> {
    return this.request({
      method: 'GET',
      url: '/api/users/settings',
    });
  }

  async updateUserSettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    return this.request({
      method: 'PUT',
      url: '/api/users/settings',
      data: settings,
    });
  }

  // Media endpoints
  async getMediaFiles(params?: any): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: '/api/media',
      params,
    });
  }

  async uploadMedia(formData: FormData, onProgress?: (progress: number) => void): Promise<ApiResponse<any>> {
    return this.request({
      method: 'POST',
      url: '/api/media/upload',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  }

  async getMediaFile(id: string): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: `/api/media/${id}`,
    });
  }

  async deleteMediaFile(id: string): Promise<ApiResponse> {
    return this.request({
      method: 'DELETE',
      url: `/api/media/${id}`,
    });
  }

  // Duplicate endpoints
  async getDuplicates(params?: any): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: '/api/duplicates',
      params,
    });
  }

  async reviewDuplicate(id: string, data: any): Promise<ApiResponse> {
    return this.request({
      method: 'POST',
      url: `/api/duplicates/${id}/review`,
      data,
    });
  }

  async confirmDuplicate(id: string): Promise<ApiResponse> {
    return this.request({
      method: 'POST',
      url: `/api/duplicates/${id}/confirm`,
    });
  }

  async rejectDuplicate(id: string): Promise<ApiResponse> {
    return this.request({
      method: 'POST',
      url: `/api/duplicates/${id}/reject`,
    });
  }

  // Admin endpoints
  async getUsers(params?: any): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: '/api/admin/users',
      params,
    });
  }

  async getSystemStats(): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: '/api/admin/stats',
    });
  }

  async getSystemSettings(): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: '/api/admin/settings',
    });
  }

  async updateSystemSettings(settings: any): Promise<ApiResponse> {
    return this.request({
      method: 'PUT',
      url: '/api/admin/settings',
      data: settings,
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request({
      method: 'GET',
      url: '/health',
    });
  }

  // Utility methods
  getFileUrl(filePath: string): string {
    return `${this.baseURL}/${filePath}`;
  }

  setAuthToken(token: string): void {
    localStorage.setItem('token', token);
  }

  removeAuthToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('token');
  }
}

export const apiService = new ApiService();
export default apiService;