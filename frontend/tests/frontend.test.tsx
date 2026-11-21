import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { validateAuthInput, validateTopicInput } from '../src/utils/topicValidators';
import { Dashboard } from '../src/components/Dashboard';
import { TopicFormModal } from '../src/components/TopicFormModal';
import { apiClient, ApiClientError } from '../src/services/apiClient';
import { PaginatedTopicsResponse } from '../src/types/api.types';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Validadores del cliente (RN-02 y RN-04)', () => {
  it('rechaza títulos cortos y fechas de examen anteriores a hoy al crear', () => {
    expect(
      validateTopicInput({ title: 'AB', subject: 'Matemática' }, { isEditing: false })
    ).toContain('título');

    expect(
      validateTopicInput(
        { title: 'Derivadas', subject: 'Matemática', examDate: '2026-11-10' },
        { isEditing: false, todayIso: '2026-11-21' }
      )
    ).toContain('anterior a hoy');
  });

  it('acepta datos válidos y valida credenciales de registro/login', () => {
    expect(
      validateTopicInput(
        { title: 'Normalización 3FN', subject: 'Base de Datos', examDate: '2026-11-25' },
        { isEditing: false, todayIso: '2026-11-21' }
      )
    ).toBeNull();

    expect(
      validateAuthInput({
        mode: 'register',
        fullName: 'Fe',
        email: 'fer@test.com',
        password: 'Password123'
      })
    ).toContain('nombre completo');
  });
});

describe('Dashboard — Estados de red (loading, empty, error, success)', () => {
  const mockUser = { id: 'u1', fullName: 'Fernando Troncoso', email: 'fer@test.com' };

  it('muestra estado loading mientras consulta la API', () => {
    vi.spyOn(apiClient, 'getTopics').mockReturnValue(new Promise(() => {}));

    render(<Dashboard user={mockUser} onLogout={vi.fn()} />);
    expect(screen.getByText(/Cargando tus temas de estudio/i)).toBeTruthy();
  });

  it('muestra estado empty cuando el usuario no tiene temas cargados', async () => {
    const emptyPayload: PaginatedTopicsResponse = {
      data: [],
      pagination: { page: 1, limit: 9, total: 0, totalPages: 1 },
      summary: { total: 0, pendientes: 0, repasando: 0, dominados: 0, urgentes: 0 }
    };
    vi.spyOn(apiClient, 'getTopics').mockResolvedValue(emptyPayload);

    render(<Dashboard user={mockUser} onLogout={vi.fn()} />);
    expect(await screen.findByText(/No hay temas para mostrar/i)).toBeTruthy();
  });

  it('muestra estado error cuando falla la petición a la API', async () => {
    vi.spyOn(apiClient, 'getTopics').mockRejectedValue(
      new ApiClientError('Error de conexión con la base de datos', 500)
    );

    render(<Dashboard user={mockUser} onLogout={vi.fn()} />);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Error de conexión con la base de datos');
  });

  it('muestra estado success con métricas y tarjeta urgente', async () => {
    const successPayload: PaginatedTopicsResponse = {
      data: [
        {
          id: 't1',
          title: 'Consultas SQL Avanzadas',
          notes: 'JOINs y subconsultas',
          subject: 'Base de Datos',
          examDate: '2026-11-23',
          status: 'Repasando',
          isPriority: true,
          isUrgent: true,
          userId: 'u1',
          createdAt: '2026-11-21T10:00:00.000Z'
        }
      ],
      pagination: { page: 1, limit: 9, total: 1, totalPages: 1 },
      summary: { total: 1, pendientes: 0, repasando: 1, dominados: 0, urgentes: 1 }
    };
    vi.spyOn(apiClient, 'getTopics').mockResolvedValue(successPayload);

    render(<Dashboard user={mockUser} onLogout={vi.fn()} />);
    expect(await screen.findByText('Consultas SQL Avanzadas')).toBeTruthy();
    expect(screen.getByText('Urgente (≤ 3 días)')).toBeTruthy();
  });

  it('muestra error de validación en TopicFormModal al enviar formulario vacío', () => {
    render(
      <TopicFormModal
        editingTopic={null}
        onClose={vi.fn()}
        onSaveCreate={vi.fn()}
        onSaveEdit={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Crear tema/i }));
    expect(screen.getByRole('alert').textContent).toContain('título');
  });
});