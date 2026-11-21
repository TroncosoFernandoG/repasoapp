# AGENTS.md – Reglas del Proyecto RepasoApp

## 1. Contexto y Fuente de Verdad
- `SPEC.md` es la única fuente de verdad funcional y de reglas de negocio (`RN-01` a `RN-06`). Ningún agente debe inventar reglas, campos ni endpoints fuera de lo especificado allí.
- Antes de implementar código, analizar `PLAN.md` y trabajar una única tarea por vez.

## 2. Arquitectura y Separación de Capas
- **Backend (`backend/src/`):** Arquitectura estricta en 3 capas (`Controller -> Service -> Repository`) más middlewares (`authMiddleware`, `errorHandler`).
  - Los controladores solo manejan HTTP (`req`, `res`, códigos de estado) y delegan en los servicios.
  - Todas las reglas de negocio (`RN-01` a `RN-06`) viven exclusivamente en la capa `Service`.
  - Los repositorios encapsulan el acceso a PostgreSQL mediante Prisma.
- **Frontend (`frontend/src/`):** Componentes pequeños con una sola responsabilidad (máximo 200 líneas por archivo), separados de la capa de comunicación HTTP (`services/`).

## 3. Reglas Técnicas Obligatorias
- **TypeScript estricto:** Prohibido el uso de `any` bajo cualquier circunstancia en frontend y backend.
- **Seguridad:** Nunca confiar en IDs de usuario enviados por body o headers sin firmar; extraer `userId` siempre del JWT verificado. Nunca incluir secretos ni archivos `.env` en el repositorio.
- **Manejo de errores:** Todas las llamadas a API en el frontend deben verificar `response.ok` y manejar explícitamente los estados `loading`, `success`, `empty` y `error`.

## 4. Flujo de Desarrollo y Testing
- Aplicar el ciclo **Rojo -> Verde -> Refactor**: cada regla de negocio (`RN-01` a `RN-06`) debe estar cubierta por tests automatizados.
- Realizar un commit atómico en Git por cada tarea completada de `PLAN.md`.