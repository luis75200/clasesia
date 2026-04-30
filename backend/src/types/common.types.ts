/**
 * Tipos compartidos de la aplicación
 */

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  requestId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  take: number;
}

export interface CreateResourceResponse<T> {
  data: T;
}

export interface UpdateResourceResponse<T> {
  data: T;
}

export interface DeleteResourceResponse {
  success: boolean;
}

/**
 * Tipos de dominio extendidos
 */

export interface TicketWithRelations {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  is_blocked: boolean;
  version: number;
  created_by: {
    id: string;
    name: string;
    handle: string;
  };
  assignees: Array<{
    id: string;
    name: string;
    handle: string;
  }>;
  labels: string[];
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface CommentWithRelations {
  id: string;
  ticket_id: string;
  author: {
    id: string;
    name: string;
    handle: string;
  };
  body: string;
  mentions: string[];
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}
