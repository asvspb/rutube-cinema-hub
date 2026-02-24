import axios, { AxiosError } from 'axios';

// Types
export interface User {
  id: string;
  email: string;
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Session {
  id: string;
  name: string;
  userAgent?: string;
  ip?: string;
  isCurrent: boolean;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Include cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// In-memory token storage
let accessToken: string | null = null;

// Token management
export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// Request interceptor - add auth header
api.interceptors.request.use(config => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401 and auto-refresh
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  response => response,
  async (error: AxiosError<{ error?: ApiError }>) => {
    const originalRequest = error.config;

    // Check if 401 and not a refresh request
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !(originalRequest as Record<string, unknown>)._retry
    ) {
      if (isRefreshing) {
        // Wait for refresh to complete
        return new Promise(resolve => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      (originalRequest as Record<string, unknown>)._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post<AuthResponse>('/auth/refresh');
        setAccessToken(data.accessToken);
        onTokenRefreshed(data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear token and redirect to login
        setAccessToken(null);
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// API methods

/**
 * Register a new user
 */
export async function register(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', { email, password });
  setAccessToken(data.accessToken);
  return data;
}

/**
 * Login a user
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  setAccessToken(data.accessToken);
  return data;
}

/**
 * Logout current session
 */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    setAccessToken(null);
  }
}

/**
 * Logout all sessions
 */
export async function logoutAll(): Promise<{ revokedCount: number }> {
  const { data } = await api.post<{ revokedCount: number }>('/auth/logout-all');
  setAccessToken(null);
  return data;
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/refresh');
  setAccessToken(data.accessToken);
  return data;
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<{ user: User }> {
  const { data } = await api.get<{ user: User }>('/auth/me');
  return data;
}

/**
 * Get all active sessions
 */
export async function getSessions(): Promise<{ sessions: Session[]; total: number }> {
  const { data } = await api.get<{ sessions: Session[]; total: number }>('/auth/sessions');
  return data;
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string): Promise<void> {
  await api.delete(`/auth/sessions/${sessionId}`);
}

/**
 * Change password
 */
export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  const { data } = await api.patch<{ message: string }>('/auth/password', {
    oldPassword,
    newPassword,
  });
  return data;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

/**
 * Extract error message from API error
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    return error.response.data.error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

/**
 * Extract error code from API error
 */
export function getErrorCode(error: unknown): string | null {
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    return error.response.data.error.code;
  }
  return null;
}

export default api;
