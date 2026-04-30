# Implementación de GET/POST /api/tickets

**Fecha:** 29 de Abril de 2026  
**Estado:** ✅ Completado  
**Endpoints implementados:** GET /api/tickets, POST /api/tickets, GET /api/tickets/:id

---

## 📋 Archivos Creados

### 1. **tickets.validation.ts**
**Propósito:** Validación estricta de entradas con Zod

**Contenido:**
- `listTicketsQuerySchema` — Valida query params:
  - `skip`: 0-1000000 (default 0)
  - `take`: 1-500 (default 50)
  - `status`: enum TODO | IN_PROGRESS | REVIEW | DONE
  - `priority`: enum LOW | MEDIUM | HIGH
  - `assignee_id`: UUID válido
  - `label`: string 1-100 chars
  - `from_date`, `to_date`: ISO 8601 datetime
  
- `createTicketBodySchema` — Valida body de creación:
  - `title`: 1-120 chars (obligatorio, trimmed)
  - `description`: 0-10000 chars (opcional, nullable)
  - `priority`: LOW | MEDIUM | HIGH (obligatorio)
  - `assignees`: array de UUIDs (opcional)
  - `labels`: array de strings 1-100 (opcional)

- `updateTicketBodySchema` — Valida actualizaciones (LISTO PERO NO USADO AÚN)

- `validateDateRange()` — Valida que from_date <= to_date

**Error handling:**
- Si validación falla → `400 VALIDATION_ERROR` con detalles por campo

---

### 2. **tickets.types.ts**
**Propósito:** Tipos TypeScript específicos del módulo

**Interfaces:**
```typescript
interface TicketWithDetails {
  id, title, description, status, priority, is_blocked, version
  created_by: { id, name, handle }
  assignees: [{ id, name, handle }]
  labels: string[]
  created_at, updated_at, archived_at
}

interface ListTicketsResult {
  data: TicketWithDetails[]
  total: number
  skip, take
}
```

---

### 3. **tickets.repository.ts**
**Propósito:** Acceso a datos con Drizzle ORM

**Métodos:**
- `listTickets(filters)` — Query paginada con filtros dinámicos
  - Maneja filtros por status, priority, fecha, assignee, label
  - Retorna tickets + total
  
- `getTicketWithDetails(ticketId)` — Obtiene ticket completo
  - **Usa Promise.all** para obtener en paralelo:
    - Assignees (inner join con users)
    - Labels
    - Creator info
  
- `createTicket(input, userId)` — Inserta ticket nuevo
  - Status inicial: TODO
  - created_by: userId del que crea
  
- `assignUsersToTicket(ticketId, userIds)` — Agrega asignados
  - **Usa Promise.all** para insertar en paralelo
  - onConflictDoNothing() para duplicados
  
- `addLabelsToTicket(ticketId, labels)` — Agrega etiquetas
  - **Usa Promise.all** para insertar en paralelo
  - onConflictDoNothing() para duplicados
  
- `validateAssignees(userIds)` — Valida que usuarios existan

**Drizzle queries usadas:**
- `db.select().from()` — Listados
- `db.insert().values()` — Creaciones
- `inArray()`, `eq()`, `and()`, `like()` — Filtros
- `Promise.all()` — Paralelismo
- `onConflictDoNothing()` — Deduplicación

---

### 4. **tickets.service.ts**
**Propósito:** Lógica de negocio y orquestación

**Métodos con Try-Catch:**
- `listTickets(filters)` → Try-Catch:
  - Valida rango de fechas
  - Llama repository
  - **Usa Promise.all** para obtener detalles de tickets en paralelo
  - Retorna resultado o ApiError (sin exponer traza interna)
  
- `createTicket(input, userId)` → Try-Catch:
  - Valida que assignees existan
  - Crea ticket
  - **Usa Promise.all** para asignar usuarios + agregar labels en paralelo
  - Retorna ticket completo o ApiError (sin exponer traza interna)
  
- `getTicketById(ticketId)` → Try-Catch:
  - Obtiene ticket
  - Lanza NOT_FOUND si no existe

**Error handling:**
- Captura todos los errores en try-catch
- Si es ApiError, relanza directamente
- Si es otro error, log interno (console.error) y retorna INTERNAL_ERROR genérico
- **Sin exponer trazas al cliente**

---

### 5. **tickets.controller.ts**
**Propósito:** Handlers HTTP

**GET /api/tickets**
```typescript
listTicketsHandler(req, res)
1. Valida query params con Zod
2. Si falla → throw VALIDATION_ERROR
3. Llama ticketsService.listTickets()
4. Retorna 200 OK con data + total + skip + take + requestId
```

**POST /api/tickets**
```typescript
createTicketHandler(req, res)
1. Valida que req.user existe (autenticado)
2. Valida body con Zod
3. Si falla → throw VALIDATION_ERROR
4. Llama ticketsService.createTicket()
5. Retorna 201 CREATED con ticket + requestId
```

**GET /api/tickets/:id**
```typescript
getTicketHandler(req, res)
1. Valida que :id es UUID válido
2. Llama ticketsService.getTicketById()
3. Retorna 200 OK con ticket + requestId
```

**Todas usan asyncHandler:**
- Errores capturados automáticamente
- Pasados a errorMiddleware

---

### 6. **tickets.routes.ts**
**Propósito:** Registro de rutas del módulo

```typescript
GET    /   → listTicketsHandler (sin auth)
POST   /   → createTicketHandler (con authMiddleware)
GET    /:id → getTicketHandler (sin auth)
```

Todos usan `asyncHandler` para captura de errores.

---

### 7. **src/routes/index.ts** (ACTUALIZADO)
**Cambio:**
```typescript
- Antes: // router.use('/api/tickets', ticketsRoutes);
+ Ahora: router.use('/tickets', ticketsRoutes);
```

