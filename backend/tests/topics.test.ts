import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import crypto from 'node:crypto';

interface MockUser {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

interface MockStudyTopic {
  id: string;
  title: string;
  notes: string;
  subject: string;
  examDate: string | null;
  status: string;
  isPriority: boolean;
  userId: string;
  createdAt: Date;
}

const usersStore: MockUser[] = [];
const topicsStore: MockStudyTopic[] = [];

vi.mock('../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { email: string } }) => {
        return usersStore.find((u) => u.email === where.email) ?? null;
      }),
      create: vi.fn(
        async ({
          data
        }: {
          data: { fullName: string; email: string; passwordHash: string };
        }) => {
          const created: MockUser = {
            id: crypto.randomUUID(),
            fullName: data.fullName,
            email: data.email,
            passwordHash: data.passwordHash,
            createdAt: new Date()
          };
          usersStore.push(created);
          return created;
        }
      )
    },
    studyTopic: {
      findMany: vi.fn(
        async (args?: {
          where?: {
            userId?: string;
            subject?: { equals: string };
            status?: string;
            isPriority?: boolean;
            title?: { contains: string };
          };
          skip?: number;
          take?: number;
        }) => {
          const where = args?.where ?? {};
          let filtered = topicsStore.filter((t) => {
            if (where.userId && t.userId !== where.userId) return false;
            if (
              where.subject &&
              t.subject.toLowerCase() !== where.subject.equals.toLowerCase()
            ) {
              return false;
            }
            if (where.status && t.status !== where.status) return false;
            if (typeof where.isPriority === 'boolean' && t.isPriority !== where.isPriority) {
              return false;
            }
            if (
              where.title &&
              !t.title.toLowerCase().includes(where.title.contains.toLowerCase())
            ) {
              return false;
            }
            return true;
          });

          filtered = filtered.sort((a, b) => Number(b.isPriority) - Number(a.isPriority));

          const skip = args?.skip ?? 0;
          const take = args?.take ?? filtered.length;
          return filtered.slice(skip, skip + take);
        }
      ),
      count: vi.fn(
        async (args?: {
          where?: {
            userId?: string;
            subject?: { equals: string };
            status?: string;
            isPriority?: boolean;
            title?: { contains: string };
            id?: { not: string };
          };
        }) => {
          const where = args?.where ?? {};
          return topicsStore.filter((t) => {
            if (where.userId && t.userId !== where.userId) return false;
            if (
              where.subject &&
              t.subject.toLowerCase() !== where.subject.equals.toLowerCase()
            ) {
              return false;
            }
            if (where.status && t.status !== where.status) return false;
            if (typeof where.isPriority === 'boolean' && t.isPriority !== where.isPriority) {
              return false;
            }
            if (
              where.title &&
              !t.title.toLowerCase().includes(where.title.contains.toLowerCase())
            ) {
              return false;
            }
            if (where.id?.not && t.id === where.id.not) return false;
            return true;
          }).length;
        }
      ),
      findFirst: vi.fn(
        async ({ where }: { where: { id: string; userId: string } }) => {
          return (
            topicsStore.find((t) => t.id === where.id && t.userId === where.userId) ?? null
          );
        }
      ),
      create: vi.fn(
        async ({
          data
        }: {
          data: {
            title: string;
            notes: string;
            subject: string;
            examDate: string | null;
            status: string;
            isPriority: boolean;
            userId: string;
          };
        }) => {
          const created: MockStudyTopic = {
            id: crypto.randomUUID(),
            ...data,
            createdAt: new Date()
          };
          topicsStore.push(created);
          return created;
        }
      ),
      update: vi.fn(
        async ({
          where,
          data
        }: {
          where: { id: string };
          data: Partial<MockStudyTopic>;
        }) => {
          const index = topicsStore.findIndex((t) => t.id === where.id);
          topicsStore[index] = { ...topicsStore[index], ...data };
          return topicsStore[index];
        }
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const index = topicsStore.findIndex((t) => t.id === where.id);
        const [removed] = topicsStore.splice(index, 1);
        return removed;
      })
    }
  }
}));

import { app } from '../src/app';

