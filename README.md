# RepasoApp — Gestor de Temas de Estudio y Preparación de Exámenes

Aplicación web full-stack diseñada para que estudiantes organicen, clasifiquen y realicen seguimiento de sus temas de estudio por materia antes de un examen.

## Enlaces Públicos (Producción)
- **Aplicación Web (Frontend - Netlify):** *(Pendiente de despliegue en Fase 5)*
- **API REST (Backend - Render):** *(Pendiente de despliegue en Fase 5)*

## Stack Tecnológico
- **Frontend:** React, Vite, TypeScript estricto.
- **Backend:** Node.js, Express, TypeScript, Prisma ORM.
- **Base de Datos:** PostgreSQL (Neon).
- **Testing y Calidad:** Vitest, Supertest y subagente revisor de seguridad/resiliencia.

## Documentación del Proyecto
- [`SPEC.md`](./SPEC.md): Especificación funcional, entidades, endpoints y reglas de negocio numeradas (`RN-01` a `RN-06`).
- [`AGENTS.md`](./AGENTS.md): Convenciones de arquitectura y reglas para el desarrollo asistido por IA.
- [`PLAN.md`](./PLAN.md): Plan de tareas incrementales y estado de avance.
- [`INFORME_PRUEBAS.md`](./INFORME_PRUEBAS.md): Evidencia de ejecución de tests y auditoría de código.

## Ejecución Local

### 1. Backend
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

### 2. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```