# Frontend Specification — Mini Jira (v1)

## 1) Alcance y fuente de verdad

- **Producto objetivo:** solo la app Mini Jira ubicada en la raíz del workspace.
- **Documento funcional normativo:** `specs.md` + `backlog.md`.
- **`DESIGN.md`:** referencia visual no normativa cuando exista conflicto con reglas funcionales.
- **Idioma de UI v1:** español únicamente.
- **No incluye implementación de código en esta fase**; este documento define contrato técnico y funcional del frontend.

---

## 2) Stack y versiones (contrato)

### 2.1 Base de aplicación

- **Bundler / Dev server:** Vite `^5`.
- **Framework UI:** React `18.x`.
- **Lenguaje:** TypeScript `5.x` (modo no estricto).
- **Gestor de paquetes:** npm `10.x`.
- **Runtime objetivo local/CI para frontend:** Node.js `20 LTS`.

### 2.2 UI, estado y navegación

- **UI primitives:** shadcn/ui (sobre Radix UI).
- **Estilos:** Tailwind CSS `3.x`.
- **Routing:** React Router `6.x`.
- **Estado global cliente:** Zustand `4.x`.
- **Server state / caché / sincronización:** TanStack Query `5.x`.
- **Formularios:** React Hook Form `7.x`.
- **Validación:** Zod `3.x`.
- **Kanban drag & drop:** dnd-kit `6.x`.
- **Charts dashboard:** Recharts `2.x`.
- **Cliente HTTP:** `fetch` nativo con capa wrapper interna.
- **Notificaciones UI:** sistema toast global (shadcn sonner o equivalente integrado en shadcn).

### 2.3 Testing y calidad

- **Unit tests:** Vitest `1.x` + Testing Library.
- **Integración frontend:** Testing Library + MSW.
- **E2E:** Playwright `1.x`.
- **Accesibilidad mínima exigida:** WCAG 2.1 AA en componentes y flujos críticos.

> Regla de versionado: se fijan **major/minor compatibles en lockfile** al iniciar implementación para evitar deriva en CI.

---

## 3) Dependencias requeridas

## Runtime dependencies

- `react`, `react-dom`
- `react-router-dom`
- `zustand`
- `@tanstack/react-query`
- `react-hook-form`
- `zod`
- `@hookform/resolvers`
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- `recharts`
- `clsx`, `tailwind-merge`, `class-variance-authority`
- paquetes de shadcn/ui y Radix requeridos por componentes seleccionados

## Dev dependencies

- `typescript`
- `vite`, `@vitejs/plugin-react`
- `tailwindcss`, `postcss`, `autoprefixer`
- `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`
- `msw`
- `playwright`
- `eslint`, `prettier` (si ya aplica estándar de repo)

---

## 4) Modelo de datos frontend (contrato de tipos)

## 4.1 Entidades principales

### User

- `id: string (uuid)`
- `name: string`
- `email: string`
- `handle: string`
- `role: "admin" | "member"`
- `active: boolean`

### Ticket

- `id: string (uuid)`
- `title: string` (1..120)
- `description: string | null` (markdown)
- `status: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"`
- `isBlocked: boolean`
- `priority: "LOW" | "MEDIUM" | "HIGH"`
- `assignees: User[]` (0..n, sin límite UI)
- `labels: string[]`
- `createdBy: User`
- `createdAt: string` (ISO UTC)
- `updatedAt: string` (ISO UTC)
- `archivedAt: string | null` (ISO UTC)
- `version: number` (optimistic locking)

### Comment

- `id: string (uuid)`
- `ticketId: string`
- `author: User`
- `body: string` (texto plano)
- `mentions: string[]` (`@handle` extraídos)
- `createdAt: string` (ISO UTC)
- `archivedAt: string | null`

### DashboardFilters

- `from: string (YYYY-MM-DD)`
- `to: string (YYYY-MM-DD)`
- `status: TicketStatus[]` (multi)
- `assigneeId: string | null`

### BoardFilters