const getFutureIsoDate = (daysAhead: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

describe('RepasoApp API - Autenticación y Reglas de Negocio (RN-01 a RN-06)', () => {
  beforeEach(() => {
    usersStore.length = 0;
    topicsStore.length = 0;
  });

  const registerUser = async (
    fullName: string,
    email: string,
    password = 'Password123'
  ): Promise<string> => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ fullName, email, password });
    expect(res.status).toBe(201);
    return (res.body as { token: string }).token;
  };

  it('debe registrar, autenticar y rechazar peticiones sin token (RN-01)', async () => {
    const unauthRes = await request(app).get('/api/topics');
    expect(unauthRes.status).toBe(401);

    await registerUser('Fernando Troncoso', 'fer@repasoapp.com', 'Clave123');

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fer@repasoapp.com', password: 'Clave123' });

    expect(loginRes.status).toBe(200);
    expect((loginRes.body as { token: string }).token).toBeTruthy();
  });

  it('RN-01: debe aislar los temas entre distintos usuarios', async () => {
    const tokenUserA = await registerUser('Usuario A', 'usera@test.com');
    const tokenUserB = await registerUser('Usuario B', 'userb@test.com');

    const createRes = await request(app)
      .post('/api/topics')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        title: 'Normalización 3FN',
        subject: 'Base de Datos',
        notes: 'Repasar dependencias funcionales'
      });

    expect(createRes.status).toBe(201);
    const topicId = (createRes.body as { id: string }).id;

    // Usuario B no debe verlo ni poder editarlo o eliminarlo
    const listB = await request(app)
      .get('/api/topics')
      .set('Authorization', `Bearer ${tokenUserB}`);
    expect((listB.body as { data: unknown[] }).data).toHaveLength(0);

    const deleteB = await request(app)
      .delete(`/api/topics/${topicId}`)
      .set('Authorization', `Bearer ${tokenUserB}`);
    expect(deleteB.status).toBe(404);
  });

  it('RN-02 y RN-04: debe validar campos obligatorios y rechazar fecha de examen pasada', async () => {
    const token = await registerUser('Estudiante Test', 'validacion@test.com');

    const shortTitleRes = await request(app)
      .post('/api/topics')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'AB', subject: 'Matemática' });
    expect(shortTitleRes.status).toBe(400);

    const pastDateRes = await request(app)
      .post('/api/topics')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Derivadas parciales',
        subject: 'Matemática',
        examDate: '2020-01-10'
      });
    expect(pastDateRes.status).toBe(400);
  });

  it('RN-03: debe iniciar en Pendiente, marcar urgente si vence <= 3 días y limpiar prioridad al Dominar', async () => {
    const token = await registerUser('Estudiante Estado', 'estado@test.com');

    const createRes = await request(app)
      .post('/api/topics')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Patrón MVC en Express',
        subject: 'Programación',
        examDate: getFutureIsoDate(2),
        isPriority: true
      });

    expect(createRes.status).toBe(201);
    const created = createRes.body as {
      id: string;
      status: string;
      isPriority: boolean;
      isUrgent: boolean;
    };
    expect(created.status).toBe('Pendiente');
    expect(created.isPriority).toBe(true);
    expect(created.isUrgent).toBe(true);

    const patchRes = await request(app)
      .patch(`/api/topics/${created.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Dominado' });

    expect(patchRes.status).toBe(200);
    const updated = patchRes.body as {
      status: string;
      isPriority: boolean;
      isUrgent: boolean;
    };
    expect(updated.status).toBe('Dominado');
    expect(updated.isPriority).toBe(false);
    expect(updated.isUrgent).toBe(false);
  });

  it('RN-05: debe impedir más de 3 temas prioritarios simultáneos en la misma materia', async () => {
    const token = await registerUser('Estudiante Prioridad', 'prioridad@test.com');

    for (let i = 1; i <= 3; i++) {
      const res = await request(app)
        .post('/api/topics')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: `Tema prioritario ${i}`,
          subject: 'Redes',
          isPriority: true
        });
      expect(res.status).toBe(201);
    }

    const fourthRes = await request(app)
      .post('/api/topics')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Tema prioritario 4',
        subject: 'Redes',
        isPriority: true
      });
    expect(fourthRes.status).toBe(400);

    // En otra materia sí debe permitir marcarlo como prioritario
    const otherSubjectRes = await request(app)
      .post('/api/topics')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Subredes VLSM',
        subject: 'Sistemas Operativos',
        isPriority: true
      });
    expect(otherSubjectRes.status).toBe(201);
  });

  it('RN-06: debe filtrar por materia/búsqueda y paginar resultados', async () => {
    const token = await registerUser('Estudiante Filtros', 'filtros@test.com');

    await request(app)
      .post('/api/topics')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Integrales definidas', subject: 'Análisis Matemático' });

    await request(app)
      .post('/api/topics')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Límites indeterminados', subject: 'Análisis Matemático' });

    await request(app)
      .post('/api/topics')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Consultas JOIN en SQL', subject: 'Base de Datos' });

    const filteredRes = await request(app)
      .get('/api/topics?subject=Análisis Matemático&page=1&limit=1')
      .set('Authorization', `Bearer ${token}`);

    expect(filteredRes.status).toBe(200);
    const body = filteredRes.body as {
      data: Array<{ title: string }>;
      pagination: { page: number; limit: number; total: number; totalPages: number };
      summary: { total: number };
    };
    expect(body.data).toHaveLength(1);
    expect(body.pagination.total).toBe(2);
    expect(body.pagination.totalPages).toBe(2);
    expect(body.summary.total).toBe(3);
  });
});