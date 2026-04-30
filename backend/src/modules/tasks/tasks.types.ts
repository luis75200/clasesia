export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TaskAuthor {
  id: string;
  name: string;
  handle: string;
}

export interface TaskAssignee {
  id: string;
  name: string;
  handle: string;
}

export interface TaskDetails {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  project_id: string | null;
  is_blocked: boolean;
  version: number;
  created_by: TaskAuthor;
  assignees: TaskAssignee[];
  labels: string[];
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface ListTasksFilters {
  skip: number;
  take: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: string;
  label?: string;
  from_date?: string;
  to_date?: string;
}

export interface ListTasksResult {
  data: TaskDetails[];
  total: number;
  skip: number;
  take: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  priority: TaskPriority;
  project_id?: string | null;
  assignees: string[];
  labels: string[];
}

export interface AssignProjectInput {
  project_id: string;
}
