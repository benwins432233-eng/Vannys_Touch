import { apiClient } from './client';
import type { AuthResponse, User } from '@/types';

export const authApi = {
  register: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/register', data);
    return res.data.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/login', data);
    return res.data.data;
  },

  // Envoie le refreshToken dans le body — la route est publique côté backend.
  // Fonctionne même si l'access token est expiré.
  logout: async (refreshToken?: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const res = await apiClient.post('/auth/refresh', { refreshToken });
    return res.data.data;
  },

  me: async (): Promise<User> => {
    const res = await apiClient.get('/auth/me');
    return res.data.data;
  },

  // Changement de mot de passe par l'utilisateur connecté : le compte visé est
  // déterminé par le jeton, le mot de passe actuel est exigé.
  changePassword: async (data: { currentPassword: string; password: string }): Promise<void> => {
    await apiClient.post('/auth/password/change', data);
  },

  requestEmailVerification: async (): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/verify-email/request');
    return res.data.data;
  },

  confirmEmail: async (token: string): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/verify-email/confirm', { token });
    return res.data.data;
  },

  // La réponse est volontairement identique que le compte existe ou non.
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/password/forgot', { email });
    return res.data.data;
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/password/reset', { token, password });
    return res.data.data;
  },
};
