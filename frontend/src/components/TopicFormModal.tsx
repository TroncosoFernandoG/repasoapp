import { FormEvent, useState } from 'react';
import { CreateTopicPayload, StudyTopic, UpdateTopicPayload } from '../types/api.types';

interface TopicFormModalProps {
  editingTopic: StudyTopic | null;
  onClose: () => void;
  onSaveCreate: (payload: CreateTopicPayload) => Promise<void>;
  onSaveEdit: (id: string, payload: UpdateTopicPayload) => Promise<void>;
}

const getTodayIso = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export function TopicFormModal({
  editingTopic,
  onClose,
  onSaveCreate,
  onSaveEdit
}: TopicFormModalProps) {
  const [title, setTitle] = useState(editingTopic?.title ?? '');
  const [subject, setSubject] = useState(editingTopic?.subject ?? '');
  const [notes, setNotes] = useState(editingTopic?.notes ?? '');
  const [examDate, setExamDate] = useState(editingTopic?.examDate ?? '');
  const [isPriority, setIsPriority] = useState(editingTopic?.isPriority ?? false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFormError(null);

    const trimmedTitle = title.trim();
    const trimmedSubject = subject.trim();
    const trimmedNotes = notes.trim();

    if (trimmedTitle.length < 3 || trimmedTitle.length > 120) {
      setFormError('El título debe tener entre 3 y 120 caracteres.');
      return;
    }

    if (trimmedSubject.length < 2 || trimmedSubject.length > 60) {
      setFormError('La materia debe tener entre 2 y 60 caracteres.');
      return;
    }

    if (trimmedNotes.length > 1000) {
      setFormError('Las notas no pueden superar los 1000 caracteres.');
      return;
    }

    if (!editingTopic && examDate && examDate < getTodayIso()) {
      setFormError('La fecha de examen no puede ser anterior a hoy.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingTopic) {
        await onSaveEdit(editingTopic.id, {
          title: trimmedTitle,
          subject: trimmedSubject,
          notes: trimmedNotes,
          examDate: examDate || null
        });
      } else {
        await onSaveCreate({
          title: trimmedTitle,
          subject: trimmedSubject,
          notes: trimmedNotes,
          examDate: examDate || null,
          isPriority
        });
      }
      onClose();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'No se pudo guardar el tema de estudio.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <h2>{editingTopic ? 'Editar Tema de Estudio' : 'Nuevo Tema de Estudio'}</h2>
          <button type="button" className="btn-secondary" onClick={onClose}>
            ✕
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="topic-title">Título del tema *</label>
            <input
              id="topic-title"
              type="text"
              placeholder="Ej. Normalización y Tercera Forma Normal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="topic-subject">Materia *</label>
            <input
              id="topic-subject"
              type="text"
              placeholder="Ej. Base de Datos"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="topic-exam-date">Fecha de examen (opcional)</label>
            <input
              id="topic-exam-date"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="topic-notes">Notas o subtemas (opcional)</label>
            <textarea
              id="topic-notes"
              placeholder="Fórmulas clave, capítulos del apunte, ejercicios pendientes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {!editingTopic && (
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={isPriority}
                onChange={(e) => setIsPriority(e.target.checked)}
              />
              Marcar como tema prioritario (máx. 3 por materia)
            </label>
          )}

          {formError && (
            <p className="auth-error" role="alert">
              {formError}
            </p>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Guardando...' : editingTopic ? 'Guardar cambios' : 'Crear tema'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}