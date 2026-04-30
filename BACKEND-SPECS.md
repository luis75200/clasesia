# Backend Specification — Mini Jira v1

**Fecha:** 2026-04-29  
**Versión:** 1.0  
**Estado:** Implementation-Ready

## 1. Overview

Backend REST API para Mini Jira MVP, construido con Node.js, Express, Drizzle ORM y PostgreSQL. Soporta autenticación corporativa vía Google Workspace, gestión de tickets Kanban, comentarios colaborativos, notificaciones por email y reporting.

## 2. Stack tecnológico

- **Runtime:** Node.js 20 LTS
- **Framework:** Express 5
- **ORM:** Drizzle ORM
- **Database:** PostgreSQL 16
- **Auth:** Google Workspace OAuth 2.0 + sesión por cookie HttpOnly
- **Hashing:** bcryptjs (para hashes auxiliares si se requiere)
- **Validación:** Zod
- **Deployment:** Vercel / serverless compatible

## 3. Principios técnicos

- Arquitectura modular por dominio: auth, users, tickets, comments, metrics, archived, notifications
- Capas por módulo: controller, service, repository, validation, types
- Respuestas de error con código, mensaje, detalles y requestId
- Compatible con entornos serverless
- Dependencias mínimas para mantener bajo footprint
- SQL explícito mediante Drizzle cuando aporte clarity o rendimiento

## 4. Autenticación y sesión

### 4.1 Flujo OAuth

1. Usuario inicia `/api/auth/login`
2. Backend genera `state` de CSRF y redirige a Google Workspace
3. Usuario autoriza en Google
4. Google redirige a `/api/auth/callback` con `code` y `state`
5. Backend valida `state`, intercambia `code` por identidad de usuario
6. Si la cuenta está aprovisionada, backend emite sesión por cookie HttpOnly
7. Si no está aprovisionada, retorna `403` con mensaje claro
8. El frontend preserva estado local tras recibir la respuesta

### 4.2 Sesión y cookies

- Cookie de sesión es HttpOnly, Secure y SameSite=Lax
- No se exponen access tokens en `localStorage` ni `sessionStorage`
- Sesión se valida en cada request a endpoints protegidos
- Logout invalida la sesión en servidor

### 4.3 Endpoints de autenticación

#### `GET /api/auth/login`
- Inicia flujo OAuth
- Genera estado CSRF
- Redirige a Google Workspace

**Response:**
- `302 Found` con redirect a Google

---

#### `GET /api/auth/callback`
- Procesa callback OAuth
- Query params: `code`, `state`

**Response éxita:**
- `302 Found` redirige a `/board` con cookie de sesión

**Response fallo:**
- `400` si `state` no coincide
- `403` si la cuenta no está aprovisionada
- `500` si hay error en Google

---

#### `GET /api/auth/session`
- Devuelve sesión y usuario autenticado

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@empresa.com",
    "name": "Nombre Usuario",
    "handle": "nombre-usuario",
    "role": "member|admin",
    "is_active": true,
    "avatar_url": "https://...",
    "last_login_at": "2026-04-29T10:00:00Z"
  }
}
```

**Errores:**
- `401` sesión inválida

---

#### `POST /api/auth/logout`
- Invalida sesión actual

**Response:**
- `200 OK`

**Errores:**
- `401` sesión inválida

---

## 5. Usuarios

### 5.1 Modelo

- `id`: UUID
- `email`: unique, not blank
- `name`: not blank
- `handle`: unique, not blank
- `role`: enum `admin`, `member`
- `is_active`: boolean
- `google_subject`: unique, almacena el sub de Google
- `avatar_url`: URL de avatar (optional)
- `last_login_at`: timestamptz (optional)
- `created_at`: timestamptz auto
- `updated_at`: timestamptz auto

### 5.2 Reglas de negocio

- Usuarios son aprovisionados por admin
- Email y handle son únicos en el sistema
- `is_active = false` bloquea acceso aunque Google valide la identidad
- El first login completa datos de identidad y actualiza `last_login_at`

### 5.3 Endpoints

#### `GET /api/users`
- Lista usuarios activos
- Query params: `skip` (default 0), `take` (default 50), `role` (optional)
- Acceso: `admin` y `member`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@empresa.com",
      "name": "Nombre",
      "handle": "nombre",
      "role": "member",
      "is_active": true,
      "avatar_url": "https://...",
      "last_login_at": "2026-04-29T10:00:00Z"
    }
  ],
  "total": 10
}
```

---

#### `GET /api/users/:id`
- Detalle de usuario

**Response:**
```json
{
  "id": "uuid",
  "email": "user@empresa.com",
  "name": "Nombre",
  "handle": "nombre",
  "role": "member",
  "is_active": true,
  "avatar_url": "https://...",
  "last_login_at": "2026-04-29T10:00:00Z"
}
```

---

#### `POST /api/users`
- Aprovisionamiento de usuario por admin
- Acceso: solo `admin`

**Body:**
```json
{
  "email": "user@empresa.com",
  "name": "Nombre Usuario",
  "handle": "nombre-usuario",
  "role": "member|admin"
}
```

