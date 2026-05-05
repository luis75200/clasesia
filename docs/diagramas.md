# Diagramas Tecnicos Mini Jira

## 1) Flujo de autenticacion JWT

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant FE as Frontend
    participant API as API Auth
    participant AUTH as Servicio Auth
    participant DB as Base de Datos

    U->>FE: Envia email/password o credenciales corporativas
    FE->>API: POST /api/auth/login
    API->>AUTH: Validar credenciales
    AUTH->>DB: Buscar usuario y verificar estado
    DB-->>AUTH: Usuario valido
    AUTH-->>API: Generar access token + refresh token
    API-->>FE: 200 Tokens JWT
    FE-->>U: Sesion iniciada

    Note over FE,API: Renovacion: FE envia refresh token a /api/auth/refresh para nuevo access token
```

## 2) Mover ticket entre columnas

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuario
    participant FE as Frontend
    participant API as API Tickets
    participant SVC as Tickets Service
    participant DB as Base de Datos
    participant AUD as AuditLog

    U->>FE: Arrastra ticket de TODO a IN_PROGRESS
    FE->>API: POST /api/tickets/:id/change-status (status, version)
    API->>SVC: Solicitar cambio de estado
    SVC->>DB: SELECT ticket por id/version
    DB-->>SVC: Ticket encontrado o conflicto

    alt Version coincide
        SVC->>DB: UPDATE status, version = version + 1, updated_at
        DB-->>SVC: Update OK
        SVC-->>API: Ticket actualizado
        API-->>FE: 200 OK ticket actualizado
        Note over SVC,AUD: Registrar en AuditLog (pendiente/P2 segun specs)
    else Version no coincide
        SVC-->>API: Conflicto de concurrencia
        API-->>FE: 409 Conflict
    end
```

## 3) Ciclo de vida de ticket con lock pesimista

```mermaid
flowchart LR
    A[TODO] --> L1{Pessimistic Lock\nactivo?}
    L1 -- Si --> W1[Esperar desbloqueo]
    W1 --> L1
    L1 -- No --> B[IN_PROGRESS]

    B --> L2{Pessimistic Lock\nactivo?}
    L2 -- Si --> W2[Esperar desbloqueo]
    W2 --> L2
    L2 -- No --> C[DONE]
```

## Notas de trazabilidad
- El flujo de concurrencia por version se basa en [BACKEND-SPECS.md](BACKEND-SPECS.md) y [specs.md](specs.md).
- La referencia de rutas para login y cambio de estado se basa en [backend/src/routes/auth.routes.ts](backend/src/routes/auth.routes.ts) y [backend/src/routes/tickets.routes.ts](backend/src/routes/tickets.routes.ts).
- AuditLog se representa como pendiente/P2 porque en [specs.md](specs.md) aparece como out-of-scope en v1.
