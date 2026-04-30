/**
 * Utilidades para manejo de strings
 */

export const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const extractMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex) || [];
  return matches.map(m => m.slice(1)); // Remove @
};

export const truncate = (text: string, length: number, suffix = '...') => {
  if (text.length <= length) return text;
  return text.slice(0, length - suffix.length) + suffix;
};

export const capitalize = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const camelToSnake = (text: string) => {
  return text.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

export const snakeToCamel = (text: string) => {
  return text.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};
