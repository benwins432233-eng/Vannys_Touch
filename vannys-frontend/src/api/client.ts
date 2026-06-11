// ============================================================
// src/api/client.ts
// Client HTTP de base — gestion des tokens, erreurs, refresh
// ============================================================

import type { ApiError } from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

// ---- Gestion du token Sanctum ----
const TOKEN_KEY = 'vanny_token';

export const tokenStorage = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  remove: (): void => localStorage.removeItem(TOKEN_KEY),
};

// ---- Classe d'erreur API personnalisée ----
export class ApiException extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

// ---- Construction des headers ----
function buildHeaders(isMultipart = false): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/json',
  };

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  const token = tokenStorage.get();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// ---- Traitement de la réponse ----
async function handleResponse<T>(response: Response): Promise<T> {
  // 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = data as ApiError | null;

    // 401 → token expiré, on déconnecte
    if (response.status === 401) {
      tokenStorage.remove();
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    throw new ApiException(
      error?.message ?? `Erreur ${response.status}`,
      response.status,
      error?.errors,
    );
  }

  return data as T;
}

// ---- Méthodes HTTP ----
async function get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
  let url = `${BASE_URL}${endpoint}`;

  if (params) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });
    const qs = query.toString();
    if (qs) url += `?${qs}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(),
  });

  return handleResponse<T>(response);
}

async function post<T>(endpoint: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return handleResponse<T>(response);
}

async function postMultipart<T>(endpoint: string, formData: FormData): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: buildHeaders(true),   // pas de Content-Type → boundary auto
    body: formData,
  });

  return handleResponse<T>(response);
}

async function put<T>(endpoint: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return handleResponse<T>(response);
}

async function patch<T>(endpoint: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return handleResponse<T>(response);
}

async function del<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });

  return handleResponse<T>(response);
}

// ---- Export du client ----
export const http = { get, post, postMultipart, put, patch, delete: del };
