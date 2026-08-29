import axios from 'axios';

// Base API URL falls back to local port 8000 (FastAPI default)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('scn_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralized error and 401 token refresh handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('scn_refresh_token');

      if (refreshToken) {
        try {
          // Attempt token refresh call
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          localStorage.setItem('scn_token', access_token);

          // Retry the original failed request
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh token is also invalid/expired -> logout user
          localStorage.removeItem('scn_token');
          localStorage.removeItem('scn_refresh_token');
          localStorage.removeItem('scn_current_user_email');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    // Handle standard connection/server errors
    const errorMessage = error.response?.data?.detail || 'An unexpected connection error occurred.';
    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;
