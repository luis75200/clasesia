# Mini Jira API Contract

Version: 2026-05-04
Source of truth: backend routes and controllers in backend/src

## Auth model
- Current implementation: session token persisted in auth_sessions and delivered in HttpOnly cookie minijira-session.
- Protected routes require authenticated user (auth middleware).
- Priority P2 pending: JWT access token + refresh token flow is not implemented yet in codebase.

## Endpoint catalog

| Priority | Status | Method | Route | Auth required | Body fields | Response (summary) |
|---|---|---|---|---|---|---|
| P0 | implemented | POST | /api/auth/login | No | email (required), name (optional) | 200 with user object; sets session cookie |
| P0 | implemented | GET | /api/auth/session | Yes | none | 200 with current user |
| P0 | implemented | POST | /api/auth/logout | Yes | none | 200 success true |
| P0 | implemented | GET | /api/tickets | Yes | none (query: skip,take,status,priority,assignee_id,label,from_date,to_date) | 200 paginated ticket list |
| P0 | implemented | POST | /api/tickets | Yes | title, description, priority, assignees[], labels[] | 201 with created ticket |
| P0 | implemented | GET | /api/tickets/:id | Yes | none | 200 with ticket detail |
| P0 | implemented | PATCH | /api/tickets/:id | Yes | any of title,description,status,priority,is_blocked plus required version | 200 with updated ticket |
| P0 | implemented | POST | /api/tickets/:id/change-status | Yes | status, version | 200 with updated ticket |
| P0 | implemented | POST | /api/tickets/:id/archive | Yes | none | 200 success true (soft delete) |
| P0 | implemented | GET | /api/comments | Yes | none (query: ticket_id required) | 200 comments for ticket |
| P0 | implemented | POST | /api/comments | Yes | ticket_id, body | 201 with created comment |
| P0 | implemented | POST | /api/comments/:id/archive | Yes | none | 200 success true |
| P0 | implemented | GET | /api/metrics/summary | Yes | none (query: from_date,to_date optional) | 200 with metrics summary |
| P0 | implemented | GET | /api/metrics/export.csv | Yes | none (query: from_date,to_date optional) | 200 CSV stream |
| P1 | implemented | GET | /api/projects | Yes | none (query: skip,take,status,search) | 200 paginated project list |
| P1 | implemented | GET | /api/projects/:id | Yes | none | 200 project detail |
| P1 | implemented | POST | /api/projects | Yes | name,key,description | 201 created project |
| P1 | implemented | PATCH | /api/projects/:id | Yes | any of name,key,description | 200 updated project |
| P1 | implemented | POST | /api/projects/:id/archive | Yes | none | 200 archived project |
| P1 | implemented | POST | /api/projects/:id/restore | Yes | none | 200 restored project |
| P2 | implemented | GET | /api/tasks | Yes | none (query: skip,take,status,priority,assignee_id,label,from_date,to_date) | 200 paginated task list |
| P2 | implemented | POST | /api/tasks | Yes | title,description,priority,project_id,assignees[],labels[] | 201 created task |
| P2 | implemented | POST | /api/tasks/:id/assign-project | Yes | project_id | 200 updated task |
| P2 | pending | N/A | JWT refresh endpoint (route TBD) | Yes | refresh_token (planned) | Not implemented |

## Status code baseline
- 200 OK: successful read/update/archive/export.
- 201 Created: successful creation.
- 400 Bad Request: validation errors, invalid query or body.
- 401 Unauthorized: missing or invalid authenticated session.
- 403 Forbidden: role/ownership restrictions.
- 404 Not Found: missing resource.
- 409 Conflict: optimistic locking conflict or unique key conflict.
- 500 Internal Server Error: unexpected server-side error.
