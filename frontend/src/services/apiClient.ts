import { ApiResponse } from '../types';

/**
 * Resolves the backend API base URL from environment variables or stored settings.
 * Supports both VITE_API_URL and VITE_API_BASE_URL.
 * Automatically normalizes the path so /api/v1 is properly included without double slashes.
 */
export function resolveApiBaseUrl(): string {
  let raw = (
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    (typeof window !== 'undefined' ? localStorage.getItem('hlm_api_base_url') : null) ||
    ''
  ).trim();

  // If deployed remotely (e.g. Vercel) and no env var was injected during build,
  // fall back to the live backend tunnel rather than self-referential /api/v1
  if (!raw && typeof window !== 'undefined' && window.location.hostname && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    raw = 'https://icy-foxes-join.loca.lt';
  }

  // If empty or relative, default to '/api/v1'
  if (!raw) {
    return '/api/v1';
  }

  // Remove trailing slashes
  raw = raw.replace(/\/+$/, '');

  // If the user specified a domain without the /api/v1 prefix, append it
  // (e.g., https://icy-foxes-join.loca.lt -> https://icy-foxes-join.loca.lt/api/v1)
  if (!raw.endsWith('/api/v1')) {
    raw = `${raw}/api/v1`;
  }

  return raw;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('hlm_auth_token');
    }
  }

  public getBaseUrl(): string {
    return resolveApiBaseUrl();
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('hlm_auth_token', token);
      } else {
        localStorage.removeItem('hlm_auth_token');
      }
    }
  }

  public getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('hlm_auth_token');
    }
    return this.token || 'demo-dev-token';
  }

  /**
   * Centralized, robust API request handler.
   * - Never blindly calls response.json()
   * - Gracefully handles HTTP 204 / empty responses
   * - Bypasses tunnel reminders (localtunnel)
   * - Logs requests in development mode only
   */
  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const baseUrl = this.getBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${cleanEndpoint}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Bypass-Tunnel-Reminder': 'true', // Essential for localtunnel (loca.lt)
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const isDev = Boolean(import.meta.env.DEV);

    if (isDev) {
      console.log(`[API Request] ${options.method || 'GET'} ${url}`, {
        endpoint: cleanEndpoint,
        fullUrl: url,
        method: options.method || 'GET',
        headers,
        payload: options.body instanceof FormData ? '[FormData]' : options.body,
      });
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (networkError: unknown) {
      if (typeof window !== 'undefined' && !window.navigator.onLine) {
        const offlineError = new Error("You're offline. Previously loaded information remains available.");
        (offlineError as unknown as { code?: string }).code = 'OFFLINE';
        throw offlineError;
      }
      throw new Error('Unable to connect to the calibration service. Please try again.');
    }

    // Safely retrieve the response body as text to avoid "Unexpected end of JSON input"
    const responseText = await response.text();

    if (isDev) {
      console.log(`[API Response] ${response.status} ${url}`, {
        status: response.status,
        ok: response.ok,
        bodySnippet: responseText.slice(0, 500),
      });
    }

    // Handle HTTP Error Codes (4xx, 5xx)
    if (!response.ok) {
      if (response.status === 401) {
        this.setToken(null);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:session_expired'));
        }
      }

      let errorMessage = `API request failed: ${response.status}`;
      let errorCode = 'API_ERROR';

      if (responseText && responseText.trim()) {
        try {
          const errorData = JSON.parse(responseText);
          if (errorData?.detail) {
            errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          }
          if (errorData?.error_code) {
            errorCode = errorData.error_code;
          }
        } catch {
          // If response is HTML from a proxy or tunnel error
          if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
            errorMessage = `Service unavailable or endpoint not found (${response.status}). Please verify the backend service is running.`;
          } else {
            errorMessage = responseText.slice(0, 200);
          }
        }
      } else {
        errorMessage = 'Unable to connect to the calibration service. Please try again.';
      }

      const error = new Error(errorMessage);
      (error as unknown as { code?: string }).code = errorCode;
      throw error;
    }

    // Handle HTTP 204 or empty response body safely
    if (!responseText || !responseText.trim()) {
      return {
        success: true,
        data: {} as T,
        message: 'Request completed successfully',
      };
    }

    // Parse JSON response safely
    try {
      const parsed = JSON.parse(responseText);

      // If already in standard ApiResponse structure { success: true, data: ... }
      if (parsed && typeof parsed === 'object' && 'success' in parsed) {
        return parsed as ApiResponse<T>;
      }

      // If backend returned a raw object or array directly
      return {
        success: true,
        data: parsed as T,
        message: 'Success',
      };
    } catch {
      throw new Error('Backend returned an invalid JSON response.');
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
      body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public async put<T>(endpoint: string, body?: unknown, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public async delete<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
