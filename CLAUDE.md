# CLAUDE.md

Reglas globales para cualquier agente o desarrollador trabajando en Mini Jira.

## 1) Prioridad de fuentes

1. `backlog.md` define comportamiento funcional (historias y edge cases).
2. `design.md` (documento de diseño) define lenguaje visual y reglas UI.
3. Si hay conflicto, no asumir: escalar la duda antes de implementar.

## 2) Regla estricta de color (obligatoria)

**NUNCA inventar colores.**  
Se permite usar **solo** los colores definidos en `design.md`, implementados en Tailwind mediante tokens.

### 2.1 Paleta permitida (hex exacto)

- `surface`: `#f9f9fb`
- `surface_container_low`: `#f2f4f6`
- `surface_container_lowest`: `#ffffff`
- `surface_container_high`: `#e4e9ee`
- `surface_container_highest`: `#dde3e9`
- `primary`: `#005bbf`
- `primary_dim`: `#0050a8`
- `outline_variant`: `#acb3b8`
- `tertiary_container`: `#69f6b8`
- `on_tertiary_fixed`: `#00452d`
- `error_container`: `#fe8983`
- `on_error_container`: `#752121`
- `primary_container`: `#d7e2ff`
- `on_primary_fixed`: `#003d84`
- `inverse_surface`: `#0c0e10`

### 2.2 Regla Tailwind

- Usar clases basadas en tokens de tema (`bg-surface`, `text-primary`, etc.).
- Prohibido usar colores ad-hoc (`text-[#...]`, `bg-blue-...`, `border-gray-...`) fuera de esta paleta.
- Si falta un token, primero agregarlo al tema con uno de los valores permitidos; no crear uno nuevo sin aprobación explícita.

## 3) Reglas de diseño no negociables

- Prohibido usar bordes de 1px para separar secciones/listas ("No-Line Rule").
- Separación visual por capas de superficie y espaciado, no por líneas divisorias.
- Sombras flotantes: usar solo `0px 12px 32px rgba(12, 14, 16, 0.04)`.
- Si accesibilidad exige borde, usar `outline_variant` al 15% de opacidad (ghost border).
- Botón primario con gradiente `primary -> primary_dim` (145deg).
- No usar negro puro `#000000`; usar `inverse_surface`.

## 4) Reglas funcionales derivadas del backlog

- Autenticación corporativa OAuth 2.0; sin contraseña local.
- Al expirar sesión, redirigir a login y preservar datos locales del flujo.
- Ticket nuevo válido requiere título y prioridad.
- Flujo de estado del ticket debe respetar tablero Kanban definido.
- Flag `Bloqueado` no cambia la columna del ticket.
- "Eliminar ticket" equivale a archivado (soft delete).
- `member` no puede editar tickets ajenos.
- Conflicto concurrente (optimistic locking): notificar conflicto y mantener cambios locales visibles.
- Export CSV:
  - con dataset vacío: botón deshabilitado + tooltip.
  - rango inválido: manejar `400` con mensaje claro.
  - sesión expirada: `401` y redirección a login.
  - descarga progresiva para grandes volúmenes.
- Comentario archivado antes del despacho: cancelar notificación sin error visible.

## 5) Reglas de implementación

- No asumir defaults no documentados.
- Antes de codificar features nuevas, validar aceptación contra escenarios Gherkin del backlog.
- Toda decisión de UX/estado debe poder trazarse a backlog o design system.
- Cambios visuales deben mantener estética "Digital Curator": espacio negativo, asimetría intencional, densidad baja.

