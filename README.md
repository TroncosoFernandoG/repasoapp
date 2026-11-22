# RepasoApp — Gestor de Temas de Estudio y Priorización de Exámenes

Aplicación web full-stack desarrollada bajo metodología **Spec-Driven Development (SDD)** para organizar materias, hacer seguimiento del progreso de estudio (`Pendiente`, `Repasando`, `Dominado`) y priorizar temas cercanos a fechas de examen.

---

## Enlaces Activos en Producción

- **Aplicación Web (Frontend en Netlify):** https://repasoapp.netlify.app
- **API REST (Backend en Render):** https://repasoapp.onrender.com
- **Health Check API:** https://repasoapp.onrender.com/health
- **Repositorio GitHub:** https://github.com/TroncosoFernandoG/repasoapp

---

## Stack Tecnológico

- **Frontend:** React 18, TypeScript (strict), Vite, CSS modularizado, Vitest + React Testing Library.
- **Backend:** Node.js, Express, TypeScript (strict), Prisma ORM, JWT (`jsonwebtoken`), `bcryptjs`, CORS.
- **Base de Datos:** PostgreSQL alojado en **Neon**.
- **Despliegue:** Netlify (cliente SPA) + Render (API REST) + Neon (PostgreSQL).

---

## Arquitectura del Proyecto

```text
repasoapp/
├── .claude/agents/revisor.md   # Subagente de auditoría de código y seguridad
├── SPEC.md                     # Especificación funcional, contratos API y reglas RN-01..RN-06
├── AGENTS.md                   # Reglas de arquitectura, tipado estricto y testing
├── PLAN.md                     # Hoja de ruta incremental (T1 a T19)
├── INFORME_PRUEBAS.md          # Reporte de auditoría y pruebas del backend
├── backend/                    # API REST Express + Prisma + PostgreSQL
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   └── types/
│   └── tests/
└── frontend/                   # Cliente SPA React + Vite + TypeScript
    ├── src/
    │   ├── components/
    │   ├── services/
    │   ├── styles/
    │   ├── types/
    │   └── utils/
    └── tests/

    ## Reglas de Negocio Implementadas (`SPEC.md`)

- **RN-01 (Aislamiento por usuario):** Cada estudiante accede y modifica únicamente sus propios temas mediante autenticación JWT.
- **RN-02 (Validación de dominio):** Títulos de 3 a 120 caracteres, materias de 2 a 60 caracteres, notas hasta 1000 caracteres y fechas de examen no anteriores al día de alta.
- **RN-03 (Ciclo de estados):** Transiciones válidas entre `Pendiente`, `Repasando` y `Dominado`; al pasar a `Dominado` se desmarca automáticamente `isPriority`.
- **RN-04 (Límite de prioridad):** Máximo de 3 temas marcados como prioritarios simultáneamente por cada materia.
- **RN-05 (Indicador de urgencia):** Cálculo dinámico `isUrgent` cuando el tema no está dominado y faltan 3 días o menos para el examen.
- **RN-06 (Ordenamiento y filtrado en servidor):** Búsqueda combinada por título, materia, estado y prioridad con paginación y resumen de métricas.

---

## Ejecución Local

### 1. Backend
```bash
cd backend
cp .env.example .env
# Configurar DATABASE_URL y JWT_SECRET en backend/.env
npm install
npx prisma generate
npx prisma db push
npm run dev

### 2. Frontend
```bash
cd frontend
cp .env.example .env
# Verificar VITE_API_URL="http://localhost:3000"
npm install
npm run dev

### 3. Ejecución de Tests Automatizados
```bash
# Tests unitarios y de integración del backend (Vitest + Supertest)
cd backend && npm test

# Tests de validadores y estados de red del frontend (Vitest + Testing Library)
cd frontend && npm test