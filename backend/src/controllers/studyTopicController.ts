import { Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { StudyTopicService } from '../services/studyTopicService';
import { AuthenticatedRequest } from '../types/auth.types';
import {
  CreateTopicDTO,
  TopicStatus,
  UpdateTopicDTO,
  UpdateTopicStatusDTO
} from '../types/topic.types';

export class StudyTopicController {
  constructor(private readonly topicService: StudyTopicService) {}

  list = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const priorityParam = req.query.priority;
      let priority: boolean | undefined;

      if (priorityParam === 'true') {
        priority = true;
      } else if (priorityParam === 'false') {
        priority = false;
      }

      const result = await this.topicService.listTopics(userId, {
        subject: typeof req.query.subject === 'string' ? req.query.subject : undefined,
        status:
          typeof req.query.status === 'string'
            ? (req.query.status as TopicStatus)
            : undefined,
        priority,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        page: typeof req.query.page === 'string' ? Number(req.query.page) : 1,
        limit: typeof req.query.limit === 'string' ? Number(req.query.limit) : 10
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  create = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const created = await this.topicService.createTopic(
        userId,
        req.body as CreateTopicDTO
      );
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  };

  update = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const topicId = this.getParamId(req);
      const updated = await this.topicService.updateTopic(
        userId,
        topicId,
        req.body as UpdateTopicDTO
      );
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const topicId = this.getParamId(req);
      const updated = await this.topicService.updateTopicStatus(
        userId,
        topicId,
        req.body as UpdateTopicStatusDTO
      );
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  };

  remove = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const topicId = this.getParamId(req);
      await this.topicService.deleteTopic(userId, topicId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  private getAuthenticatedUserId(req: AuthenticatedRequest): string {
    if (!req.user?.userId) {
      throw new AppError('Usuario no autenticado', 401);
    }
    return req.user.userId;
  }

  private getParamId(req: AuthenticatedRequest): string {
    const rawId = req.params.id;
    const topicId = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!topicId || topicId.trim() === '') {
      throw new AppError('Identificador de tema inválido', 400);
    }
    return topicId.trim();
  }
}