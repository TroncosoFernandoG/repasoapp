# Informe de Pruebas y Auditoría de Código — RepasoApp

## 1. Resumen de Auditoría (Subagente `revisor.md`)

Se realizó la revisión técnica completa sobre `backend/` verificando el cumplimiento de `SPEC.md` y `AGENTS.md`:

- **Arquitectura en 3 capas:** Confirmada. Las rutas delegan en `AuthController` y `StudyTopicController`, la lógica de dominio reside exclusivamente en `AuthService` y `StudyTopicService`, y el acceso a PostgreSQL pasa únicamente por `UserRepository` y `StudyTopicRepository`.
- **Seguridad y secretos:** `backend/.env` permanece excluido del control de versiones mediante `.gitignore`; solo se versiona `.env.example` con valores ficticios. Las contraseñas se almacenan con `bcrypt` y los endpoints privados exigen `Bearer <token>` válido.
- **Tipado estricto TypeScript:** `npm run build` (`tsc`) compila con `0` errores y sin uso de `any`.

## 2. Resultados de Tests Automatizados (`Vitest` + `Supertest`)

Suite ejecutada mediante `npm test` en `backend/tests/topics.test.ts` (6/6 pruebas aprobadas):

| Caso de Prueba | Regla Verificada | Resultado |
| :--- | :--- | :--- |
| Registro, login y rechazo de peticiones sin token (`401`) | `RN-01` | Aprobado |
| Aislamiento total de temas entre distintos usuarios (`404` cruzado) | `RN-01` | Aprobado |
| Validación de campos obligatorios y rechazo de fechas pasadas (`400`) | `RN-02`, `RN-04` | Aprobado |
| Estado inicial `Pendiente`, alerta `isUrgent` (`<= 3` días) y limpieza de prioridad al `Dominar` | `RN-03` | Aprobado |
| Límite máximo de 3 temas prioritarios simultáneos por materia (`400`) | `RN-05` | Aprobado |
| Filtrado por materia/búsqueda y paginación en servidor (`page`, `limit`) | `RN-06` | Aprobado |

## 3. Hallazgos y Correcciones Aplicadas

- **Alineación de versión de Prisma Client:** Se fijó `@prisma/client@5.22.0` coincidiendo con la CLI `prisma@5.22.0` para garantizar la generación determinística del cliente tipado.
- **Separación de `app.ts` y `server.ts`:** Se desacopló la instancia de Express (`src/app.ts`) del `listen` de red (`src/server.ts`) para permitir pruebas HTTP aisladas con Supertest sin colisión de puertos.

---

## Parte 2: Auditoría y Pruebas del Frontend (`frontend/`)

### 1. Compilación y Tipado Estricto
- **Verificación:** `tsc && vite build` con `strict: true`, `noImplicitAny: true`, `noUnusedLocals: true` y `noUnusedParameters: true`.
- **Resultado:** Build de producción exitoso (`39 modules transformed`) sin advertencias ni errores de tipos.

### 2. Suite Automatizada (`Vitest` + `React Testing Library`)
Ejecutada mediante `npm test` (`vitest run`) sobre `frontend/tests/frontend.test.tsx`:

| Suite / Caso de Prueba | Regla / Estado Verificado | Resultado |
| :--- | :--- | :---: |
| Validación de título corto y fecha de examen pasada | `RN-02` (validación en cliente antes de enviar) | PASS |
| Validación de datos válidos y credenciales de registro | `RN-01` / `RN-02` (longitudes y formato de email) | PASS |
| Renderizado de estado de carga en `Dashboard` | Estado de red `loading` | PASS |
| Renderizado de tablero sin temas cargados | Estado de red `empty` | PASS |
| Manejo de fallo de comunicación con la API | Estado de red `error` (`role="alert"`) | PASS |
| Visualización de métricas y etiqueta de urgencia ($\le 3$ días) | Estado de red `success` + `RN-05` | PASS |
| Bloqueo de envío con formulario vacío en `TopicFormModal` | Validación de campos obligatorios | PASS |

**Resumen de ejecución:** `1 passed` suite — **`7 passed` (7/7 tests en verde)**.

### 3. Verificación End-to-End en Producción
- **Entorno probado:** `https://repasoapp.netlify.app` conectado a `https://repasoapp.onrender.com` y PostgreSQL en Neon.
- **Flujos verificados:**
  1. Registro e inicio de sesión con persistencia de token JWT tras recargar la página (`F5`).
  2. Alta de temas de estudio con materia, notas y fecha de examen.
  3. Actualización de estado (`Pendiente` $\rightarrow$ `Dominado`) con desactivación automática de prioridad (`RN-03`) y actualización en tiempo real de las tarjetas de métricas superiores.
  4. Comunicación entre dominios (`Netlify` $\leftrightarrow$ `Render`) sin bloqueos de CORS.