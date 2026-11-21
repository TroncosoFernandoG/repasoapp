export type TopicStatus = 'Pendiente' | 'Repasando' | 'Dominado';

export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface StudyTopic {
  id: string;
  title: string;
  notes: string;
  subject: string;
  examDate: string | null;
  status: TopicStatus;
  isPriority: boolean;
  isUrgent: boolean;
  userId: string;
  createdAt: string;
}

export interface TopicsSummary {
  total: number;
  pendientes: number;
  repasando: number;
  dominados: number;
  urgentes: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedTopicsResponse {
  data: StudyTopic[];
  pagination: PaginationMeta;
  summary: TopicsSummary;
}

export interface TopicQueryFilters {
  subject?: string;
  status?: TopicStatus | '';
  priority?: 'all' | 'true' | 'false';
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateTopicPayload {
  title: string;
  notes?: string;
  subject: string;
  examDate?: string | null;
  isPriority?: boolean;
}

export interface UpdateTopicPayload {
  title: string;
  notes?: string;
  subject: string;
  examDate?: string | null;
}

export interface UpdateTopicStatusPayload {
  status?: TopicStatus;
  isPriority?: boolean;
}