**Response:**
- `201 Created` con usuario creado
- `400` si email o handle ya existen
- `403` si no eres admin

---

#### `PATCH /api/users/:id`
- Actualiza usuario
- Acceso: solo `admin`

**Body:**
```json
{
  "name": "Nombre Actualizado",
  "role": "member|admin"
}
```

**Response:**
- `200 OK`
- `403` sin permisos

---

#### `POST /api/users/:id/deactivate`
- Desactiva usuario
- Acceso: solo `admin`

**Response:**
- `200 OK`
- `403` sin permisos

---

#### `POST /api/users/:id/activate`
- Reactiva usuario
- Acceso: solo `admin`

**Response:**
- `200 OK`
- `403` sin permisos

---

## 6. Tickets

### 6.1 Modelo

Obligatorios:
- `title` (max 120 chars)
- `priority` (enum)

Opcionales:
- `description` (Markdown)
- `assignees[]`
- `labels[]`

Automáticos:
- `status` (default TODO)
- `created_by`
- `created_at`
- `updated_at`
- `version` (default 1)

Otros:
- `is_blocked` (default false)
- `archived_at` (NULL si activo)

### 6.2 Enums y estados

**priority:** `LOW`, `MEDIUM`, `HIGH`  
**status:** `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`

Workflow:
```
TODO → IN_PROGRESS → REVIEW → DONE
```

Reordenamiento permitido dentro de la misma columna.

### 6.3 Reglas de negocio

- `is_blocked` es flag lateral, no cambia status
- tickets archivados (`archived_at IS NOT NULL`) no aparecen en tablero activo
- tickets archivados sí cuentan en métricas históricas
- member solo puede editar/cambiar estado/archivar tickets propios
- admin opera sobre cualquier ticket
- Cambios a ticket actualizan `version` y `updated_at`

### 6.4 Concurrencia (Optimistic Locking)

- Toda actualización de ticket requiere `version`
- Update se ejecuta como `UPDATE tickets SET ... WHERE id = ? AND version = ?`
- Si no coincide la versión: respuesta `409 Conflict`
- La aplicación incrementa `version` y no el cliente

### 6.5 Endpoints

#### `GET /api/tickets`
- Lista tickets activos con filtros
- Query params: `status`, `priority`, `assignee_id`, `label`, `created_from`, `created_to`, `skip`, `take`
- Acceso: `admin` y `member`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Configurar OAuth",
      "description": "Texto markdown...",
      "status": "TODO",
      "priority": "HIGH",
      "is_blocked": false,
      "version": 1,
      "created_by": { "id": "uuid", "name": "Laura" },
      "assignees": [{ "id": "uuid", "name": "Marcos" }],
      "labels": ["auth", "setup"],
      "created_at": "2026-04-20T10:00:00Z",
      "updated_at": "2026-04-20T10:00:00Z"
    }
  ],
  "total": 15
}
```

---

#### `GET /api/tickets/:id`
- Detalle de ticket

**Response:** igual a arriba, un objeto

---

#### `POST /api/tickets`
- Crea ticket
- Acceso: `admin` y `member`

**Body:**
```json
{
  "title": "Configurar OAuth",
  "description": "Texto markdown...",
  "priority": "HIGH",
  "assignee_ids": ["uuid1", "uuid2"],
  "labels": ["auth", "setup"]
}
```

**Response:**
- `201 Created`
- `400` si title falta o priority inválido
- `401` sesión inválida

---

#### `PATCH /api/tickets/:id`
- Actualiza campos editables
- Requiere `version`
- Acceso: owner (member) o admin

**Body:**
```json
{
  "title": "Nuevo título",
  "description": "Nuevo contenido",
  "priority": "MEDIUM",
  "assignee_ids": ["uuid1"],
  "labels": ["nuevas", "labels"],
  "version": 1
}
```

**Response:**
- `200 OK` con ticket actualizado
- `403` sin permiso
- `404` ticket inexistente
- `409` versión no coincide

---

#### `POST /api/tickets/:id/change-status`
- Cambia status
- Requiere `version`
- Acceso: owner (member) o admin

**Body:**
```json
{
  "status": "IN_PROGRESS",
  "version": 1
}
```

**Response:**
- `200 OK`
- `400` transición inválida
- `403` sin permiso
- `409` versión no coincide

---

#### `POST /api/tickets/:id/toggle-blocked`
- Alterna flag `is_blocked`
- Acceso: owner (member) o admin

**Body:**
```json
{
  "is_blocked": true
}
```

**Response:**
- `200 OK`

---

#### `POST /api/tickets/:id/archive`
- Archiva ticket (soft delete)
- Acceso: owner (member) o admin

**Response:**
- `200 OK`
- `403` sin permiso

---

#### `POST /api/tickets/:id/restore`
- Restaura ticket archivado
- Acceso: solo `admin`

**Response:**
- `200 OK`
- `403` sin permiso

---

## 7. Comentarios

### 7.1 Modelo

- `id`: UUID
- `ticket_id`: FK tickets
- `author_id`: FK users
- `body`: Markdown text
- `archived_at`: NULL si activo
- `created_at`: timestamptz
- `updated_at`: timestamptz

### 7.2 Reglas

- Comentarios usan Markdown
- Se editan libremente, sobrescribiendo el contenido
- Menciones `@handle` se resuelven en el servidor
- Archivado cancela notificaciones pendientes

### 7.3 Endpoints

#### `GET /api/tickets/:id/comments`
- Lista comentarios activos del ticket
- Query params: `skip`, `take`

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "ticket_id": "uuid",
      "author": { "id": "uuid", "name": "Marcos", "handle": "marcos" },
      "body": "# Comentario en **Markdown**",
      "mentions": ["laura", "sofia"],
      "created_at": "2026-04-29T10:00:00Z",
      "updated_at": "2026-04-29T10:00:00Z"
    }
  ],
  "total": 3
}
```

