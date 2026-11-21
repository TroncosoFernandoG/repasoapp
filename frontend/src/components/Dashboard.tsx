import { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiClientError } from '../services/apiClient';
import {
  CreateTopicPayload,
  PaginationMeta,
  PublicUser,
  StudyTopic,
  TopicStatus,
  TopicsSummary,
  UpdateTopicPayload
} from '../types/api.types';
import { TopicCard } from './TopicCard';
import { TopicFormModal } from './TopicFormModal';
import './Dashboard.css';

interface DashboardProps {
  user: PublicUser;
  onLogout: () => void;
}

const EMPTY_SUMMARY: TopicsSummary = {
  total: 0,
  pendientes: 0,
  repasando: 0,
  dominados: 0,
  urgentes: 0
};

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [summary, setSummary] = useState<TopicsSummary>(EMPTY_SUMMARY);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 1
  });

  // Filtros
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<TopicStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'true' | 'false'>('all');
  const [page, setPage] = useState(1);

  // Estados de red y UI
  const [isLoading, setIsLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [busyTopicId, setBusyTopicId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<StudyTopic | null>(null);

  const handleApiError = useCallback(
    (error: unknown, fallback: string): void => {
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          onLogout();
          return;
        }
        setErrorBanner(error.message);
        return;
      }
      setErrorBanner(fallback);
    },
    [onLogout]
  );

  const fetchTopics = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setErrorBanner(null);

    try {
      const response = await apiClient.getTopics({
        search,
        subject: subjectFilter,
        status: statusFilter,
        priority: priorityFilter,
        page,
        limit: 9
      });
      setTopics(response.data);
      setSummary(response.summary);
      setPagination(response.pagination);
    } catch (error) {
      handleApiError(error, 'No se pudieron cargar los temas de estudio.');
    } finally {
      setIsLoading(false);
    }
  }, [search, subjectFilter, statusFilter, priorityFilter, page, handleApiError]);

  useEffect(() => {
    void fetchTopics();
  }, [fetchTopics]);

  const handleCreateTopic = async (payload: CreateTopicPayload): Promise<void> => {
    await apiClient.createTopic(payload);
    setPage(1);
    await fetchTopics();
  };

  const handleEditTopic = async (id: string, payload: UpdateTopicPayload): Promise<void> => {
    await apiClient.updateTopic(id, payload);
    await fetchTopics();
  };

  const handleStatusChange = async (
    topic: StudyTopic,
    newStatus: TopicStatus
  ): Promise<void> => {
    setBusyTopicId(topic.id);
    setErrorBanner(null);
    try {
      await apiClient.updateTopicStatus(topic.id, { status: newStatus });
      await fetchTopics();
    } catch (error) {
      handleApiError(error, 'No se pudo actualizar el estado del tema.');
    } finally {
      setBusyTopicId(null);
    }
  };

  const handleTogglePriority = async (topic: StudyTopic): Promise<void> => {
    setBusyTopicId(topic.id);
    setErrorBanner(null);
    try {
      await apiClient.updateTopicStatus(topic.id, { isPriority: !topic.isPriority });
      await fetchTopics();
    } catch (error) {
      handleApiError(error, 'No se pudo cambiar la prioridad del tema.');
    } finally {
      setBusyTopicId(null);
    }
  };

  const handleDeleteTopic = async (topic: StudyTopic): Promise<void> => {
    const confirmed = window.confirm(`¿Eliminar el tema "${topic.title}"?`);
    if (!confirmed) return;

    setBusyTopicId(topic.id);
    setErrorBanner(null);
    try {
      await apiClient.deleteTopic(topic.id);
      await fetchTopics();
    } catch (error) {
      handleApiError(error, 'No se pudo eliminar el tema.');
    } finally {
      setBusyTopicId(null);
    }
  };

  const clearFilters = (): void => {
    setSearch('');
    setSubjectFilter('');
    setStatusFilter('');
    setPriorityFilter('all');
    setPage(1);
  };

  return (
    <div className="dashboard-container">
      <header className="topbar">
        <div className="topbar-title">
          <h1>RepasoApp</h1>
          <p>Estudiante: {user.fullName}</p>
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditingTopic(null);
              setIsModalOpen(true);
            }}
          >
            + Nuevo Tema
          </button>
          <button type="button" className="btn-secondary" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="metrics-grid" aria-label="Resumen de progreso">
        <div className="metric-card">
          <span className="metric-label">Total de temas</span>
          <div className="metric-value">{summary.total}</div>
        </div>
        <div className="metric-card">
          <span className="metric-label">Pendientes</span>
          <div className="metric-value">{summary.pendientes}</div>
        </div>
        <div className="metric-card">
          <span className="metric-label">Repasando</span>
          <div className="metric-value">{summary.repasando}</div>
        </div>
        <div className="metric-card">
          <span className="metric-label">Dominados</span>
          <div className="metric-value done">{summary.dominados}</div>
        </div>
        <div className="metric-card">
          <span className="metric-label">Urgentes (&le; 3 días)</span>
          <div className="metric-value urgent">{summary.urgentes}</div>
        </div>
      </section>

      <section className="filters-bar" aria-label="Filtros de búsqueda">
        <input
          type="search"
          placeholder="Buscar tema por título..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <input
          type="text"
          placeholder="Filtrar por materia..."
          value={subjectFilter}
          onChange={(e) => {
            setSubjectFilter(e.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label="Filtrar por estado"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as TopicStatus | '');
            setPage(1);
          }}
        >
          <option value="">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Repasando">Repasando</option>
          <option value="Dominado">Dominado</option>
        </select>
        <select
          aria-label="Filtrar por prioridad"
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value as 'all' | 'true' | 'false');
            setPage(1);
          }}
        >
          <option value="all">Todas las prioridades</option>
          <option value="true">Solo prioritarios</option>
          <option value="false">No prioritarios</option>
        </select>
        <button type="button" className="btn-secondary" onClick={clearFilters}>
          Limpiar
        </button>
      </section>

      {errorBanner && (
        <div className="feedback-banner" role="alert">
          <span>{errorBanner}</span>
          <button type="button" className="btn-secondary" onClick={() => setErrorBanner(null)}>
            Cerrar
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="state-box" aria-live="polite">
          <h3>Cargando tus temas de estudio...</h3>
          <p>Consultando tu progreso actualizado.</p>
        </div>
      ) : topics.length === 0 ? (
        <div className="state-box">
          <h3>No hay temas para mostrar</h3>
          <p>
            Creá tu primer tema de estudio con el botón &ldquo;+ Nuevo Tema&rdquo; o limpiá los
            filtros activos.
          </p>
        </div>
      ) : (
        <>
          <section className="topics-grid" aria-label="Listado de temas">
            {topics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                busyTopicId={busyTopicId}
                onStatusChange={handleStatusChange}
                onTogglePriority={handleTogglePriority}
                onEdit={(selected) => {
                  setEditingTopic(selected);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeleteTopic}
              />
            ))}
          </section>

          {pagination.totalPages > 1 && (
            <nav className="pagination-bar" aria-label="Paginación">
              <button
                type="button"
                className="btn-secondary"
                disabled={pagination.page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Anterior
              </button>
              <span>
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn-secondary"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              >
                Siguiente
              </button>
            </nav>
          )}
        </>
      )}

      {isModalOpen && (
        <TopicFormModal
          editingTopic={editingTopic}
          onClose={() => setIsModalOpen(false)}
          onSaveCreate={handleCreateTopic}
          onSaveEdit={handleEditTopic}
        />
      )}
    </div>
  );
}