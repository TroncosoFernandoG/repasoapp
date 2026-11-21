import { StudyTopic } from '@prisma/client';
import { AppError } from '../errors/AppError';
import { StudyTopicRepository } from '../repositories/studyTopicRepository';
import {
  CreateTopicDTO,
  PaginatedTopicsResponse,
  StudyTopicResponse,
  TopicFilters,
  TopicStatus,
  TopicsSummary,
  UpdateTopicDTO,
  UpdateTopicStatusDTO
} from '../types/topic.types';

const VALID_STATUSES: TopicStatus[] = ['Pendiente', 'Repasando', 'Dominado'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_PRIORITY_PER_SUBJECT = 3;

export class StudyTopicService {
  constructor(private readonly topicRepository: StudyTopicRepository) {}

  async listTopics(userId: string, filters: TopicFilters): Promise<PaginatedTopicsResponse> {
    // RN-01 y RN-06: listado aislado por userId con paginación y filtros saneados
    const page = Number.isInteger(filters.page) && filters.page >= 1 ? filters.page : 1;
    const limit =
      Number.isInteger(filters.limit) && filters.limit >= 1 && filters.limit <= 50
        ? filters.limit
        : 10;

    if (filters.status && !VALID_STATUSES.includes(filters.status)) {
      throw new AppError('Estado de filtro inválido', 400);
    }

    const { items, total, allUserTopics } = await this.topicRepository.findAllByUser(userId, {
      ...filters,
      subject: filters.subject?.trim() || undefined,
      search: filters.search?.trim() || undefined,
      page,
      limit
    });

    const formattedItems = items.map((topic) => this.toResponse(topic));
    const allFormatted = allUserTopics.map((topic) => this.toResponse(topic));

    const summary: TopicsSummary = {
      total: allFormatted.length,
      pendientes: allFormatted.filter((t) => t.status === 'Pendiente').length,
      repasando: allFormatted.filter((t) => t.status === 'Repasando').length,
      dominados: allFormatted.filter((t) => t.status === 'Dominado').length,
      urgentes: allFormatted.filter((t) => t.isUrgent).length
    };

    return {
      data: formattedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit))
      },
      summary
    };
  }

  async createTopic(userId: string, input: CreateTopicDTO): Promise<StudyTopicResponse> {
    // RN-02: validación y saneamiento de campos obligatorios
    const title = this.validateRequiredText(input.title, 'título', 3, 120);
    const subject = this.validateRequiredText(input.subject, 'materia', 2, 60);
    const notes = this.validateNotes(input.notes);

    // RN-04: validación de fecha de examen (no puede ser anterior a hoy al crear)
    const examDate = this.validateExamDate(input.examDate, true);

    // RN-03: estado inicial 'Pendiente'
    const isPriority = Boolean(input.isPriority);

    // RN-05: tope de 3 prioritarios simultáneos por materia
    if (isPriority) {
      await this.ensurePriorityLimit(userId, subject);
    }

    const created = await this.topicRepository.create({
      title,
      notes,
      subject,
      examDate,
      status: 'Pendiente',
      isPriority,
      userId
    });

    return this.toResponse(created);
  }

  async updateTopic(
    userId: string,
    topicId: string,
    input: UpdateTopicDTO
  ): Promise<StudyTopicResponse> {
    // RN-01: verificar existencia y propiedad del recurso
    const existing = await this.topicRepository.findByIdAndUser(topicId, userId);
    if (!existing) {
      throw new AppError('Tema de estudio no encontrado', 404);
    }

    // RN-02: validación de campos obligatorios
    const title = this.validateRequiredText(input.title, 'título', 3, 120);
    const subject = this.validateRequiredText(input.subject, 'materia', 2, 60);
    const notes = this.validateNotes(input.notes);

    // RN-04: formato válido YYYY-MM-DD si se informa
    const examDate = this.validateExamDate(input.examDate, false);

    // RN-05: si el tema es prioritario y cambia de materia, validar tope en la nueva materia
    if (existing.isPriority && existing.subject.toLowerCase() !== subject.toLowerCase()) {
      await this.ensurePriorityLimit(userId, subject, existing.id);
    }

    const updated = await this.topicRepository.update(existing.id, {
      title,
      notes,
      subject,
      examDate
    });

    return this.toResponse(updated);
  }

  async updateTopicStatus(
    userId: string,
    topicId: string,
    input: UpdateTopicStatusDTO
  ): Promise<StudyTopicResponse> {
    // RN-01: verificar existencia y propiedad
    const existing = await this.topicRepository.findByIdAndUser(topicId, userId);
    if (!existing) {
      throw new AppError('Tema de estudio no encontrado', 404);
    }

    if (input.status === undefined && input.isPriority === undefined) {
      throw new AppError('Debe indicar al menos un estado o prioridad para actualizar', 400);
    }

    let nextStatus = existing.status as TopicStatus;
    if (input.status !== undefined) {
      if (!VALID_STATUSES.includes(input.status)) {
        throw new AppError('Estado inválido. Valores permitidos: Pendiente, Repasando, Dominado', 400);
      }
      nextStatus = input.status;
    }

    let nextPriority =
      input.isPriority !== undefined ? Boolean(input.isPriority) : existing.isPriority;

    // RN-03: si el tema pasa a 'Dominado', limpiar automáticamente isPriority = false
    if (nextStatus === 'Dominado') {
      nextPriority = false;
    }

    // RN-05: si queda marcado como prioritario, controlar máximo 3 por materia
    if (nextPriority) {
      await this.ensurePriorityLimit(userId, existing.subject, existing.id);
    }

    const updated = await this.topicRepository.update(existing.id, {
      status: nextStatus,
      isPriority: nextPriority
    });

    return this.toResponse(updated);
  }

  async deleteTopic(userId: string, topicId: string): Promise<void> {
    // RN-01: verificar existencia y propiedad antes de eliminar
    const existing = await this.topicRepository.findByIdAndUser(topicId, userId);
    if (!existing) {
      throw new AppError('Tema de estudio no encontrado', 404);
    }

    await this.topicRepository.delete(existing.id);
  }

  private validateRequiredText(
    raw: unknown,
    fieldLabel: string,
    min: number,
    max: number
  ): string {
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (value.length < min || value.length > max) {
      throw new AppError(
        `El campo ${fieldLabel} es obligatorio y debe tener entre ${min} y ${max} caracteres`,
        400
      );
    }
    return value;
  }

  private validateNotes(raw: unknown): string {
    if (raw === undefined || raw === null) {
      return '';
    }
    if (typeof raw !== 'string') {
      throw new AppError('Las notas deben ser texto', 400);
    }
    const trimmed = raw.trim();
    if (trimmed.length > 1000) {
      throw new AppError('Las notas no pueden superar los 1000 caracteres', 400);
    }
    return trimmed;
  }

  private validateExamDate(raw: unknown, forbidPastDate: boolean): string | null {
    if (raw === undefined || raw === null || raw === '') {
      return null;
    }
    if (typeof raw !== 'string' || !DATE_REGEX.test(raw)) {
      throw new AppError('La fecha de examen debe respetar el formato YYYY-MM-DD', 400);
    }

    const parsed = new Date(`${raw}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== raw) {
      throw new AppError('La fecha de examen ingresada no es una fecha calendario válida', 400);
    }

    if (forbidPastDate) {
      const todayIso = this.getTodayIsoDate();
      if (raw < todayIso) {
        throw new AppError('La fecha de examen no puede ser anterior a la fecha actual', 400);
      }
    }

    return raw;
  }

  private async ensurePriorityLimit(
    userId: string,
    subject: string,
    excludeTopicId?: string
  ): Promise<void> {
    const currentPriorityCount = await this.topicRepository.countPriorityBySubject(
      userId,
      subject,
      excludeTopicId
    );
    if (currentPriorityCount >= MAX_PRIORITY_PER_SUBJECT) {
      throw new AppError(
        `No podés tener más de ${MAX_PRIORITY_PER_SUBJECT} temas prioritarios en la materia "${subject}"`,
        400
      );
    }
  }

  private toResponse(topic: StudyTopic): StudyTopicResponse {
    return {
      id: topic.id,
      title: topic.title,
      notes: topic.notes,
      subject: topic.subject,
      examDate: topic.examDate,
      status: topic.status as TopicStatus,
      isPriority: topic.isPriority,
      isUrgent: this.calculateIsUrgent(topic.examDate, topic.status),
      userId: topic.userId,
      createdAt: topic.createdAt
    };
  }

  private calculateIsUrgent(examDate: string | null, status: string): boolean {
    if (!examDate || status === 'Dominado') {
      return false;
    }
    const todayIso = this.getTodayIsoDate();
    const todayMs = Date.parse(`${todayIso}T00:00:00Z`);
    const examMs = Date.parse(`${examDate}T00:00:00Z`);
    const diffDays = Math.ceil((examMs - todayMs) / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  }

  private getTodayIsoDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}