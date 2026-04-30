/**
 * Utilidades para generación de IDs
 */

import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

const NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

export const generateId = () => uuidv4();

export const generateIdFromHandle = (handle: string) => 
  uuidv5(handle, NAMESPACE);
