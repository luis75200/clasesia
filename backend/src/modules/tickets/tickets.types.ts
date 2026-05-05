/**
 * Tipos específicos del módulo de tickets
 */

export interface TicketWithDetails {
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

export interface CreateTicketInput {
  title: string;
  description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  assignees?: string[];
  labels?: string[];
}

export interface ListTicketsFilters {
  skip: number;
  take: number;
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  assignee_id?: string;
  label?: string;
  from_date?: string;
  to_date?: string;
}

export interface ListTicketsResult {
  data: TicketWithDetails[];
  total: number;
  skip: number;
  take: number;
}

export interface ChangeTicketStatusInput {
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  version: number;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string | null;
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  is_blocked?: boolean;
  version: number;
}
