import {
  AuthResponse,
  CreateTopicPayload,
  LoginPayload,
  PaginatedTopicsResponse,
  RegisterPayload,
  StudyTopic,
  TopicQueryFilters,
  UpdateTopicPayload,
  UpdateTopicStatusPayload,
  PublicUser
} from '../types/api.types';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';
const TOKEN_STORAGE_KEY = 'repasoapp_token';

export class ApiClientError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, ApiClientError.prototype);
  }
}

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
};

export const clearStoredToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

const USER_STORAGE_KEY = 'repasoapp_user';

export const getStoredUser = (): PublicUser | null => {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PublicUser;
  } catch {
    return null;
  }
};

export const saveSession = (auth: AuthResponse): void => {
  setStoredToken(auth.token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(auth.user));
};

export const clearSession = (): void => {
  clearStoredToken();
  localStorage.removeItem(USER_STORAGE_KEY);
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = true
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (requiresAuth) {
    const token = getStoredToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });
  } catch {
    throw new ApiClientError(
      'No se pudo conectar con el servidor. Verificá tu conexión o si la API está activa.',
      0
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = (await response.json().catch(() => null)) as { error?: string } | null;

  if (!response.ok) {
    const message = data?.error ?? `Error inesperado del servidor (${response.status})`;
    throw new ApiClientError(message, response.status);
  }

  return data as T;
}

export const apiClient = {
  register(payload: RegisterPayload): Promise<AuthResponse> {
    return request<AuthResponse>(
      '/api/auth/register',
      { method: 'POST', body: JSON.stringify(payload) },
      false
    );
  },

  login(payload: LoginPayload): Promise<AuthResponse> {
    return request<AuthResponse>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify(payload) },
      false
    );
  },

  getTopics(filters: TopicQueryFilters = {}): Promise<PaginatedTopicsResponse> {
    const params = new URLSearchParams();

    if (filters.subject && filters.subject.trim() !== '') {
      params.set('subject', filters.subject.trim());
    }
    if (filters.status) {
      params.set('status', filters.status);
    }
    if (filters.priority === 'true' || filters.priority === 'false') {
      params.set('priority', filters.priority);
    }
    if (filters.search && filters.search.trim() !== '') {
      params.set('search', filters.search.trim());
    }
    if (filters.page && filters.page > 0) {
      params.set('page', String(filters.page));
    }
    if (filters.limit && filters.limit > 0) {
      params.set('limit', String(filters.limit));
    }

    const queryString = params.toString();
    const path = queryString ? `/api/topics?${queryString}` : '/api/topics';
    return request<PaginatedTopicsResponse>(path, { method: 'GET' }, true);
  },

  createTopic(payload: CreateTopicPayload): Promise<StudyTopic> {
    return request<StudyTopic>(
      '/api/topics',
      { method: 'POST', body: JSON.stringify(payload) },
      true
    );
  },

  updateTopic(id: string, payload: UpdateTopicPayload): Promise<StudyTopic> {
    return request<StudyTopic>(
      `/api/topics/${encodeURIComponent(id)}`,
      { method: 'PUT', body: JSON.stringify(payload) },
      true
    );
  },

  updateTopicStatus(id: string, payload: UpdateTopicStatusPayload): Promise<StudyTopic> {
    return request<StudyTopic>(
      `/api/topics/${encodeURIComponent(id)}/status`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      true
    );
  },

  deleteTopic(id: string): Promise<void> {
    return request<void>(`/api/topics/${encodeURIComponent(id)}`, { method: 'DELETE' }, true);
  }
};