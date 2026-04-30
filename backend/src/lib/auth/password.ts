/**
 * Utilidades para hash y validación de contraseñas
 * Nota: OAuth es el mecanismo principal. Estos helpers se usan para hashes auxiliares si se requiere.
 */

import bcryptjs from 'bcryptjs';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcryptjs.genSalt(SALT_ROUNDS);
  return bcryptjs.hash(password, salt);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcryptjs.compare(password, hash);
};
