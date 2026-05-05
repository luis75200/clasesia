# Mini Jira API Reference

Source: api-contract.md
Version: 2026-05-04

## Tabla de endpoints

| metodo | ruta | auth | body (campos) | response | status codes posibles |
|---|---|---|---|---|---|
| POST | /api/auth/login | No | email (req), name (opt) | 200, data.user + session cookie | 200, 400, 500 |
| GET | /api/auth/session | Bearer token requerido | none | 200, data.user | 200, 401, 500 |
| POST | /api/auth/logout | Bearer token requerido | none | 200, data.success=true | 200, 401, 500 |
| GET | /api/tickets | Bearer token requerido | none (query: skip,take,status,priority,assignee_id,label,from_date,to_date) | 200, data[] + total + paginacion | 200, 400, 401, 500 |
| POST | /api/tickets | Bearer token requerido | title, description, priority, assignees[], labels[] | 201, data(ticket) | 201, 400, 401, 500 |
| GET | /api/tickets/:id | Bearer token requerido | none | 200, data(ticket) | 200, 400, 401, 404, 500 |
| PATCH | /api/tickets/:id | Bearer token requerido | title?, description?, status?, priority?, is_blocked?, version(req) | 200, data(ticket actualizado) | 200, 400, 401, 403, 404, 409, 500 |
| POST | /api/tickets/:id/change-status | Bearer token requerido | status(req), version(req) | 200, data(ticket actualizado) | 200, 400, 401, 403, 404, 409, 500 |
| POST | /api/tickets/:id/archive | Bearer token requerido | none | 200, data.success=true | 200, 401, 403, 404, 500 |
| GET | /api/comments | Bearer token requerido | none (query: ticket_id req) | 200, data(comments[]) | 200, 400, 401, 500 |
| POST | /api/comments | Bearer token requerido | ticket_id(req), body(req) | 201, data(comment) | 201, 400, 401, 500 |
| POST | /api/comments/:id/archive | Bearer token requerido | none | 200, data.success=true | 200, 401, 403, 404, 500 |
| GET | /api/metrics/summary | Bearer token requerido | none (query: from_date?,to_date?) | 200, data(summary) | 200, 400, 401, 500 |
| GET | /api/metrics/export.csv | Bearer token requerido | none (query: from_date?,to_date?) | 200, text/csv stream | 200, 400, 401, 500 |
| GET | /api/projects | Bearer token requerido | none (query: skip,take,status,search) | 200, data[] + total + paginacion | 200, 400, 401, 500 |
| GET | /api/projects/:id | Bearer token requerido | none | 200, data(project) | 200, 401, 404, 500 |
| POST | /api/projects | Bearer token requerido | name, key, description | 201, data(project) | 201, 400, 401, 409, 500 |
| PATCH | /api/projects/:id | Bearer token requerido | name?, key?, description? | 200, data(project actualizado) | 200, 400, 401, 404, 409, 500 |
| POST | /api/projects/:id/archive | Bearer token requerido | none | 200, data(project archivado) | 200, 401, 404, 500 |
| POST | /api/projects/:id/restore | Bearer token requerido | none | 200, data(project restaurado) | 200, 401, 404, 500 |
| GET | /api/tasks | Bearer token requerido | none (query: skip,take,status,priority,assignee_id,label,from_date,to_date) | 200, data[] + total + paginacion | 200, 400, 401, 500 |
| POST | /api/tasks | Bearer token requerido | title, description, priority, project_id, assignees[], labels[] | 201, data(task) | 201, 400, 401, 500 |
| POST | /api/tasks/:id/assign-project | Bearer token requerido | project_id(req) | 200, data(task actualizada) | 200, 400, 401, 404, 500 |
| N/A | JWT refresh endpoint (route TBD) | Bearer token requerido | refresh_token (planned) | Pendiente | Pendiente |

Notas de prioridad:
- P0: auth, tickets, comments, metrics.
- P1: projects.
- P2: tasks.
- P2 pendiente: refresh token endpoint.

## Ejemplos curl (endpoints P0)

Base URL usada en ejemplos: http://localhost:3000

### Auth

```bash
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "email": "laura.garcia@empresa.com",
    "name": "Laura Garcia"
  }'
```

```bash
curl -X GET "http://localhost:3000/api/auth/session" \
  -H "Authorization: Bearer {token}"
```

```bash
curl -X POST "http://localhost:3000/api/auth/logout" \
  -H "Authorization: Bearer {token}"
```

### Tickets

```bash
curl -X GET "http://localhost:3000/api/tickets?skip=0&take=20&status=TODO" \
  -H "Authorization: Bearer {token}"
```

```bash
curl -X POST "http://localhost:3000/api/tickets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "title": "Configurar autenticacion OAuth 2.0",
    "description": "Integrar Google Workspace",
    "priority": "HIGH",
    "assignees": ["a1000000-0000-0000-0000-000000000002"],
    "labels": ["auth", "backend"]
  }'
```

```bash
curl -X GET "http://localhost:3000/api/tickets/b2000000-0000-0000-0000-000000000001" \
  -H "Authorization: Bearer {token}"
```

```bash
curl -X PATCH "http://localhost:3000/api/tickets/b2000000-0000-0000-0000-000000000001" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "title": "Configurar autenticacion OAuth 2.0 (ajustado)",
    "is_blocked": false,
    "version": 1
  }'
```

```bash
curl -X POST "http://localhost:3000/api/tickets/b2000000-0000-0000-0000-000000000001/change-status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "status": "IN_PROGRESS",
    "version": 1
  }'
```

```bash
curl -X POST "http://localhost:3000/api/tickets/b2000000-0000-0000-0000-000000000001/archive" \
  -H "Authorization: Bearer {token}"
```

### Comments

```bash
curl -X GET "http://localhost:3000/api/comments?ticket_id=b2000000-0000-0000-0000-000000000001" \
  -H "Authorization: Bearer {token}"
```

```bash
curl -X POST "http://localhost:3000/api/comments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "ticket_id": "b2000000-0000-0000-0000-000000000001",
    "body": "Comentario de seguimiento"
  }'
```

```bash
curl -X POST "http://localhost:3000/api/comments/c3000000-0000-0000-0000-000000000001/archive" \
  -H "Authorization: Bearer {token}"
```

### Metrics

```bash
curl -X GET "http://localhost:3000/api/metrics/summary?from_date=2026-04-01T00:00:00.000Z&to_date=2026-04-30T23:59:59.000Z" \
  -H "Authorization: Bearer {token}"
```

```bash
curl -X GET "http://localhost:3000/api/metrics/export.csv?from_date=2026-04-01T00:00:00.000Z&to_date=2026-04-30T23:59:59.000Z" \
  -H "Authorization: Bearer {token}" \
  -o metrics.csv
```

## Autenticacion

Flujo requerido por contrato (JWT):
1. Login: el cliente autentica al usuario y obtiene access token.
2. Token: el cliente envia Authorization: Bearer {token} en endpoints protegidos.
3. Refresh: cuando expira el access token, el cliente solicita uno nuevo con refresh token.

Estado actual segun contrato:
- Implementado: login, session, logout.
- Pendiente P2: refresh token endpoint (route TBD).

Nota importante de implementacion actual:
- El backend vigente persiste sesion en auth_sessions y usa cookie HttpOnly minijira-session.
- El flujo JWT completo (access + refresh) aun no esta implementado en el codigo actual.
