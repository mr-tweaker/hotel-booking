// API client utilities for frontend
import { ApiResponse, AuthResponse, Hotel } from '@/types';

const API_BASE =
  typeof window !== 'undefined'
    ? window.location.origin + '/api'
    : '/api';

export async function apiRequest<T = unknown>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Request failed',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('API request error:', error);
    return {
      success: false,
      error: 'Network error',
    };
  }
}

export async function apiFormRequest<T = unknown>(
  endpoint: string,
  formData: FormData,
  method: 'POST' | 'PUT' = 'POST'
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: method,
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary for FormData
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Request failed',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('API form request error:', error);
    return {
      success: false,
      error: 'Network error',
    };
  }
}

// Auth API functions
export const authApi = {
  signup: async (data: {
    phone: string;
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Unwrap the response - apiRequest wraps it in { success, data }
    if (response.success && response.data) {
      return response.data as AuthResponse;
    }
    
    // If there's an error, return it in AuthResponse format
    return {
      success: false,
      error: response.error || 'Signup failed',
    };
  },

  login: async (credentials: {
    user: string;
    pass: string;
  }): Promise<AuthResponse> => {
    const response = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Unwrap the response - apiRequest wraps it in { success, data }
    if (response.success && response.data) {
      return response.data as AuthResponse;
    }
    
    // If there's an error, return it in AuthResponse format
    return {
      success: false,
      error: response.error || 'Login failed',
    };
  },
};

// Analytics API function
export const analyticsApi = {
  trackEvent: async (
    type: string,
    payload?: Record<string, unknown>
  ): Promise<void> => {
    // Fail silently - analytics shouldn't block user actions
    try {
      await fetch(`${API_BASE}/analytics/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload, ts: new Date().toISOString() }),
      });
    } catch (error) {
      console.warn('Analytics tracking failed (non-critical):', error);
    }
  },
};

// Hotels API functions
export const hotelsApi = {
  search: async (params: {
    city?: string;
    locality?: string | string[];
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    stars?: number | number[];
    amenities?: string[];
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    rooms?: number;
    sortBy?: 'popularity' | 'price' | 'starRating';
    sortOrder?: 'asc' | 'desc';
    coupleFriendly?: boolean;
    localId?: boolean;
    payAtHotel?: boolean;
    newlyAdded?: boolean;
  }): Promise<ApiResponse<Hotel[]>> => {
    return apiRequest<Hotel[]>('/hotels/search', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  getCities: async (): Promise<ApiResponse<string[]>> => {
    return apiRequest<string[]>('/hotels/cities', {
      method: 'GET',
    });
  },

  getLocalities: async (city?: string): Promise<ApiResponse<string[]>> => {
    const url = city
      ? `/hotels/localities?city=${encodeURIComponent(city)}`
      : '/hotels/localities';
    return apiRequest<string[]>(url, {
      method: 'GET',
    });
  },

  getById: async (id: string): Promise<ApiResponse<Hotel>> => {
    return apiRequest<Hotel>(`/hotels/${encodeURIComponent(id)}`, {
      method: 'GET',
    });
  },
};

