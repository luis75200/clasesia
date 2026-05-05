# Documentacion de Base de Datos

## Fuente y alcance
- Esquema principal: [backend/src/db/schema.ts](backend/src/db/schema.ts)
- Migraciones en src/db/migrations: no existen en este repositorio
- Referencia SQL complementaria: [init_db.sql](init_db.sql)

## 1) ERD en Mermaid

```mermaid
erDiagram
    USERS {
        text id PK
        text email UK NN
        text name NN
        text handle UK NN
        text role NN
        boolean is_active NN
        text google_subject UK
        text avatar_url
        text last_login_at
        text created_at NN
        text updated_at NN
    }

    AUTH_SESSIONS {
        text id PK
        text user_id FK NN
        text session_token UK NN
        text status NN
        text ip_address
        text user_agent
        text expires_at NN
        text last_seen_at
        text created_at NN
        text updated_at NN
    }

    PROJECTS {
        text id PK
        text name NN
        text key UK NN
        text description
        text status NN
        text owner_id FK NN
        text archived_at
        text created_at NN
        text updated_at NN
    }

    TICKETS {
        text id PK
        text title NN
        text description
        text status NN
        text priority NN
        boolean is_blocked NN
        int version NN
        text created_by FK NN
        text project_id FK
        text archived_at
        text created_at NN
        text updated_at NN
    }

    TICKET_ASSIGNEES {
        text ticket_id PK,FK NN
        text user_id PK,FK NN
        text assigned_at NN
    }

    TICKET_LABELS {
        text ticket_id PK,FK NN
        text label PK NN
        text created_at NN
    }

    COMMENTS {
        text id PK
        text ticket_id FK NN
        text author_id FK NN
        text body NN
        text archived_at
        text created_at NN
        text updated_at NN
    }

    COMMENT_MENTIONS {
        text comment_id PK,FK NN
        text mentioned_user_id PK,FK NN
        text created_at NN
    }

    NOTIFICATIONS {
        text id PK
        text recipient_id FK NN
        text ticket_id FK
        text comment_id FK
        text type NN
        text status NN
        text message NN
        text dispatched_at
        text created_at NN
    }

    USERS ||--o{ AUTH_SESSIONS : has
    USERS ||--o{ PROJECTS : owns
    USERS ||--o{ TICKETS : creates
    PROJECTS ||--o{ TICKETS : groups

    TICKETS ||--o{ TICKET_ASSIGNEES : assigned_to
    USERS ||--o{ TICKET_ASSIGNEES : assignee

    TICKETS ||--o{ TICKET_LABELS : labeled_with

    TICKETS ||--o{ COMMENTS : has
    USERS ||--o{ COMMENTS : writes

    COMMENTS ||--o{ COMMENT_MENTIONS : has
    USERS ||--o{ COMMENT_MENTIONS : mentioned

    USERS ||--o{ NOTIFICATIONS : receives
    TICKETS o|--o{ NOTIFICATIONS : context_ticket
    COMMENTS o|--o{ NOTIFICATIONS : context_comment
```

## 2) Tabla de entidades y constraints

| Tabla | Columnas clave | Tipo | Constraints (PK, FK, NOT NULL) |
|---|---|---|---|
| users | id, email, handle, role, is_active | text, boolean | PK(id), UNIQUE(email), UNIQUE(handle), NOT NULL(email,name,handle,role,is_active,created_at,updated_at) |
| auth_sessions | id, user_id, session_token, status, expires_at | text | PK(id), FK(user_id -> users.id ON DELETE CASCADE), UNIQUE(session_token), NOT NULL(user_id,session_token,status,expires_at,created_at,updated_at) |
| projects | id, key, owner_id, status | text | PK(id), UNIQUE(key), FK(owner_id -> users.id ON DELETE RESTRICT), NOT NULL(name,key,status,owner_id,created_at,updated_at) |
| tickets | id, created_by, project_id, status, priority, version | text, integer, boolean | PK(id), FK(created_by -> users.id ON DELETE RESTRICT), FK(project_id -> projects.id ON DELETE SET NULL), NOT NULL(title,status,priority,is_blocked,version,created_by,created_at,updated_at) |
| ticket_assignees | ticket_id, user_id | text | PK(ticket_id,user_id), FK(ticket_id -> tickets.id ON DELETE CASCADE), FK(user_id -> users.id ON DELETE CASCADE), NOT NULL(ticket_id,user_id,assigned_at) |
| ticket_labels | ticket_id, label | text | PK(ticket_id,label), FK(ticket_id -> tickets.id ON DELETE CASCADE), NOT NULL(ticket_id,label,created_at) |
| comments | id, ticket_id, author_id, body | text | PK(id), FK(ticket_id -> tickets.id ON DELETE CASCADE), FK(author_id -> users.id ON DELETE RESTRICT), NOT NULL(ticket_id,author_id,body,created_at,updated_at) |
| comment_mentions | comment_id, mentioned_user_id | text | PK(comment_id,mentioned_user_id), FK(comment_id -> comments.id ON DELETE CASCADE), FK(mentioned_user_id -> users.id ON DELETE CASCADE), NOT NULL(comment_id,mentioned_user_id,created_at) |
| notifications | id, recipient_id, ticket_id, comment_id, type, status | text | PK(id), FK(recipient_id -> users.id ON DELETE CASCADE), FK(ticket_id -> tickets.id ON DELETE CASCADE), FK(comment_id -> comments.id ON DELETE CASCADE), NOT NULL(recipient_id,type,status,message,created_at) |

## 3) Decisiones de diseño

### Soft delete via archived_at
- Implementado en tablas de dominio que requieren borrado logico:
  - projects.archived_at
  - tickets.archived_at
  - comments.archived_at
- Efecto esperado:
  - registros activos cuando archived_at es NULL
  - historico preservado para metricas y trazabilidad

### Pessimistic Lock con ticket_locks
- Estado en esquema actual de Drizzle: no implementado
- No existe entidad ticket_locks en [backend/src/db/schema.ts](backend/src/db/schema.ts)
- Nota de diseño:
  - actualmente el control de concurrencia visible es version (optimistic locking) en tickets.version
  - para lock pesimista se requiere nueva tabla ticket_locks con FK a tickets, owner de lock y expiracion

### AuditLog inmutable sin UPDATE/DELETE
- Estado en esquema actual de Drizzle: no implementado
- No existe tabla audit_log o equivalente en [backend/src/db/schema.ts](backend/src/db/schema.ts)
- Nota de diseño para implementar inmutabilidad:
  - tabla append-only con inserciones de eventos
  - revocar privilegios de UPDATE/DELETE o bloquear con trigger
  - indexar por ticket_id, actor_id y created_at para investigacion de incidentes
