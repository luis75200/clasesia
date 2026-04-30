# Mini Jira Backend

Backend REST API para Mini Jira v1.

## Setup

### Requisitos

- Node.js 20 LTS
- PostgreSQL 16
- npm 10+

### Instalación

```bash
npm install
```

### Configuración

1. Copia `.env.example` a `.env` y completa las variables:

```bash
cp .env.example .env
```

2. Crea la base de datos PostgreSQL.

3. Ejecuta las migraciones de Drizzle:

```bash
npm run db:push
```

### Desarrollo

```bash
npm run dev
```

El servidor arranca en `http://localhost:3000`.

### Build y producción

```bash
npm run build
npm start
```

## Estructura

```
src/
  app/              - Configuración de Express
  db/               - Drizzle ORM y esquema
  modules/          - Módulos de dominio (auth, users, tickets, etc.)
  routes/           - Enrutamiento centralizado
  middlewares/      - Middlewares globales
  lib/              - Utilidades y helpers
  types/            - Tipos de TypeScript
```

## Documentación

Ver [BACKEND-SPECS.md](../BACKEND-SPECS.md) para especificación completa de endpoints y dominio.

## Notas

- Las migraciones de Drizzle no se ejecutan automáticamente. Ejecuta `npm run db:push` tras cambios de esquema.
- Las rutas específicas de módulos no están implementadas en la estructura base. Se agregan según necesidad.
- Las notificaciones por email usan Resend o SMTP según configuración.
