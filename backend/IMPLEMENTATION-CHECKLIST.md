# Backend Implementation Checklist

## ✅ Completado (Andamiaje base)

### Configuración
- [x] `package.json` con dependencias mínimas (~180MB en node_modules)
- [x] `tsconfig.json` configurado para ES2020 + ESM
- [x] `drizzle.config.ts` listo para migraciones
- [x] `.env.example` con variables requeridas
- [x] `vercel.json` configurado para deployment serverless
- [x] `README.md` con instrucciones de setup

### Estructura de carpetas
- [x] `src/app/` - Configuración de Express y constantes
- [x] `src/db/` - Cliente Drizzle y esquema completo
- [x] `src/modules/` - Carpetas para cada dominio (auth, users, tickets, etc.)
- [x] `src/routes/` - Enrutador centralizado
- [x] `src/middlewares/` - Middlewares globales (error, auth, request-id)
- [x] `src/lib/` - Utilidades (http, auth, csv, utils)
- [x] `src/types/` - Tipos TypeScript compartidos

### Esquema de base de datos
- [x] `src/db/schema.ts` - Drizzle ORM completo con:
  - [x] 8 tablas: users, auth_sessions, oauth_states, tickets, ticket_assignees, ticket_labels, comments, comment_mentions, email_notifications
  - [x] 6 enums: user_role, ticket_status, ticket_priority, session_status, notification_type, notification_status
  - [x] Todas las relaciones definidas
  - [x] Tipos exportados (`User`, `Ticket`, `Comment`, etc.)
  - [x] Índices estratégicos para queries frecuentes
  - [x] Constraints y checks de negocio

### Utilidades e inicializadores
- [x] `src/app/env.ts` - Validación Zod de variables de entorno
- [x] `src/app/constants.ts` - Constantes globales de negocio
- [x] `src/db/client.ts` - Cliente Drizzle conectado a PostgreSQL
- [x] `src/lib/http/api-error.ts` - Clase base de errores con predefinidos
- [x] `src/lib/auth/password.ts` - Hashing con bcryptjs
- [x] `src/lib/auth/session-cookie.ts` - Configuración de cookies HttpOnly
- [x] `src/lib/csv/csv.constants.ts` - Constantes y utilidades para RFC 4180
- [x] `src/lib/utils/ids.ts` - Generación de UUIDs
- [x] `src/lib/utils/dates.ts` - Utilidades de fecha/hora
- [x] `src/lib/utils/strings.ts` - Utilidades de string (slug, mentions, etc.)

### Middlewares
- [x] `src/middlewares/error.middleware.ts` - Manejo centralizado de errores + asyncHandler
- [x] `src/middlewares/request-id.middleware.ts` - Asignación de ID único por request
- [x] `src/middlewares/auth.middleware.ts` - Validación de sesión y roles (admin/member)

### Servidor Express
- [x] `src/app/server.ts` - Configuración base con CORS, body parser, cookies, health check
- [x] `src/routes/index.ts` - Enrutador principal vacío (listo para módulos)
- [x] `src/index.ts` - Punto de entrada que crea y arranca el servidor

### Tipos
- [x] `src/types/express.d.ts` - Extensiones de tipos de Express (user, sessionId, requestId)
- [x] `src/types/common.types.ts` - Tipos de API y dominio compartidos

### Documentación
- [x] `BACKEND-SPECS.md` - Especificación completa de endpoints y dominio
- [x] `database-schema.yaml` - Esquema relacional en YAML
- [x] `backend/README.md` - Instrucciones de setup local

---

## ⏳ Próximas fases (No bloqueante para deploy)

### Fase 1: Módulos de dominio
- [ ] `src/modules/auth/` - Login OAuth, callback, logout, validación de sesión
- [ ] `src/modules/users/` - CRUD de usuarios, aprovisionamiento
- [ ] `src/modules/tickets/` - CRUD, cambio de estado, archivado/restore, optimistic locking
- [ ] `src/modules/comments/` - CRUD edición, mención de handles
- [ ] `src/modules/notifications/` - Cola de emails, despacho, cancelación
- [ ] `src/modules/metrics/` - Agregados de dashboard
- [ ] `src/modules/archived/` - Listado y restauración admin

### Fase 2: Validaciones e integraciones
- [ ] Esquemas Zod por módulo
- [ ] Integración Google OAuth
- [ ] Integración Resend/SMTP
- [ ] Queue worker para notificaciones (opcional en v1)

### Fase 3: Testing y observabilidad
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Logs estructurados
- [ ] Métricas de APM (opcional en v1)

---

## 🚀 Primeros pasos para hacer funcionar el backend

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env
cp .env.example .env
# Completar: DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc.

# 3. Crear base de datos PostgreSQL
# createdb mini_jira

# 4. Aplicar migraciones
npm run db:push

# 5. Verificar que el servidor arranca
npm run dev
# Debe mostrar: [Mini Jira Backend] Servidor escuchando en puerto 3000

# 6. Probar health check
curl http://localhost:3000/health
# Debe devolver: { "status": "ok", "timestamp": "...", "requestId": "..." }
```

---

## 📦 Tamaño de dependencias (para Vercel)

Bundle actual estimado:
- `express`: ~50KB gzip
- `drizzle-orm`: ~40KB gzip
- `pg`: ~60KB gzip
- `zod`: ~30KB gzip
- `uuid`: ~5KB gzip
- `bcryptjs`: ~30KB gzip
- Otros: ~15KB gzip

**Total estimado: ~230KB gzip** (dentro del límite de Vercel)

---

## 📋 Puntos de entrada para implementación de módulos

Cada módulo debe tener esta estructura:

```
src/modules/{nombre}/
  {nombre}.controller.ts      # Manejadores HTTP (llamará a asyncHandler)
  {nombre}.service.ts         # Lógica de negocio
  {nombre}.repository.ts      # Acceso a DB con Drizzle
  {nombre}.validation.ts      # Esquemas Zod
  {nombre}.types.ts           # Tipos específicos del módulo
```

**Ejemplo** (auth.controller.ts):
```typescript
import { Request, Response } from 'express';
import { asyncHandler } from '../../middlewares/error.middleware';

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  // TODO: Implementar OAuth redirect
  // Retorna 302 a Google
});
```

Cada handler automáticamente:
- Captura errores y los pasa a errorMiddleware
- Tiene acceso a req.user, req.requestId, req.sessionId
- Puede lanzar instancias de ApiError

---

## ✋ Bloqueos o dudas

Si durante la implementación de módulos encuentras:

1. **"¿Cómo valido entrada?"** → Usa `Zod` en `{nombre}.validation.ts` y llama desde el controller
2. **"¿Cómo accedo a la DB?"** → Importa `db` de `src/db/client.ts` y usa queries Drizzle
3. **"¿Cómo manejo errores?"** → Lanza `Errors.{ERROR_TYPE}()` desde `src/lib/http/api-error.ts`
4. **"¿Cómo agrego auth?"** → Usa `authMiddleware` o `adminMiddleware` en las rutas
5. **"¿Cómo envío emails?"** → Implementa en `notifications.service.ts` usando Resend o SMTP

---

**Última actualización:** 2026-04-29  
**Backend version:** 1.0.0  
**Stack:** Node.js 20 + Express 5 + Drizzle + PostgreSQL 16  
**Deployment target:** Vercel Serverless Functions
