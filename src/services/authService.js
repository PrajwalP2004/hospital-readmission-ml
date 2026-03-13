/**
 * authService.js
 * JWT-based authentication service for MedPredict.
 * Communicates with backend /auth/* endpoints.
 */

import apiClient from '../api/apiClient';

const TOKEN_KEY = 'medpredict_token';
const USER_CACHE_KEY = 'medpredict_user_cache';

export const authService = {
  /**
   * Register a new patient account.
   */
  register: async ({ name, age, password }) => {
    const response = await apiClient.post('/auth/register', { name, age, password });
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(response.user));
    return response.user;
  },

  /**
   * Login with identifier (name or MRN) and password.
   */
  login: async (identifier, password) => {
    const response = await apiClient.post('/auth/login', { identifier, password });
    localStorage.setItem(TOKEN_KEY, response.token);
    // Merge user + patient data for the UI
    const userData = { ...response.user, ...(response.patient || {}) };
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
    return userData;
  },

  /**
   * Logout — clear token and cached data.
   */
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_CACHE_KEY);
  },

  /**
   * Get the current user from cache (fast) or from backend (verified).
   */
  getCurrentUser: () => {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  },

  /**
   * Verify the token and refresh user data from the backend.
   */
  refreshUser: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    try {
      const response = await apiClient.get('/auth/me');
      const userData = { ...response.user, ...(response.patient || {}) };
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
      return userData;
    } catch {
      authService.logout();
      return null;
    }
  },

  /**
   * Update user record after a prediction.
   */
  updateUserRecord: async (mrn, updatedData) => {
    try {
      const result = await apiClient.put(`/patients/${mrn}`, updatedData);
      // Refresh the cached user
      const cached = authService.getCurrentUser();
      if (cached && cached.mrn === mrn) {
        const updated = { ...cached, ...result };
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updated));
      }
      return result;
    } catch (err) {
      console.error('Failed to update patient record:', err);
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  getToken: () => {
    return localStorage.getItem(TOKEN_KEY);
  }
};

export default authService;
