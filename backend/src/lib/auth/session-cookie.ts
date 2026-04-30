/**
 * Configuración de cookies de sesión
 */

import { CONSTANTS } from '../../app/constants.js';

export const getSessionCookieOptions = () => {
  return {
    ...CONSTANTS.SESSION_COOKIE_OPTIONS,
  };
};
