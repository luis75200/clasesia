export type ProjectStatus = 'ACTIVE' | 'ARCHIVED'

export interface ProjectOwner {
  id: string
  name: string
  handle: string
}

export interface ProjectDto {
  id: string
  name: string
  key: string
  description: string | null
  status: ProjectStatus
  owner: ProjectOwner
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface ListProjectsQuery {
  skip: number
  take: number
  status?: ProjectStatus
  search?: string
}

export interface ListProjectsResult {
  data: ProjectDto[]
  total: number
  skip: number
  take: number
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
