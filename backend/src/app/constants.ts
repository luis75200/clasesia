/**
 * Constantes globales de la aplicación
 */

export const CONSTANTS = {
  SESSION_COOKIE_NAME: 'minijira-session',
  SESSION_COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
  },
  
  PAGINATION_DEFAULTS: {
    skip: 0,
    take: 50,
  },
  
  PAGINATION_LIMITS: {
    maxTake: 500,
    maxSkip: 1000000,
  },

  TICKET_TITLE_MAX_LENGTH: 120,
  LABEL_MAX_LENGTH: 100,
  
  EMAIL_NOTIFICATION_DELAY_MS: 5000,
  EMAIL_NOTIFICATION_MAX_RETRIES: 3,
  
  CSV_CHUNK_SIZE: 1000,
  
  REQUEST_ID_HEADER: 'x-request-id',
  
  TIMEZONE: 'UTC',
} as const;
