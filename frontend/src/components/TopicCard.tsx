import { StudyTopic, TopicStatus } from '../types/api.types';

interface TopicCardProps {
  topic: StudyTopic;
  busyTopicId: string | null;
  onStatusChange: (topic: StudyTopic, newStatus: TopicStatus) => Promise<void>;
  onTogglePriority: (topic: StudyTopic) => Promise<void>;
  onEdit: (topic: StudyTopic) => void;
  onDelete: (topic: StudyTopic) => Promise<void>;
}

const STATUS_OPTIONS: TopicStatus[] = ['Pendiente', 'Repasando', 'Dominado'];

export function TopicCard({
  topic,
  busyTopicId,
  onStatusChange,
  onTogglePriority,
  onEdit,
  onDelete
}: TopicCardProps) {
  const isBusy = busyTopicId === topic.id;

  return (
    <article className={`topic-card ${topic.isPriority ? 'is-priority' : ''}`}>
      <div>
        <div className="topic-card-top">
          <span className="subject-tag">{topic.subject}</span>
          <div className="badges-row">
            {topic.isUrgent && <span className="badge-urgent">Urgente (&le; 3 días)</span>}
            <button
              type="button"
              className={`priority-btn ${topic.isPriority ? 'active' : ''}`}
              disabled={isBusy || topic.status === 'Dominado'}
              title={
                topic.status === 'Dominado'
                  ? 'Un tema dominado no puede ser prioritario'
                  : 'Alternar prioridad'
              }
              onClick={() => void onTogglePriority(topic)}
            >
              {topic.isPriority ? '★ Prioritario' : '☆ Prioridad'}
            </button>
          </div>
        </div>

        <h3 className="topic-title">{topic.title}</h3>
        {topic.notes && <p className="topic-notes">{topic.notes}</p>}
      </div>

      <div>
        <p className="topic-meta" style={{ marginBottom: '0.65rem' }}>
          {topic.examDate ? `Examen: ${topic.examDate}` : 'Sin fecha de examen asignada'}
        </p>

        <div className="topic-controls">
          <select
            aria-label={`Estado de ${topic.title}`}
            value={topic.status}
            disabled={isBusy}
            onChange={(e) => void onStatusChange(topic, e.target.value as TopicStatus)}
          >
            {STATUS_OPTIONS.map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {statusOption}
              </option>
            ))}
          </select>

          <div className="topic-actions">
            <button
              type="button"
              className="btn-secondary"
              disabled={isBusy}
              onClick={() => onEdit(topic)}
            >
              Editar
            </button>
            <button
              type="button"
              className="btn-danger"
              disabled={isBusy}
              onClick={() => void onDelete(topic)}
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}