Registra rutas bajo `/api/tickets` (el `/api` se agrega en server.ts)

---

### 8. **src/app/server.ts** (ACTUALIZADO)
**Cambio:**
```typescript
+ import apiRouter from '../routes/index';
...
+ app.use('/api', apiRouter);
```

Monta el enrutador principal en `/api`.

---

## 🔄 Flujo de Paralelismo con Promise.all

### En Repository:
1. **getTicketWithDetails()** obtiene en paralelo:
   ```
   Promise.all([
     DB query assignees,
     DB query labels,
     DB query creator
   ])
   ```

2. **assignUsersToTicket()** inserta en paralelo:
   ```
   Promise.all([
     insert user1,
     insert user2,
     insert user3,
     ...
   ])
   ```

3. **addLabelsToTicket()** inserta en paralelo:
   ```
   Promise.all([
     insert label1,
     insert label2,
     ...
   ])
   ```

### En Service:
1. **createTicket()** ejecuta en paralelo:
   ```
   Promise.all([
     assignUsersToTicket(),
     addLabelsToTicket()
   ])
   ```

2. **listTickets()** obtiene detalles en paralelo:
   ```
   Promise.all([
     getTicketWithDetails(id1),
     getTicketWithDetails(id2),
     getTicketWithDetails(id3),
     ...
   ])
   ```

---

## 🛡️ Seguridad y Validación

### Validación de Entrada (Zod):
- ✅ Query params tipados (coerce para números)
- ✅ Body payload tipado
- ✅ UUIDs validados
- ✅ Strings trimmed y longitud controlada
- ✅ Enums restringidos
- ✅ Arrays validados element-by-element

### Error Handling sin Exponer Trazas:
- ✅ Try-catch en service y controller
- ✅ ApiError relanzado si es de negocio
- ✅ Otros errores logeados internamente (console.error)
- ✅ Cliente recibe solo INTERNAL_ERROR genérico
- ✅ requestId para auditoría

### Autenticación:
- ✅ POST /api/tickets requiere authMiddleware
- ✅ GET /api/tickets sin auth (listado público)
- ✅ GET /api/tickets/:id sin auth (detalle público)

---

## 📊 Flujo Completo: POST /api/tickets

```
Cliente
  ↓
Express middleware (body parser, cookies, requestId)
  ↓
asyncHandler
  ↓
createTicketHandler
  ├─ Valida req.user (authMiddleware ya pasó)
  ├─ Valida body con Zod
  ├─ Si error → throw VALIDATION_ERROR
  └─ Llama ticketsService.createTicket(input, user.id)
      ├─ Valida que assignees existen
      ├─ Crea ticket en DB
      ├─ Ejecuta en paralelo:
      │  ├─ Promise.all([assignUsers, addLabels])
      │  │  ├─ assignUsersToTicket() → Promise.all([insert, insert, ...])
      │  │  └─ addLabelsToTicket() → Promise.all([insert, insert, ...])
      │  └─ getTicketWithDetails() → Promise.all([query assignees, query labels, query creator])
      └─ Retorna TicketWithDetails
  ↓
Respuesta JSON 201
{
  "data": { ... TicketWithDetails },
  "requestId": "..."
}
  ↓
Si error:
  - ApiError → errorMiddleware convierte a JSON con statusCode
  - Otro → errorMiddleware convierte a INTERNAL_ERROR 500
  - SIN traza de stack visible
  ↓
Cliente
```

---

## ✅ Checklist de Requisitos

- [x] Lee specs.md → Entendí estructura de tickets
- [x] Lee schema.ts → Mappé tablas y relaciones a Drizzle
- [x] Lee estado_api.md → Contexto del andamiaje
- [x] Crea GET /api/tickets → ✅ Implementado
- [x] Crea POST /api/tickets → ✅ Implementado
- [x] Aplica Try-Catch → ✅ En service y controller
- [x] Sin exponer trazas al cliente → ✅ Solo INTERNAL_ERROR genérico
- [x] Usa Promise.all para asincronía paralela → ✅ 5 puntos de paralelismo
- [x] Valida entradas estrictamente → ✅ Zod en validación.ts

---

## 🧪 Cómo Probar

```bash
# Terminal 1: Start server
cd backend
npm run dev
# Debe mostrar: [Mini Jira Backend] Servidor escuchando en puerto 3000

# Terminal 2: Probar GET /api/tickets (sin auth, lista vacía)
curl "http://localhost:3000/api/tickets"
# Respuesta: { "data": [], "total": 0, "skip": 0, "take": 50, "requestId": "..." }

# Probar GET /api/tickets con filtro inválido
curl "http://localhost:3000/api/tickets?take=1000"
# Respuesta: 400 { "code": "VALIDATION_ERROR", ... }

# Probar POST /api/tickets sin auth
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"title": "Task", "priority": "HIGH"}'
# Respuesta: 401 { "code": "UNAUTHORIZED", ... }

# Probar POST /api/tickets con body inválido
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"title": "", "priority": "INVALID"}'
# Respuesta: 400 { "code": "VALIDATION_ERROR", "details": {...} }
```

---

## 📈 Próximos Pasos

1. **Implementar PATCH /api/tickets/:id** con optimistic locking (version check)
2. **Implementar POST /api/tickets/:id/archive** (soft delete)
3. **Implementar POST /api/tickets/:id/restore** (restore, solo admin)
4. **Implementar módulo de Comments** (edición Markdown, menciones)
5. **Implementar Auth module** (Google OAuth callback)

---

**Última actualización:** 29 de Abril de 2026  
**Archivos creados:** 6  
**Archivos actualizados:** 2  
**Líneas de código:** ~500 (sin contar specs)
