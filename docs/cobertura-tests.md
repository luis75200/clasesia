# Auditoria de Cobertura de Pruebas

## Alcance y evidencia usada
- Backlog Gherkin auditado: [backlog.md](backlog.md)
- Carpeta objetivo solicitada: `apps/api` (no existe en este workspace)
- Equivalente auditado: [backend](backend)
- Resultado de inventario en backend (excluyendo `node_modules` y `dist`): no se encontraron archivos `*.test.ts`
- Resultado de búsqueda de bloques `describe|it(` en tests propios: sin coincidencias

## 1) Cobertura de historias del backlog

| Historia / Edge Case | Estado cobertura | Evidencia |
|---|---|---|
| Historia 1 — Acceso al sistema con cuenta corporativa | ❌ sin test | No hay `*.test.ts` en [backend](backend) |
| Historia 2 — Gestión de tickets en el tablero Kanban | ❌ sin test | No hay `*.test.ts` en [backend](backend) |
| Historia 3 — Edición segura ante cambios concurrentes | ❌ sin test | No hay `*.test.ts` en [backend](backend) |
| EC-1 — Comentario archivado antes del envío (notificaciones) | ❌ sin test | No hay `*.test.ts` en [backend](backend) |
| EC-2 — Exportación CSV con datos inválidos o vacíos | ❌ sin test | No hay `*.test.ts` en [backend](backend) |

## 2) Edge cases del Gherkin sin test

### EC-1 — Cancelación de notificación por comentario archivado
- Scenario: Notificación enviada cuando el comentario sigue activo
- Scenario: Notificación cancelada porque el comentario fue archivado antes del envío
- Scenario: Mención con @handle en un comentario archivado antes del envío

### EC-2 — Exportación de métricas a CSV
- Scenario: Exportar con filtros que no producen resultados
- Scenario: Exportar con rango de fechas donde "desde" es posterior a "hasta"
- Scenario: Exportar con sesión expirada
- Scenario: Exportar un volumen grande de tickets sin error de memoria

## 3) Deuda tecnica de testing (top 3 por criticidad de negocio)

1. **Sin suite automatizada para autenticación y autorización (crítico)**
   Impacto: riesgo alto de regresión en acceso, roles y seguridad (401/403), bloqueando operación diaria del equipo.

2. **Sin pruebas de concurrencia en tickets (crítico)**
   Impacto: posibilidad de sobrescribir cambios en escenarios reales multiusuario; afecta trazabilidad y confianza del producto.

3. **Sin pruebas de edge cases de métricas/notificaciones (alto)**
   Impacto: exportes incorrectos o notificaciones erróneas (incluyendo casos archivados) afectan decisiones operativas y experiencia de usuario.

## Resumen ejecutivo
- Cobertura observable sobre backlog: **0%** (no hay tests de backend propios detectados).
- Riesgo actual: **alto** para salida a producción sin red de seguridad de pruebas automatizadas.
