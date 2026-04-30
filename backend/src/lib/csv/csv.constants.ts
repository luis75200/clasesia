/**
 * Constantes para exportación CSV
 */

export const CSV_HEADERS = [
  'ticket_id',
  'title',
  'status',
  'priority',
  'assignees',
  'labels',
  'created_by',
  'created_at',
  'closed_at',
  'archived',
] as const;

export const CSV_MIME_TYPE = 'text/csv; charset=utf-8';

export const formatCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // Si contiene coma, salto de línea o comilla, envolver en comillas y escapar
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
};

export const generateCsvRow = (values: unknown[]): string => {
  return values.map(formatCsvValue).join(',');
};

export const getCsvFileName = (yearMonth: string): string => {
  return `minijira-metrics-${yearMonth}.csv`;
};
