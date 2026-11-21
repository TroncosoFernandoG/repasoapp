import { CreateTopicPayload, UpdateTopicPayload } from '../types/api.types';

export const getTodayIsoDate = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export function validateTopicInput(
  input: CreateTopicPayload | UpdateTopicPayload,
  options: { isEditing: boolean; todayIso?: string }
): string | null {
  const trimmedTitle = input.title.trim();
  const trimmedSubject = input.subject.trim();
  const trimmedNotes = (input.notes ?? '').trim();

  if (trimmedTitle.length < 3 || trimmedTitle.length > 120) {
    return 'El título debe tener entre 3 y 120 caracteres.';
  }

  if (trimmedSubject.length < 2 || trimmedSubject.length > 60) {
    return 'La materia debe tener entre 2 y 60 caracteres.';
  }

  if (trimmedNotes.length > 1000) {
    return 'Las notas no pueden superar los 1000 caracteres.';
  }

  const today = options.todayIso ?? getTodayIsoDate();
  if (!options.isEditing && input.examDate && input.examDate < today) {
    return 'La fecha de examen no puede ser anterior a hoy.';
  }

  return null;
}

export function validateAuthInput(input: {
  mode: 'login' | 'register';
  fullName?: string;
  email: string;
  password: string;
}): string | null {
  const trimmedName = (input.fullName ?? '').trim();
  const trimmedEmail = input.email.trim();

  if (input.mode === 'register' && (trimmedName.length < 3 || trimmedName.length > 80)) {
    return 'El nombre completo debe tener entre 3 y 80 caracteres.';
  }

  if (!trimmedEmail.includes('@') || trimmedEmail.length < 5) {
    return 'Ingresá un correo electrónico válido.';
  }

  if (input.password.length < 6) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }

  return null;
}