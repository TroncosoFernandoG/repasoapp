export type TopicStatus = 'Pendiente' | 'Repasando' | 'Dominado';

export interface CreateTopicDTO {
  title: string;
  notes?: string;
  subject: string;
  examDate?: string | null;
  isPriority?: boolean;
}

export interface UpdateTopicDTO {
  title: string;
  notes?: string;
  subject: string;
  examDate?: string | null;
}

export interface UpdateTopicStatusDTO {
  status?: TopicStatus;
  isPriority?: boolean;
}

export interface TopicFilters {
  subject?: string;
  status?: TopicStatus;
  priority?: boolean;
  search?: string;
  page: number;
  limit: number;
}

export interface StudyTopicResponse {
  id: string;
  title: string;
  notes: string;
  subject: string;
  examDate: string | null;
  status: TopicStatus;
  isPriority: boolean;
  isUrgent: boolean;
  userId: string;
  createdAt: Date;
}

export interface TopicsSummary {
  total: number;
  pendientes: number;
  repasando: number;
  dominados: number;
  urgentes: number;
}

export interface PaginatedTopicsResponse {
  data: StudyTopicResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: TopicsSummary;
}