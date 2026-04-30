/**
 * Utilidades para manejo de fechas
 */

export const formatISO = (date: Date = new Date()) => {
  return date.toISOString();
};

export const parseISO = (dateString: string) => {
  return new Date(dateString);
};

export const isValidDateRange = (from: string, to: string) => {
  const fromDate = parseISO(from);
  const toDate = parseISO(to);
  return fromDate <= toDate;
};

export const getDayStart = (date: Date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getDayEnd = (date: Date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getMonthStart = (date: Date = new Date()) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getMonthEnd = (date: Date = new Date()) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const formatMonthYear = (date: Date = new Date()) => {
  return date.toISOString().substring(0, 7);
};
