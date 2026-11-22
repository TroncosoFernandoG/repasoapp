# PLAN.md – Hoja de Ruta de Implementación (RepasoApp)

## Fase 1: Documentación y Configuración Base (Spec-First)
- [x] **T1:** Inicializar repositorio público en GitHub, estructura de carpetas y `.gitignore` sin secretos.
- [x] **T2:** Redactar `SPEC.md` con entidades, contratos API y reglas de negocio numeradas (`RN-01` a `RN-06`).
- [x] **T3:** Definir `AGENTS.md` con reglas de arquitectura, tipado estricto y ciclo de testing.
- [x] **T4:** Configurar el subagente revisor en `.claude/agents/revisor.md` y redacción inicial de `README.md`.

## Fase 2: Backend y Base de Datos (Node.js + Express + Prisma + PostgreSQL)
- [x] **T5:** Inicializar proyecto Node + TypeScript en `backend/`, configurar `env.ts` y `.env.example`.
- [x] **T6:** Configurar Prisma ORM y esquema relacional (`User` y `StudyTopic`) conectado a PostgreSQL (Neon).
- [x] **T7:** Implementar registro y login (`/api/auth/register` y `/api/auth/login`) con `bcrypt` y middleware JWT (`RN-01`).
- [x] **T8:** Implementar `StudyTopicRepository` con filtrado en servidor y paginación (`RN-06`).
- [x] **T9:** Implementar `StudyTopicService` con todas las reglas de negocio (`RN-01` a `RN-05`).
- [x] **T10:** Implementar `StudyTopicController`, rutas `/api/topics` y `errorHandler` global.

## Fase 3: Tests Automatizados y Auditoría de Código
- [x] **T11:** Escribir suite de tests unitarios y de integración verificando `RN-01` a `RN-06` (Vitest + Supertest).
- [x] **T12:** Ejecutar subagente `revisor.md` sobre el backend, corregir hallazgos y redactar `INFORME_PRUEBAS.md`.

## Fase 4: Frontend Completo (React + Vite + TypeScript)
- [x] **T13:** Inicializar proyecto React + Vite + TypeScript en `frontend/` con tipos estrictos y cliente HTTP (`apiClient.ts`).
- [x] **T14:** Implementar pantallas de autenticación (`Login` y `Registro`) con persistencia segura de sesión.
- [x] **T15:** Implementar Dashboard principal: formulario de alta/edición, tarjetas de temas, filtros combinados y métricas.
- [x] **T16:** Conectar manejo de estados de red (`loading`, `empty`, `error`, `success`) y tests de validadores/componentes.

## Fase 5: Despliegue en Internet y Entrega Final
- [x] **T17:** Desplegar base de datos en Neon y backend en Render con variables de entorno y CORS configurado.
- [x] **T18:** Desplegar frontend en Netlify apuntando a la API de producción y verificar flujo end-to-end.
- [x] **T19:** Actualizar `README.md` con la URL pública activa y verificar checklist final de entrega.