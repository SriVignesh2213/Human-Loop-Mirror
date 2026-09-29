import { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('hlm_auth_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('hlm_auth_token', token);
    } else {
      localStorage.removeItem('hlm_auth_token');
    }
  }

  public getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('hlm_auth_token');
    }
    return this.token;
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const jsonResponse: ApiResponse<T> = await response.json();

      if (!response.ok || !jsonResponse.success) {
        if (response.status === 401) {
          // Token expired or invalid
          this.setToken(null);
          window.dispatchEvent(new CustomEvent('auth:session_expired'));
        }

        const errorMessage = jsonResponse.message || `Request failed with status ${response.status}`;
        const error = new Error(errorMessage);
        (error as unknown as { code?: string }).code = jsonResponse.error_code || 'API_ERROR';
        throw error;
      }

      return jsonResponse;
    } catch (err: unknown) {
      if (!window.navigator.onLine) {
        const offlineError = new Error("You're offline. Previously loaded information remains available.");
        (offlineError as unknown as { code?: string }).code = 'OFFLINE';
        throw offlineError;
      }
      throw err;
    }
  }

  public async get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public async post<T>(endpoint: string, body?: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const isFormData = body instanceof FormData;
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? (body as FormData) : JSON.stringify(body),
    });
  }

  public async put<T>(endpoint: string, body?: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  public async delete<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