- `status: TicketStatus[]`
- `priority: TicketPriority[]`
- `assigneeId: string | null`
- `label: string | null`
- `createdFrom: string | null`
- `createdTo: string | null`

## 4.2 Convenciones de datos y fechas

- Backend entrega fechas en UTC (ISO 8601).
- Frontend renderiza en **zona local del navegador** con formato ES.
- Export CSV mantiene formato backend (UTC ISO) según PRD.

## 4.3 Sesión/autenticación

- Sesión basada en **cookies HttpOnly**.
- Frontend no persiste tokens en `localStorage` ni `sessionStorage`.
- Frontend asume flujo OAuth Google Workspace en backend; consume estado de sesión vía endpoints protegidos.

---

## 5) Arquitectura de componentes

## 5.1 Pantallas y rutas

- `/login`
  - Inicio OAuth corporativo.
  - Mensajes de cuenta no aprovisionada / acceso denegado.
- `/board`
  - Vista principal Kanban (4 columnas).
  - Sin ruta de detalle dedicada; detalle en modal/panel.
- `/dashboard`
  - Métricas + filtros + export CSV.
- `/admin/archived` (solo `admin`)
  - Listado de tickets archivados y acción de restaurar.

## 5.2 Layout shell

- `AppShell`
  - Sidebar/topbar navegación.
  - Área principal por ruta.
  - Zona global de toasts.
  - Boundary de errores de vista.

## 5.3 Módulo Board (Kanban)

- `BoardPage`
  - `BoardToolbar` (filtros + crear ticket)
  - `KanbanBoard`
    - `KanbanColumn` (TODO/IN_PROGRESS/REVIEW/DONE)
    - `TicketCard`
  - `TicketEditorModal` (crear/editar)
  - `TicketDetailPanel` (comentarios/acciones)

### Interacción obligatoria

- Cambio de estado **exclusivamente por drag & drop**.
- Orden por columna: `updated_at` descendente.
- Flag `Bloqueado` como badge rojo, sin mover columna.

## 5.4 Módulo Dashboard

- `DashboardPage`
  - `MetricsFiltersBar`
  - `KpiCards`
  - `TicketsClosedByMonthChart`
  - `TicketsByStatusChart`
  - `TicketsByMemberChart`
  - `ExportCsvButton`

### Comportamiento export

- Botón visible en dashboard.
- Deshabilitado si dataset filtrado es vacío.
- Tooltip obligatorio: `"No hay datos para el rango seleccionado"`.
- Descarga directa sin modal.

## 5.5 Módulo Admin Archivados

- `ArchivedTicketsPage`
  - Tabla/lista de archivados.
  - Filtros básicos (fecha, creador, estado previo opcional).
  - Acción restaurar (si backend la soporta).

## 5.6 Auth y permisos UI

- `ProtectedRoute`
- `RoleGate`

### UX de permisos no autorizados

- Mostrar controles deshabilitados (no ocultarlos por defecto) con tooltip de motivo.
- Validación final siempre backend-driven (UI nunca sustituye control de permisos servidor).

---

## 6) Estructura de carpetas

```text
src/
  app/
    router/
    providers/
    store/
  shared/
    ui/
    lib/
      api/
      auth/
      date/
      permissions/
      errors/
    config/
    types/
  features/
    auth/
      components/
      api/
      hooks/
      types/
    board/
      components/
      api/
      hooks/
      dnd/
      types/
    tickets/
      components/
      api/
      hooks/
      types/
    comments/
      components/
      api/
      hooks/
      types/
    dashboard/
      components/
      api/
      hooks/
      charts/
      types/
    archived/
      components/
      api/
      hooks/
      types/
  pages/
    LoginPage.tsx
    BoardPage.tsx
    DashboardPage.tsx
    ArchivedTicketsPage.tsx
  test/
    unit/
    integration/
    e2e/
```

### Regla de organización

- Todo acceso a red vive en `features/*/api` o `shared/lib/api`.
- Componentes presentacionales en `components`.
- Lógica de estado y side effects en `hooks`.
- Tipos de dominio locales en `types`.

