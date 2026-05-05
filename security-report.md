# Security Audit Report (OWASP)

## Alcance auditado
- No se encontraron rutas literales llamadas @app/api/ ni archivo literal @config.ts en este workspace.
- Se auditó la superficie equivalente de API y configuración existente en:
  - [stitch_mini_jira_kanban_dashboard/src/lib/api.ts](stitch_mini_jira_kanban_dashboard/src/lib/api.ts)
  - [stitch_mini_jira_kanban_dashboard/src/features/board/api/board.api.ts](stitch_mini_jira_kanban_dashboard/src/features/board/api/board.api.ts)
  - [backend/src/http/api-error.ts](backend/src/http/api-error.ts)
  - [backend/src/lib/http/api-error.ts](backend/src/lib/http/api-error.ts)
  - [backend/drizzle.config.ts](backend/drizzle.config.ts)
  - [stitch_mini_jira_kanban_dashboard/vite.config.ts](stitch_mini_jira_kanban_dashboard/vite.config.ts)
  - [stitch_mini_jira_kanban_dashboard/tailwind.config.ts](stitch_mini_jira_kanban_dashboard/tailwind.config.ts)

---

## CRITICO

No se identificaron hallazgos de severidad CRITICO dentro del alcance auditado.

---

## ALTO

### 1) Credenciales por defecto embebidas en configuración de DB
- Categoria OWASP: A05 Security Misconfiguration
- Ubicacion: [backend/drizzle.config.ts](backend/drizzle.config.ts#L8)
- Evidencia:
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/mini_jira'
- Impacto real:
  Si DATABASE_URL no esta definido en un entorno de despliegue, la aplicacion usara una credencial hardcodeada predecible. Esto facilita compromiso de base de datos por uso de secretos debiles o conocidos, aumenta riesgo de acceso no autorizado y fuga de datos.

### 2) Sesion basada en cookies sin señal visible de proteccion anti-CSRF en cliente API
- Categoria OWASP: A01 Broken Access Control
- Ubicacion: [stitch_mini_jira_kanban_dashboard/src/lib/api.ts](stitch_mini_jira_kanban_dashboard/src/lib/api.ts#L62), [stitch_mini_jira_kanban_dashboard/src/lib/api.ts](stitch_mini_jira_kanban_dashboard/src/lib/api.ts#L64), [stitch_mini_jira_kanban_dashboard/src/lib/api.ts](stitch_mini_jira_kanban_dashboard/src/lib/api.ts#L410)
- Evidencia:
  credentials: 'include'
  'Content-Type': 'application/json'
- Impacto real:
  Todas las operaciones autenticadas usan cookies automaticamente. En ausencia de un token anti-CSRF (header dedicado, doble submit cookie o validacion de origen robusta en backend), un sitio malicioso puede forzar acciones de usuario autenticado (creacion/edicion/archivado), comprometiendo integridad del sistema.

---

## MEDIO

### 3) Fallback de API en HTTP sin cifrado
- Categoria OWASP: A02 Cryptographic Failures
- Ubicacion: [stitch_mini_jira_kanban_dashboard/src/lib/api.ts](stitch_mini_jira_kanban_dashboard/src/lib/api.ts#L3)
- Evidencia:
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
- Impacto real:
  El fallback en texto plano habilita trafico sin TLS cuando la variable no esta definida. En entornos mal configurados o redes no confiables, puede exponer cookies/sesion y payloads a sniffing o manipulacion (MITM).

---

## BAJO

### 4) Propagacion de detalles de error de backend hacia cliente
- Categoria OWASP: A05 Security Misconfiguration
- Ubicacion: [stitch_mini_jira_kanban_dashboard/src/lib/api.ts](stitch_mini_jira_kanban_dashboard/src/lib/api.ts#L25)
- Evidencia:
  this.details = payload.details
- Impacto real:
  Si el backend devuelve detalles internos, el cliente los conserva y potencialmente los muestra o registra. Esto incrementa riesgo de divulgacion de estructura interna, validaciones sensibles o metadatos operativos utiles para un atacante.

### 5) Modo verbose habilitado en tooling de migraciones
- Categoria OWASP: A05 Security Misconfiguration
- Ubicacion: [backend/drizzle.config.ts](backend/drizzle.config.ts#L10)
- Evidencia:
  verbose: true
- Impacto real:
  Puede ampliar superficie de exposicion de informacion en logs de CI/CD o pipelines compartidos (estructura de DB, queries o metadata operativa), facilitando reconocimiento para ataques dirigidos.

---

## Resumen ejecutivo
- Total hallazgos: 5
- Critico: 0
- Alto: 2
- Medio: 1
- Bajo: 2

Riesgo dominante: configuracion insegura y protecciones de sesion incompletas para operaciones state-changing.
