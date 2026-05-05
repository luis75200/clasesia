import type { ColumnId, TaskPriority } from '../features/board/types/board.types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

interface ApiErrorPayload {
  code?: string
  message?: string
  details?: Record<string, unknown>
  requestId?: string
}

export class ApiClientError extends Error {
  status: number
  code?: string
  details?: Record<string, unknown>
  requestId?: string

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message ?? 'Request failed')
    this.name = 'ApiClientError'
    this.status = status
    this.code = payload.code
    this.details = payload.details
    this.requestId = payload.requestId
  }
}

export interface AuthUser {
  id: string
  email: string
  name: string
  handle: string
  role: 'admin' | 'member'
  is_active: boolean
  avatar_url?: string | null
  last_login_at?: string | null
}

export interface AuthSessionResponse {
  data: {
    user: AuthUser
  }
  requestId?: string
}

export interface LoginInput {
  email: string
  name?: string
}

interface ApiRequestOptions {
  method?: HttpMethod
  body?: unknown
  signal?: AbortSignal
}

async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  })

  if (!response.ok) {
    let payload: ApiErrorPayload = {}
    try {
      payload = (await response.json()) as ApiErrorPayload
    } catch {
      payload = { message: `HTTP ${response.status}` }
    }
    throw new ApiClientError(response.status, payload)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export type ApiTaskStatus = ColumnId

export interface ApiTaskAssignee {
  id: string
  name: string
  handle?: string
  avatarUrl?: string
}

export interface ApiTask {
  id: string
  title: string
  description: string | null
  status: ApiTaskStatus
  priority: TaskPriority
  is_blocked: boolean
  version: number
  created_by: {
    id: string
    name: string
    handle: string
  }
  labels: string[]
  assignees: ApiTaskAssignee[]
  updated_at: string
}

export interface ListTasksQuery {
  skip?: number
  take?: number
  status?: ApiTaskStatus
  priority?: TaskPriority
  assignee_id?: string
  label?: string
  from_date?: string
  to_date?: string
}

export interface ListTasksResponse {
  data: ApiTask[]
  total: number
  skip: number
  take: number
  requestId?: string
}

export interface CreateTaskInput {
  title: string
  description?: string | null
  priority: TaskPriority
  assignees?: string[]
  labels?: string[]
}

export interface CreateTaskResponse {
  data: ApiTask
  requestId?: string
}

export interface ChangeTaskStatusInput {
  status: ApiTaskStatus
  version: number
}

export interface ChangeTaskStatusResponse {
  data: ApiTask
  requestId?: string
}

export interface UpdateTicketInput {
  title?: string
  description?: string | null
  status?: ApiTaskStatus
  priority?: TaskPriority
  is_blocked?: boolean
  version: number
}

export interface TicketMutationResponse {
  data: ApiTask
  requestId?: string
}

function toQueryString(query: ListTasksQuery = {}): string {
  const params = new URLSearchParams()

  if (typeof query.skip === 'number') params.set('skip', String(query.skip))
  if (typeof query.take === 'number') params.set('take', String(query.take))
  if (query.status) params.set('status', query.status)
  if (query.priority) params.set('priority', query.priority)
  if (query.assignee_id) params.set('assignee_id', query.assignee_id)
  if (query.label) params.set('label', query.label)
  if (query.from_date) params.set('from_date', query.from_date)
  if (query.to_date) params.set('to_date', query.to_date)

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export async function getTasks(query: ListTasksQuery = {}, signal?: AbortSignal): Promise<ListTasksResponse> {
  return apiRequest<ListTasksResponse>(`/api/tasks${toQueryString(query)}`, {
    method: 'GET',
    signal,
  })
}

export async function createTask(input: CreateTaskInput, signal?: AbortSignal): Promise<CreateTaskResponse> {
  return apiRequest<CreateTaskResponse>('/api/tasks', {
    method: 'POST',
    body: {
      ...input,
      assignees: input.assignees ?? [],
      labels: input.labels ?? [],
    },
    signal,
  })
}

// P0 para mover tickets en Kanban (optimistic UI): backend contract usa /api/tickets/:id/change-status
export async function changeTaskStatus(
  taskId: string,
  input: ChangeTaskStatusInput,
  signal?: AbortSignal,
): Promise<ChangeTaskStatusResponse> {
  return apiRequest<ChangeTaskStatusResponse>(`/api/tickets/${taskId}/change-status`, {
    method: 'POST',
    body: input,
    signal,
  })
}

export async function updateTicket(
  ticketId: string,
  input: UpdateTicketInput,
  signal?: AbortSignal,
): Promise<TicketMutationResponse> {
  return apiRequest<TicketMutationResponse>(`/api/tickets/${ticketId}`, {
    method: 'PATCH',
    body: input,
    signal,
  })
}

export async function archiveTicket(ticketId: string, signal?: AbortSignal): Promise<{ data: { success: boolean }; requestId?: string }> {
  return apiRequest<{ data: { success: boolean }; requestId?: string }>(`/api/tickets/${ticketId}/archive`, {
    method: 'POST',
    signal,
  })
}

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED'

export interface ApiProjectOwner {
  id: string
  name: string
  handle: string
}

export interface ApiProject {
  id: string
  name: string
  key: string
  description: string | null
  status: ProjectStatus
  owner: ApiProjectOwner
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface ListProjectsQuery {
  skip?: number
  take?: number
  status?: ProjectStatus
  search?: string
}

export interface ListProjectsResponse {
  data: ApiProject[]
  total: number
  skip: number
  take: number
  requestId?: string
}

export interface ProjectResponse {
  data: ApiProject
  requestId?: string
}

export interface CreateProjectInput {
  name: string
  key: string
  description?: string | null
}

export interface UpdateProjectInput {
  name?: string
  key?: string
  description?: string | null
}

function toProjectsQueryString(query: ListProjectsQuery = {}): string {
  const params = new URLSearchParams()

  if (typeof query.skip === 'number') params.set('skip', String(query.skip))
  if (typeof query.take === 'number') params.set('take', String(query.take))
  if (query.status) params.set('status', query.status)
  if (query.search) params.set('search', query.search)

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export async function getProjects(query: ListProjectsQuery = {}, signal?: AbortSignal): Promise<ListProjectsResponse> {
  return apiRequest<ListProjectsResponse>(`/api/projects${toProjectsQueryString(query)}`, {
    method: 'GET',
    signal,
  })
}

export async function createProject(input: CreateProjectInput, signal?: AbortSignal): Promise<ProjectResponse> {
  return apiRequest<ProjectResponse>('/api/projects', {
    method: 'POST',
    body: input,
    signal,
  })
}

export async function updateProject(projectId: string, input: UpdateProjectInput, signal?: AbortSignal): Promise<ProjectResponse> {
  return apiRequest<ProjectResponse>(`/api/projects/${projectId}`, {
    method: 'PATCH',
    body: input,
    signal,
  })
}

export async function archiveProject(projectId: string, signal?: AbortSignal): Promise<ProjectResponse> {
  return apiRequest<ProjectResponse>(`/api/projects/${projectId}/archive`, {
    method: 'POST',
    signal,
  })
}

export async function restoreProject(projectId: string, signal?: AbortSignal): Promise<ProjectResponse> {
  return apiRequest<ProjectResponse>(`/api/projects/${projectId}/restore`, {
    method: 'POST',
    signal,
  })
}

export async function assignTaskToProject(taskId: string, projectId: string, signal?: AbortSignal): Promise<ChangeTaskStatusResponse> {
  return apiRequest<ChangeTaskStatusResponse>(`/api/tasks/${taskId}/assign-project`, {
    method: 'POST',
    body: { project_id: projectId },
    signal,
  })
}

export async function login(input: LoginInput, signal?: AbortSignal): Promise<AuthSessionResponse> {
  return apiRequest<AuthSessionResponse>('/api/auth/login', {
    method: 'POST',
    body: input,
    signal,
  })
}

export async function getSession(signal?: AbortSignal): Promise<AuthSessionResponse> {
  return apiRequest<AuthSessionResponse>('/api/auth/session', {
    method: 'GET',
    signal,
  })
}

export async function logout(signal?: AbortSignal): Promise<{ data: { success: boolean }; requestId?: string }> {
  return apiRequest<{ data: { success: boolean }; requestId?: string }>('/api/auth/logout', {
    method: 'POST',
    signal,
  })
}

export interface MetricsSummary {
  total: number
  blocked: number
  high_priority: number
  by_status: {
    TODO: number
    IN_PROGRESS: number
    REVIEW: number
    DONE: number
  }
}

export interface MetricsSummaryResponse {
  data: MetricsSummary
  requestId?: string
}

export interface MetricsQuery {
  from_date?: string
  to_date?: string
}

function toMetricsQueryString(query: MetricsQuery = {}) {
  const params = new URLSearchParams()

  if (query.from_date) params.set('from_date', query.from_date)
  if (query.to_date) params.set('to_date', query.to_date)

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export async function getMetricsSummary(query: MetricsQuery = {}, signal?: AbortSignal): Promise<MetricsSummaryResponse> {
  return apiRequest<MetricsSummaryResponse>(`/api/metrics/summary${toMetricsQueryString(query)}`, {
    method: 'GET',
    signal,
  })
}

export async function exportMetricsCsv(query: MetricsQuery = {}): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/metrics/export.csv${toMetricsQueryString(query)}`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    let payload: ApiErrorPayload = {}
    try {
      payload = (await response.json()) as ApiErrorPayload
    } catch {
      payload = { message: `HTTP ${response.status}` }
    }
    throw new ApiClientError(response.status, payload)
  }

  return response.blob()
}