---

## 7) Reglas de negocio frontend (sin ambigüedad)

## 7.1 Tickets y flujo

- Estados permitidos: `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`.
- `Bloqueado` es flag booleano independiente del estado.
- Crear ticket requiere `title` y `priority`; estado inicial `TODO`.
- Acción UI “Eliminar” ejecuta archivado (soft delete).
- Member solo puede editar/cambiar estado/archivar tickets propios.
- Admin puede operar sobre cualquier ticket.
- Tickets archivados no aparecen en tablero activo.

## 7.2 Comentarios

- Comentario es texto plano.
- No edición; solo archivado.
- Member puede archivar comentario propio.
- Admin puede archivar cualquiera.

## 7.3 Concurrencia (`409 Conflict`)

- En edición de ticket, ante `409`:
  - mostrar mensaje: “Alguien modificó este ticket mientras lo editabas. Recarga para ver los cambios.”
  - conservar cambios locales en formulario.
  - no sobrescribir automáticamente ni merge automático.

## 7.4 Métricas y export

- Dashboard accesible a todos los roles.
- Tickets archivados **sí cuentan** en histórico según reglas del PRD.
- Filtros dashboard: fechas, estado (multi), asignado.
- Export CSV replica exactamente filtros activos de dashboard.
- Errores:
  - `400`: mostrar error de rango inválido, no descargar.
  - `401`: redirigir a login.
  - `500`: mensaje genérico de error.

## 7.5 Filtros y persistencia

- Filtros de tablero y dashboard se persisten en URL query params.
- URL es la única fuente de persistencia para compartir estado de filtros.

## 7.6 Fechas y localización

- Render de fechas en UI en formato local ES.
- CSV mantiene contrato backend (UTC ISO).

## 7.7 Responsive y accesibilidad

- Soporte obligatorio: mobile, tablet y desktop.
- Flujo Kanban en mobile con scroll horizontal de columnas y tarjetas táctiles.
- Todo control interactivo accesible por teclado.
- Contraste, foco visible y semántica para cumplir WCAG 2.1 AA en flujos críticos.

## 7.8 Manejo de errores UX

- Formularios: errores inline por campo.
- Operaciones globales: toast.
- Errores fatales de render: error boundary de vista con recuperación básica.

---

## 8) Contrato de integración API (frontend)

## 8.1 Principios

- `fetch` wrapper común para:
  - parseo JSON/CSV
  - manejo uniforme de `401/403/409/5xx`
  - normalización de errores de dominio

## 8.2 Endpoints mínimos esperados por frontend

- Auth/session:
  - `GET /api/auth/session`
  - `POST /api/auth/logout`
- Tickets:
  - `GET /api/tickets`
  - `POST /api/tickets`
  - `PATCH /api/tickets/:id` (incluye `version`)
  - `POST /api/tickets/:id/archive`
  - `POST /api/tickets/:id/restore` (admin archivados)
- Comentarios:
  - `GET /api/tickets/:id/comments`
  - `POST /api/tickets/:id/comments`
  - `POST /api/comments/:id/archive`
- Dashboard:
  - `GET /api/metrics`
  - `GET /api/metrics/export`

> Si algún endpoint difiere en backend real, se conserva esta especificación funcional y se actualiza solo el adapter de API del frontend.

---

## 9) Estrategia de pruebas frontend

- **Unitarias:** utilidades (fechas/permisos), selectores, stores de Zustand.
- **Integración:** creación de ticket, drag & drop de estado, conflicto `409`, filtros y export con estados vacíos/error.
- **E2E críticas:**
  - login + acceso tablero
  - CRUD funcional de ticket (sin hard delete)
  - restricciones por rol member/admin
  - dashboard y descarga CSV
  - vista admin de archivados

---

## 10) Criterio de inicio de implementación

Se considera que la especificación está cerrada cuando se confirme este documento y, a partir de ello, la implementación deberá respetar este contrato sin introducir decisiones implícitas adicionales.

