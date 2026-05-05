# Prompt de correccion para segundo agente

Actua como Senior Security Engineer con enfoque OWASP.

Objetivo:
Aplicar correcciones de seguridad en orden de severidad, basadas en el reporte [security-report.md](security-report.md), sin introducir regresiones funcionales.

Reglas:
1. Corregir en este orden: ALTO, MEDIO, BAJO.
2. Mantener compatibilidad con el flujo actual de login por cookie.
3. No eliminar funcionalidad existente (board, projects, dashboard, export CSV).
4. Al final, ejecutar build de backend y frontend y reportar resultados.
5. Entregar diff resumido con archivos y lineas tocadas.

---

## Tareas ALTO

### ALTO-1: eliminar credencial por defecto embebida
- Archivo objetivo: [backend/drizzle.config.ts](backend/drizzle.config.ts)
- Cambios requeridos:
  - Eliminar fallback hardcodeado de DATABASE_URL.
  - Forzar fallo explicito si DATABASE_URL no existe.
  - Mensaje de error claro para entorno local y CI.
- Criterio de aceptacion:
  - No existe string de conexion con usuario/password en codigo.
  - El proceso falla temprano con error controlado cuando falta variable.

### ALTO-2: incorporar mitigacion CSRF para peticiones autenticadas por cookie
- Archivos objetivo minimo:
  - [backend/src/app/server.ts](backend/src/app/server.ts)
  - [backend/src/middlewares](backend/src/middlewares)
  - [stitch_mini_jira_kanban_dashboard/src/lib/api.ts](stitch_mini_jira_kanban_dashboard/src/lib/api.ts)
- Cambios requeridos:
  - Implementar estrategia CSRF (recomendado: double-submit cookie o token por sesion).
  - Exigir validacion CSRF para metodos state-changing (POST/PATCH/DELETE).
  - En frontend, adjuntar header CSRF en mutaciones.
  - Mantener GET sin ruptura.
- Criterio de aceptacion:
  - Mutaciones sin token valido responden 403.
  - Mutaciones con token valido funcionan.
  - Login/sesion no se rompe.

---

## Tareas MEDIO

### MEDIO-1: evitar fallback HTTP inseguro
- Archivo objetivo: [stitch_mini_jira_kanban_dashboard/src/lib/api.ts](stitch_mini_jira_kanban_dashboard/src/lib/api.ts)
- Cambios requeridos:
  - Evitar fallback silencioso a http://localhost:3000 en builds no desarrollo.
  - En desarrollo, permitir localhost solo bajo entorno explicito.
  - En produccion, exigir URL HTTPS valida.
- Criterio de aceptacion:
  - En produccion, ausencia de variable de API provoca error explicito.
  - No hay trafico HTTP no cifrado por configuracion accidental.

---

## Tareas BAJO

### BAJO-1: reducir exposicion de detalles internos de error en cliente
- Archivo objetivo: [stitch_mini_jira_kanban_dashboard/src/lib/api.ts](stitch_mini_jira_kanban_dashboard/src/lib/api.ts)
- Cambios requeridos:
  - Sanitizar payload.details antes de propagarlo.
  - Mostrar mensajes de error seguros para usuario final.
- Criterio de aceptacion:
  - No se exponen detalles internos sensibles en UI.

### BAJO-2: desactivar verbose en config de migraciones por defecto
- Archivo objetivo: [backend/drizzle.config.ts](backend/drizzle.config.ts)
- Cambios requeridos:
  - verbose condicionado por entorno (ejemplo: solo local debug).
- Criterio de aceptacion:
  - En CI/produccion no se generan logs verbosos por defecto.

---

## Validacion final obligatoria
1. Ejecutar build backend y frontend.
2. Verificar que login, create/update/archive ticket, drag and drop, dashboard y export CSV siguen operativos.
3. Adjuntar resumen final con:
  - Hallazgo mitigado -> archivo -> tecnica aplicada.
  - Riesgos residuales.
