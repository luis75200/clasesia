/**
 * Clase base de error personalizado para la API
 */

export interface ApiErrorOptions {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
  cause?: Error;
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly cause?: Error;

  constructor(options: ApiErrorOptions) {
    super(options.message);
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.details = options.details;
    this.cause = options.cause;
    this.name = 'ApiError';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * Errores predefinidos frecuentes
 */

export const Errors = {
  UNAUTHORIZED: (message = 'Sesión inválida o ausente') =>
    new ApiError({
      code: 'UNAUTHORIZED',
      message,
      statusCode: 401,
    }),

  FORBIDDEN: (message = 'Sin permisos para realizar esta acción') =>
    new ApiError({
      code: 'FORBIDDEN',
      message,
      statusCode: 403,
    }),

  NOT_FOUND: (resource: string) =>
    new ApiError({
      code: 'NOT_FOUND',
      message: `${resource} no encontrado`,
      statusCode: 404,
    }),

  BAD_REQUEST: (message: string, details?: Record<string, unknown>) =>
    new ApiError({
      code: 'BAD_REQUEST',
      message,
      statusCode: 400,
      details,
    }),

  CONFLICT: (message = 'Conflicto de versión. El recurso fue modificado.') =>
    new ApiError({
      code: 'CONFLICT',
      message,
      statusCode: 409,
    }),

  INTERNAL_ERROR: (message = 'Error interno del servidor', cause?: Error) =>
    new ApiError({
      code: 'INTERNAL_ERROR',
      message,
      statusCode: 500,
      cause,
    }),

  VALIDATION_ERROR: (details: Record<string, unknown>) =>
    new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'Validación fallida',
      statusCode: 400,
      details,
    }),

  INVALID_STATE: (message = 'Estado inválido para esta operación') =>
    new ApiError({
      code: 'INVALID_STATE',
      message,
      statusCode: 400,
    }),

  OAUTH_ERROR: (message: string) =>
    new ApiError({
      code: 'OAUTH_ERROR',
      message,
      statusCode: 400,
    }),

  ACCOUNT_NOT_PROVISIONED: () =>
    new ApiError({
      code: 'ACCOUNT_NOT_PROVISIONED',
      message: 'Tu cuenta no está aprovisionada. Contacta al administrador.',
      statusCode: 403,
    }),
} as const;
