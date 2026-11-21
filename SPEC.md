# SPEC – RepasoApp (Gestor de Temas de Estudio y Exámenes)

## 1. Descripción General
RepasoApp es una aplicación web full-stack que permite a los estudiantes registrar, clasificar, priorizar y hacer seguimiento del nivel de dominio de sus temas de estudio por materia antes de un examen.

## 2. Entidades del Dominio

### User (Estudiante)
- `id`: string (UUID, PK)
- `fullName`: string (3 a 80 caracteres)
- `email`: string (único, formato email válido)
- `passwordHash`: string (hash generado con bcrypt)
- `createdAt`: DateTime (ISO 8601)

### StudyTopic (Tema de Estudio)
- `id`: string (UUID, PK)
- `title`: string (3 a 120 caracteres, obligatorio)
- `notes`: string (opcional, máximo 1000 caracteres)
- `subject`: string (2 a 60 caracteres, obligatorio)
- `examDate`: string | null (formato `YYYY-MM-DD`, opcional)
- `status`: `'Pendiente' | 'Repasando' | 'Dominado'` (por defecto `'Pendiente'`)
- `isPriority`: boolean (por defecto `false`)
- `userId`: string (FK -> User.id)
- `createdAt`: DateTime (ISO 8601)

## 3. Reglas de Negocio Numeradas

- **RN-01 (Propiedad y Aislamiento):** Cada estudiante autenticado solo puede consultar, crear, editar, cambiar estado o eliminar sus propios temas de estudio (`userId` extraído exclusivamente del token JWT verificado en el servidor).
- **RN-02 (Integridad de Campos Obligatorios):** El título (`title`, entre 3 y 120 caracteres) y la materia (`subject`, entre 2 y 60 caracteres) son obligatorios y se sanean eliminando espacios en los extremos (`trim`). No se permiten cadenas vacías ni compuestas solo por espacios.
- **RN-03 (Ciclo de Vida y Limpieza Automática de Prioridad):** Todo tema nuevo se crea con estado inicial `'Pendiente'` y `isPriority = false` (salvo que se indique prioridad al crearlo). Si un tema cambia su estado a `'Dominado'`, el sistema debe establecer automáticamente `isPriority = false`.
- **RN-04 (Validación Temporal y Urgencia de Examen):** Si se informa `examDate`, debe respetar el formato válido `YYYY-MM-DD` y, al momento de crear un tema, no puede ser anterior a la fecha actual. Un tema con estado distinto de `'Dominado'` cuya fecha de examen esté a 3 días o menos se considera urgente (`isUrgent = true` calculado).
- **RN-05 (Tope de Prioritarios por Materia):** Un estudiante puede tener como máximo **3 temas marcados como prioritarios (`isPriority = true`)** simultáneamente dentro de una misma materia (`subject`). Si intenta marcar un cuarto tema como prioritario en esa materia, el backend debe rechazar la operación con error `400 Bad Request`.
- **RN-06 (Filtrado y Paginación en Servidor):** El listado de temas (`GET /api/topics`) debe soportar filtrado combinado en el servidor por `subject`, `status`, `priority` y búsqueda textual por `search` (sobre `title`), además de paginación (`page` y `limit`).

## 4. Contratos de API REST

### Autenticación (`/api/auth`)
- `POST /api/auth/register` -> Crea cuenta de estudiante y devuelve usuario + JWT (`201 Created` / `400` / `409`).
- `POST /api/auth/login` -> Autentica credenciales y devuelve JWT (`200 OK` / `401`).

### Temas de Estudio (`/api/topics` — Requieren header `Authorization: Bearer <token>`)
- `GET /api/topics` -> Lista los temas del usuario autenticado con filtros y paginación (`200 OK`).
- `POST /api/topics` -> Crea un nuevo tema aplicando RN-01 a RN-05 (`201 Created` / `400`).
- `PUT /api/topics/:id` -> Actualiza título, materia, notas y fecha de examen de un tema propio (`200 OK` / `400` / `404`).
- `PATCH /api/topics/:id/status` -> Actualiza estado de dominio y/o prioridad aplicando RN-03 y RN-05 (`200 OK` / `400` / `404`).
- `DELETE /api/topics/:id` -> Elimina un tema propio (`204 No Content` / `404`).

## 5. Pantallas del Frontend
1. **Login / Registro:** Formulario con pestañas para iniciar sesión o crear cuenta de estudiante, validación de campos y manejo de errores de red.
2. **Dashboard de Estudio:**
   - Barra superior con saludo, resumen de métricas (Total, Pendientes, Repasando, Dominados y Urgentes) y botón de cierre de sesión.
   - Formulario de alta/edición de temas de estudio.
   - Panel de filtros combinados (búsqueda por título, selector de materia, filtro por estado y toggle de "Solo prioritarios").
   - Listado de tarjetas de temas con cambio rápido de estado, botón de estrella para prioridad, indicador de urgencia por fecha de examen y botón de eliminar.