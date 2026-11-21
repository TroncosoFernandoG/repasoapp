import { Prisma, StudyTopic } from '@prisma/client';
import { prisma } from '../config/database';
import { TopicFilters } from '../types/topic.types';

export class StudyTopicRepository {
  async findAllByUser(
    userId: string,
    filters: TopicFilters
  ): Promise<{ items: StudyTopic[]; total: number; allUserTopics: StudyTopic[] }> {
    const where: Prisma.StudyTopicWhereInput = { userId };

    if (filters.subject) {
      where.subject = { equals: filters.subject, mode: 'insensitive' };
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (typeof filters.priority === 'boolean') {
      where.isPriority = filters.priority;
    }
    if (filters.search) {
      where.title = { contains: filters.search, mode: 'insensitive' };
    }

    const skip = (filters.page - 1) * filters.limit;

    const [items, total, allUserTopics] = await Promise.all([
      prisma.studyTopic.findMany({
        where,
        orderBy: [{ isPriority: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: filters.limit
      }),
      prisma.studyTopic.count({ where }),
      prisma.studyTopic.findMany({ where: { userId } })
    ]);

    return { items, total, allUserTopics };
  }

  async findByIdAndUser(id: string, userId: string): Promise<StudyTopic | null> {
    return prisma.studyTopic.findFirst({
      where: { id, userId }
    });
  }

  async countPriorityBySubject(
    userId: string,
    subject: string,
    excludeTopicId?: string
  ): Promise<number> {
    return prisma.studyTopic.count({
      where: {
        userId,
        subject: { equals: subject, mode: 'insensitive' },
        isPriority: true,
        ...(excludeTopicId ? { id: { not: excludeTopicId } } : {})
      }
    });
  }

  async create(data: {
    title: string;
    notes: string;
    subject: string;
    examDate: string | null;
    status: string;
    isPriority: boolean;
    userId: string;
  }): Promise<StudyTopic> {
    return prisma.studyTopic.create({ data });
  }

  async update(
    id: string,
    data: {
      title?: string;
      notes?: string;
      subject?: string;
      examDate?: string | null;
      status?: string;
      isPriority?: boolean;
    }
  ): Promise<StudyTopic> {
    return prisma.studyTopic.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.studyTopic.delete({ where: { id } });
  }
}