---

#### `POST /api/tickets/:id/comments`
- Crea comentario
- Acceso: `admin` y `member`

**Body:**
```json
{
  "body": "# Título\n\nMenciono a @laura y @marcos"
}
```

**Response:**
- `201 Created`
- `400` body vacío
- `404` ticket inexistente

---

#### `PATCH /api/comments/:id`
- Edita comentario propio
- Acceso: author o admin

**Body:**
```json
{
  "body": "Contenido actualizado"
}
```

**Response:**
- `200 OK`
- `403` sin permiso

---

#### `POST /api/comments/:id/archive`
- Archiva comentario
- Acceso: author o admin
- Cancela notificaciones pendientes del comentario

**Response:**
- `200 OK`
- `403` sin permiso

---

## 8. Notificaciones por email

### 8.1 Eventos

- asignación de ticket
- comentario en ticket donde eres creador o asignado
- mención `@handle` en comentario

### 8.2 Reglas

- Si el comentario se archiva antes del despacho: notificación se cancela silenciosamente
- Proveedor: Resend (SMTP corporativo como fallback futuro)
- Sistema de cola persistente simple en v1

### 8.3 No expone endpoints públicos

Las notificaciones se gestionan internamente como dominio de servicio.

---

## 9. Dashboard de métricas

### 9.1 Acceso

- `admin` y `member`

### 9.2 Métricas requeridas

- tickets cerrados por mes
- tickets por estado
- tickets por miembro

### 9.3 Endpoint

#### `GET /api/metrics`
- Query params: `from`, `to`, `status[]`, `assignee_id`

**Response:**
```json
{
  "closed_by_month": [
    { "month": "2026-04", "count": 5 }
  ],
  "by_status": [
    { "status": "TODO", "count": 10 },
    { "status": "IN_PROGRESS", "count": 8 }
  ],
  "by_member": [
    { "user_id": "uuid", "name": "Marcos", "count": 12 }
  ]
}
```

---

## 10. Exportación CSV

### 10.1 Endpoint

#### `GET /api/metrics/export`
- Query params: `from`, `to`, `status[]`, `assignee_id`
- Streaming progresivo (no acumula en memoria)
- Acceso: `admin` y `member`

**Response headers:**
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="minijira-metrics-2026-04.csv"
```

**Columnas:**
```
ticket_id,title,status,priority,assignees,labels,created_by,created_at,closed_at,archived
```

**Errores:**
- `400` si `from > to`
- `401` sesión inválida

---

## 11. Archivados (admin)

### 11.1 Acceso

- solo `admin`

### 11.2 Endpoints

#### `GET /api/archived/tickets`
- Lista tickets archivados
- Query params: `created_by`, `status`, `archived_from`, `archived_to`, `skip`, `take`

**Response:** igual a tickets activos, incluyendo `archived_at`

---

#### `GET /api/archived/tickets/:id`
- Detalle de ticket archivado

---

## 12. Contratos de error

Formato JSON estándar:

```json
{
  "code": "ERROR_CODE",
  "message": "Descripción legible",
  "details": { "field": "información adicional" },
  "requestId": "uuid-del-request"
}
```

Códigos HTTP manejados:

- `400 Bad Request` — validación fallida
- `401 Unauthorized` — sesión inválida o ausente
- `403 Forbidden` — sin permisos
- `404 Not Found` — recurso inexistente
- `409 Conflict` — versión no coincide (optimistic locking)
- `500 Internal Server Error` — error del servidor

---

## 13. Notas técnicas

- El esquema está definido en `database-schema.yaml` e implementado con Drizzle ORM en `src/db/schema.ts`
- Los usuarios se aprovisionan externamente; el backend completa datos en first login
- Las sesiones persisten en PostgreSQL, no en Redis (v1)
- Las notificaciones usan una cola simple en la misma DB; escalado a worker dedicado en v1.1
- El CSV se envía en streaming para soportar grandes volúmenes sin presión en heap
- El optimistic locking en tickets previene race conditions de concurrencia

---

## 14. Próximos pasos (v1.1+)

- Auditoría de cambios (quién cambió qué estado y cuándo)
- Worker dedicado de emails con reintentos y backoff exponencial
- Rate limiting por IP y por usuario
- Métricas de sistema y APM
- Importación masiva desde otras herramientas
- Integración con Slack
